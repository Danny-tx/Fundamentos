import { useEffect, useRef, useState } from "react"
import { supabase } from "../lib/supabase"

/**
 * CallModal — Llamada de voz y videollamada peer-to-peer
 *
 * Esquema de canales Supabase Realtime:
 *   - `incoming-call-{targetUserId}` → el caller envía la oferta (call_offer)
 *   - `call-signal-{conversationId}` → canal compartido para answer, ICE, reject, end
 *
 * Props:
 *   conversationId  — ID de la conversación
 *   currentUser     — objeto del usuario local
 *   otherUserName   — nombre del otro participante
 *   targetUserId    — ID del destinatario (solo cuando isIncoming=false)
 *   mode            — 'audio' | 'video'
 *   isIncoming      — true si recibimos la llamada
 *   offer           — SDP offer recibido (solo cuando isIncoming=true)
 *   onClose         — callback para cerrar el modal
 */
export default function CallModal({
    conversationId,
    currentUser,
    otherUserName,
    targetUserId,
    mode,
    isIncoming = false,
    offer = null,
    onClose,
}) {
    const [status, setStatus] = useState(isIncoming ? "incoming" : "calling")
    const [isMuted, setIsMuted] = useState(false)
    const [isCamOff, setIsCamOff] = useState(false)
    const [elapsed, setElapsed] = useState(0)

    const localVideoRef = useRef(null)
    const remoteVideoRef = useRef(null)
    const pcRef = useRef(null)
    const localStreamRef = useRef(null)
    const signalChannelRef = useRef(null)
    const timerRef = useRef(null)

    const isVideo = mode === "video"

    const fmtTime = (s) =>
        `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`

    /* ── Canal compartido de señalización (ICE, answer, reject, end) ── */
    const getSignalChannel = () => {
        if (signalChannelRef.current) return signalChannelRef.current
        const ch = supabase.channel(`call-signal-${conversationId}`, {
            config: { broadcast: { self: false } },
        })
        signalChannelRef.current = ch
        return ch
    }

    const startTimer = () => {
        timerRef.current = setInterval(() => setElapsed((p) => p + 1), 1000)
    }

    /* ── Crear PeerConnection ── */
    const buildPC = () => {
        const pc = new RTCPeerConnection({
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" },
                { urls: "stun:stun1.l.google.com:19302" },
            ],
        })

        pc.onicecandidate = ({ candidate }) => {
            if (candidate) {
                getSignalChannel().send({
                    type: "broadcast",
                    event: "call_ice",
                    payload: { candidate },
                })
            }
        }

        pc.ontrack = ({ streams }) => {
            if (remoteVideoRef.current && streams[0]) {
                remoteVideoRef.current.srcObject = streams[0]
            }
        }

        pc.onconnectionstatechange = () => {
            if (pc.connectionState === "connected") {
                setStatus("connected")
                startTimer()
            }
            if (["disconnected", "failed", "closed"].includes(pc.connectionState)) {
                hangUp()
            }
        }

        pcRef.current = pc
        return pc
    }

    const getLocalStream = async () => {
        // Liberar cualquier stream previo antes de pedir uno nuevo
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((t) => t.stop())
            localStreamRef.current = null
        }
        const constraints = isVideo
            ? { audio: true, video: { width: 640, height: 480, facingMode: "user" } }
            : { audio: true, video: false }
        try {
            const stream = await navigator.mediaDevices.getUserMedia(constraints)
            localStreamRef.current = stream
            if (localVideoRef.current) localVideoRef.current.srcObject = stream
            return stream
        } catch (err) {
            // Si falla video, intentar solo audio como fallback
            if (isVideo && (err.name === "NotReadableError" || err.name === "NotAllowedError")) {
                console.warn("Cámara no disponible, usando solo audio:", err)
                const audioOnly = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
                localStreamRef.current = audioOnly
                return audioOnly
            }
            throw err
        }
    }

    /* ── Iniciar llamada saliente ── */
    const startCall = async () => {
        try {
            const stream = await getLocalStream()
            const pc = buildPC()
            stream.getTracks().forEach((t) => pc.addTrack(t, stream))

            // Escuchar answer e ICE en el canal de señalización compartido
            getSignalChannel()
                .on("broadcast", { event: "call_answer" }, async ({ payload }) => {
                    if (pc.signalingState !== "stable") {
                        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp))
                    }
                })
                .on("broadcast", { event: "call_ice" }, async ({ payload }) => {
                    try { await pc.addIceCandidate(new RTCIceCandidate(payload.candidate)) } catch (_) {}
                })
                .on("broadcast", { event: "call_reject" }, () => {
                    setStatus("rejected")
                    setTimeout(hangUp, 2000)
                })
                .on("broadcast", { event: "call_end" }, () => hangUp())
                .subscribe()

            const offerSDP = await pc.createOffer()
            await pc.setLocalDescription(offerSDP)

            // Enviar oferta al canal del destinatario específico
            const notifChannel = supabase.channel(`incoming-call-${targetUserId}`, {
                config: { broadcast: { self: false } },
            })
            await new Promise((resolve) => notifChannel.subscribe((status) => {
                if (status === "SUBSCRIBED") resolve()
            }))
            await notifChannel.send({
                type: "broadcast",
                event: "call_offer",
                payload: {
                    sdp: pc.localDescription,
                    mode,
                    conversationId,
                    callerName: currentUser?.user_metadata?.username || "Alguien",
                },
            })
            supabase.removeChannel(notifChannel)
        } catch (err) {
            console.error("Error iniciando llamada:", err)
            setStatus("error")
        }
    }

    /* ── Aceptar llamada entrante ── */
    const acceptCall = async () => {
        setStatus("connecting")
        try {
            const stream = await getLocalStream()
            const pc = buildPC()
            stream.getTracks().forEach((t) => pc.addTrack(t, stream))

            // Escuchar ICE del caller en el canal compartido
            getSignalChannel()
                .on("broadcast", { event: "call_ice" }, async ({ payload }) => {
                    try { await pc.addIceCandidate(new RTCIceCandidate(payload.candidate)) } catch (_) {}
                })
                .on("broadcast", { event: "call_end" }, () => hangUp())
                .subscribe()

            await pc.setRemoteDescription(new RTCSessionDescription(offer))
            const answer = await pc.createAnswer()
            await pc.setLocalDescription(answer)

            await getSignalChannel().send({
                type: "broadcast",
                event: "call_answer",
                payload: { sdp: pc.localDescription },
            })
        } catch (err) {
            console.error("Error aceptando llamada:", err)
            setStatus("error")
        }
    }

    const rejectCall = async () => {
        await getSignalChannel().send({ type: "broadcast", event: "call_reject", payload: {} })
        hangUp()
    }

    const hangUp = () => {
        clearInterval(timerRef.current)
        if (pcRef.current) { pcRef.current.close(); pcRef.current = null }
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((t) => t.stop())
        }
        if (signalChannelRef.current) {
            signalChannelRef.current.send({ type: "broadcast", event: "call_end", payload: {} })
            supabase.removeChannel(signalChannelRef.current)
            signalChannelRef.current = null
        }
        onClose()
    }

    const toggleMute = () => {
        if (!localStreamRef.current) return
        localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = isMuted))
        setIsMuted((p) => !p)
    }

    const toggleCam = () => {
        if (!localStreamRef.current) return
        localStreamRef.current.getVideoTracks().forEach((t) => (t.enabled = isCamOff))
        setIsCamOff((p) => !p)
    }

    useEffect(() => {
        if (!isIncoming) startCall()
        return () => {
            clearInterval(timerRef.current)
            if (localStreamRef.current)
                localStreamRef.current.getTracks().forEach((t) => t.stop())
            if (pcRef.current) pcRef.current.close()
            if (signalChannelRef.current)
                supabase.removeChannel(signalChannelRef.current)
        }
    }, [])

    /* ── Estilos ── */
    const overlay = {
        position: "fixed", inset: 0, zIndex: 2000,
        background: "rgba(0,0,0,0.88)", backdropFilter: "blur(12px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'DM Sans', sans-serif",
        animation: "fadeIn .2s ease",
    }
    const card = {
        background: "#111113", border: "1px solid #27272a",
        borderRadius: "24px", padding: "32px 28px",
        width: isVideo ? "580px" : "340px",
        maxWidth: "95vw", boxShadow: "0 32px 80px rgba(0,0,0,0.8)",
        display: "flex", flexDirection: "column", alignItems: "center", gap: "20px",
        animation: "slideUp .2s ease",
    }
    const circleBtn = (bg) => ({
        width: "56px", height: "56px", borderRadius: "50%",
        background: bg, border: "none", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "23px", transition: "transform .1s, filter .15s",
        boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
    })

    const statusText = {
        incoming: `Llamada entrante de ${otherUserName}`,
        calling: `Llamando a ${otherUserName}…`,
        connecting: "Conectando…",
        connected: fmtTime(elapsed),
        rejected: "Llamada rechazada",
        error: "Error al conectar",
    }[status] || ""

    const callCSS = `
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes slideUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        @keyframes pulse { 0%,100% { box-shadow:0 0 0 0 rgba(59,130,246,.6) } 50% { box-shadow:0 0 0 10px rgba(59,130,246,0) } }
        .call-ring { animation: pulse 1.4s ease infinite; }
        .call-btn:hover { filter: brightness(1.15); transform: scale(1.06); }
        .call-btn:active { transform: scale(0.96); }
    `

    return (
        <div style={overlay}>
            <style>{callCSS}</style>
            <div style={card}>
                {/* Avatar con ring animado cuando llega */}
                <div style={{ position: "relative" }}>
                    <div className={status === "incoming" || status === "calling" ? "call-ring" : ""}
                        style={{
                            width: "76px", height: "76px", borderRadius: "50%",
                            background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "32px", fontWeight: 700, color: "white",
                        }}>
                        {(otherUserName || "?")[0].toUpperCase()}
                    </div>
                    {/* Indicador de modo */}
                    <div style={{
                        position: "absolute", bottom: 0, right: 0,
                        width: "24px", height: "24px", borderRadius: "50%",
                        background: "#111113", border: "2px solid #111113",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "13px",
                    }}>
                        {isVideo ? "🎥" : "📞"}
                    </div>
                </div>

                <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "19px", fontWeight: 600, color: "#f4f4f5" }}>
                        {otherUserName}
                    </div>
                    <div style={{
                        fontSize: "13px", color: status === "connected" ? "#4ade80" : "#71717a",
                        marginTop: "4px", fontWeight: status === "connected" ? 600 : 400,
                    }}>
                        {statusText}
                    </div>
                </div>

                {/* Videos (solo videollamada) */}
                {isVideo && (
                    <div style={{
                        position: "relative", width: "100%", borderRadius: "16px",
                        overflow: "hidden", background: "#000", aspectRatio: "16/9",
                    }}>
                        <video ref={remoteVideoRef} autoPlay playsInline
                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                        <video ref={localVideoRef} autoPlay playsInline muted
                            style={{
                                position: "absolute", bottom: "12px", right: "12px",
                                width: "120px", height: "90px", objectFit: "cover",
                                borderRadius: "12px", border: "2px solid #27272a", background: "#111",
                            }} />
                        {status !== "connected" && (
                            <div style={{
                                position: "absolute", inset: 0, display: "flex",
                                alignItems: "center", justifyContent: "center",
                                color: "#52525b", fontSize: "14px", background: "rgba(0,0,0,0.5)",
                            }}>
                                {status === "incoming" ? "Acepta para ver el video" : "Esperando conexión…"}
                            </div>
                        )}
                    </div>
                )}

                {/* Audio remoto oculto */}
                {!isVideo && <video ref={remoteVideoRef} autoPlay playsInline style={{ display: "none" }} />}

                {/* ── Controles ── */}
                <div style={{ display: "flex", gap: "18px", alignItems: "center" }}>

                    {/* INCOMING: Rechazar */}
                    {status === "incoming" && (
                        <button className="call-btn" style={circleBtn("#ef4444")} onClick={rejectCall} title="Rechazar">
                            📵
                        </button>
                    )}

                    {/* INCOMING: Aceptar */}
                    {status === "incoming" && (
                        <button className="call-btn" style={circleBtn("#22c55e")} onClick={acceptCall} title="Aceptar">
                            📞
                        </button>
                    )}

                    {/* EN LLAMADA: Silenciar */}
                    {status === "connected" && (
                        <button className="call-btn" style={circleBtn(isMuted ? "#3b82f6" : "#27272a")}
                            onClick={toggleMute} title={isMuted ? "Activar micrófono" : "Silenciar"}>
                            {isMuted ? "🔇" : "🎙️"}
                        </button>
                    )}

                    {/* EN LLAMADA: Toggle cámara */}
                    {status === "connected" && isVideo && (
                        <button className="call-btn" style={circleBtn(isCamOff ? "#3b82f6" : "#27272a")}
                            onClick={toggleCam} title={isCamOff ? "Activar cámara" : "Apagar cámara"}>
                            {isCamOff ? "📷" : "🎥"}
                        </button>
                    )}

                    {/* Colgar (siempre visible cuando NO es incoming puro) */}
                    {status !== "incoming" && (
                        <button className="call-btn" style={circleBtn("#ef4444")} onClick={hangUp} title="Colgar">
                            📵
                        </button>
                    )}
                </div>

                {/* Subtexto de ayuda */}
                {status === "calling" && (
                    <p style={{ margin: 0, fontSize: "12px", color: "#3f3f46", textAlign: "center" }}>
                        El otro usuario recibirá una notificación de llamada
                    </p>
                )}
            </div>
        </div>
    )
}