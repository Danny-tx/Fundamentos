import { useEffect, useRef, useState, useCallback } from "react"
import { supabase } from "../lib/supabase"

const BACKGROUNDS = [
  { id: "none",   label: "Sin fondo",  type: "none",  preview: "🚫" },
  { id: "blur",   label: "Desenfoque", type: "blur",  preview: "🌫️" },
  { id: "office", label: "Oficina",    type: "image", preview: "🏢",
    url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1280&q=80" },
  { id: "beach",  label: "Playa",      type: "image", preview: "🏖️",
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1280&q=80" },
  { id: "space",  label: "Espacio",    type: "image", preview: "🌌",
    url: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1280&q=80" },
  { id: "forest", label: "Naturaleza", type: "image", preview: "🌿",
    url: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1280&q=80" },
  { id: "red",    label: "Rojo",       type: "color", preview: "🟥", color: "#b91c1c" },
  { id: "blue",   label: "Azul",       type: "color", preview: "🟦", color: "#1d4ed8" },
  { id: "green",  label: "Verde",      type: "color", preview: "🟩", color: "#15803d" },
  { id: "purple", label: "Morado",     type: "color", preview: "🟪", color: "#7e22ce" },
  { id: "black",  label: "Negro",      type: "color", preview: "⬛", color: "#0a0a0a" },
]

const FILTERS = [
  { id: "none",    label: "Normal",     css: "none" },
  { id: "bw",      label: "B&N",        css: "grayscale(100%)" },
  { id: "sepia",   label: "Sepia",      css: "sepia(80%) saturate(120%) brightness(1.05)" },
  { id: "bright",  label: "Brillante",  css: "brightness(1.3) contrast(1.1) saturate(1.2)" },
  { id: "cool",    label: "Frío",       css: "hue-rotate(200deg) saturate(1.3) brightness(0.95)" },
  { id: "warm",    label: "Cálido",     css: "sepia(30%) saturate(140%) hue-rotate(-15deg) brightness(1.05)" },
  { id: "frog",    label: "🐸 Rana",    css: "saturate(1.4) hue-rotate(80deg)",   overlay: "frog" },
  { id: "dog",     label: "🐶 Perro",   css: "saturate(1.1) brightness(1.05)",    overlay: "dog" },
  { id: "rainbow", label: "🌈 Arcoíris",css: "saturate(1.6) brightness(1.1)",    overlay: "rainbow" },
  { id: "fire",    label: "🔥 Fuego",   css: "saturate(1.5) hue-rotate(-20deg) brightness(1.1)", overlay: "fire" },
]

const OVERLAYS = {
  frog: (ctx, w, h) => {
    ctx.save(); ctx.globalAlpha = 0.85
    [[0.33,0.30],[0.67,0.30]].forEach(([x,y]) => {
      ctx.beginPath(); ctx.arc(w*x,h*y,w*0.07,0,Math.PI*2); ctx.fillStyle="#22c55e"; ctx.fill()
      ctx.beginPath(); ctx.arc(w*x,h*y,w*0.04,0,Math.PI*2); ctx.fillStyle="#000"; ctx.fill()
      ctx.beginPath(); ctx.arc(w*x-w*0.02,h*y-h*0.015,w*0.012,0,Math.PI*2); ctx.fillStyle="#fff"; ctx.fill()
    })
    ctx.beginPath(); ctx.moveTo(w*0.35,h*0.65); ctx.quadraticCurveTo(w*0.5,h*0.73,w*0.65,h*0.65)
    ctx.lineWidth=w*0.018; ctx.strokeStyle="#166534"; ctx.stroke()
    ctx.restore()
  },
  dog: (ctx, w, h) => {
    ctx.save(); ctx.globalAlpha = 0.9
    ctx.beginPath(); ctx.ellipse(w*0.18,h*0.22,w*0.10,h*0.14,-0.4,0,Math.PI*2); ctx.fillStyle="#92400e"; ctx.fill()
    ctx.beginPath(); ctx.ellipse(w*0.82,h*0.22,w*0.10,h*0.14,0.4,0,Math.PI*2); ctx.fillStyle="#92400e"; ctx.fill()
    ctx.beginPath(); ctx.ellipse(w*0.5,h*0.58,w*0.07,h*0.04,0,0,Math.PI*2); ctx.fillStyle="#1c1917"; ctx.fill()
    ctx.beginPath(); ctx.arc(w*0.475,h*0.565,w*0.015,0,Math.PI*2); ctx.fillStyle="#fff"; ctx.fill()
    ctx.beginPath(); ctx.ellipse(w*0.5,h*0.72,w*0.06,h*0.07,0,0,Math.PI*2); ctx.fillStyle="#f43f5e"; ctx.fill()
    ctx.restore()
  },
  rainbow: (ctx, w, h) => {
    ctx.save()
    ["#ef4444","#f97316","#eab308","#22c55e","#3b82f6","#8b5cf6"].forEach((c,i)=>{
      ctx.globalAlpha=0.65; ctx.fillStyle=c; ctx.fillRect(0,h*0.38+i*h*0.048,w,h*0.05)
    })
    ctx.restore()
  },
  fire: (ctx, w, h) => {
    ctx.save()
    [[0.3,0.0,0.08,"#ef4444"],[0.5,-0.06,0.10,"#f97316"],[0.7,0.0,0.08,"#ef4444"],[0.4,-0.09,0.07,"#fbbf24"],[0.6,-0.07,0.07,"#fbbf24"]].forEach(([x,y,r,c])=>{
      const g=ctx.createRadialGradient(w*x,h*y,0,w*x,h*y,w*r*1.6)
      g.addColorStop(0,c); g.addColorStop(1,"transparent")
      ctx.globalAlpha=0.85; ctx.beginPath(); ctx.arc(w*x,h*y,w*r*1.6,0,Math.PI*2); ctx.fillStyle=g; ctx.fill()
    })
    ctx.restore()
  },
}

export default function CallModal({
  conversationId, currentUser, otherUserName, targetUserId,
  mode, isIncoming=false, offer=null, onClose,
}) {
  const [status, setStatus]               = useState(isIncoming ? "incoming" : "calling")
  const [isMuted, setIsMuted]             = useState(false)
  const [isCamOff, setIsCamOff]           = useState(false)
  const [elapsed, setElapsed]             = useState(0)
  const [showPanel, setShowPanel]         = useState(false)
  const [activeTab, setActiveTab]         = useState("bg")
  const [selectedBg, setSelectedBg]       = useState("none")
  const [selectedFilter, setSelectedFilter] = useState("none")
  const [segStatus, setSegStatus]         = useState("idle") // idle | loading | ready | failed

  const localVideoRef   = useRef(null)
  const remoteVideoRef  = useRef(null)
  const canvasRef       = useRef(null)
  const overlayRef      = useRef(null)
  const pcRef           = useRef(null)
  const localStreamRef  = useRef(null)
  const signalChannelRef = useRef(null)
  const timerRef        = useRef(null)
  const animFrameRef    = useRef(null)
  const bgImgRef        = useRef(null)
  const bgRef           = useRef("none")
  const filterRef       = useRef("none")
  const segRef          = useRef(null)      // instancia SelfieSegmentation
  const rawVidRef       = useRef(null)      // video element crudo para segmentación

  const isVideo = mode === "video"
  const fmtTime = s => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`

  /* ── Cargar MediaPipe SelfieSegmentation desde npm ── */
  useEffect(() => {
    if (!isVideo) return
    let cancelled = false
    const load = async () => {
      setSegStatus("loading")
      try {
        const { SelfieSegmentation } = await import("@mediapipe/selfie_segmentation")
        const seg = new SelfieSegmentation({
          locateFile: (file) => {
            return `/${file}`
          }
        })
        seg.setOptions({ modelSelection: 1, selfieMode: true })
        await seg.initialize()
        if (cancelled) { seg.close(); return }
        segRef.current = seg
        setSegStatus("ready")
      } catch(e) {
        console.warn("MediaPipe falló:", e)
        if (!cancelled) setSegStatus("failed")
      }
    }
    load()
    return () => {
      cancelled = true
      if (segRef.current) { segRef.current.close(); segRef.current = null }
    }
  }, [isVideo])

  /* ── Señalización ── */
  const getSignalChannel = () => {
    if (signalChannelRef.current) return signalChannelRef.current
    const ch = supabase.channel(`call-signal-${conversationId}`, { config: { broadcast: { self: false } } })
    signalChannelRef.current = ch
    return ch
  }

  /* ── PeerConnection ── */
  const buildPC = () => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls:"stun:stun.l.google.com:19302"},{ urls:"stun:stun1.l.google.com:19302"}]
    })
    pc.onicecandidate = ({ candidate }) => {
      if (candidate) getSignalChannel().send({ type:"broadcast", event:"call_ice", payload:{ candidate } })
    }
    pc.ontrack = ({ streams }) => {
      if (remoteVideoRef.current && streams[0]) remoteVideoRef.current.srcObject = streams[0]
    }
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") {
        setStatus("connected")
        timerRef.current = setInterval(()=>setElapsed(p=>p+1),1000)
      }
      if (["disconnected","failed","closed"].includes(pc.connectionState)) hangUp()
    }
    pcRef.current = pc
    return pc
  }

  const loadBgImage = (bgId) => {
    const bg = BACKGROUNDS.find(b => b.id === bgId)
    if (bg?.type === "image") {
      const img = new Image(); img.crossOrigin = "anonymous"
      img.onload = () => { bgImgRef.current = img }
      img.src = bg.url
    } else { bgImgRef.current = null }
  }

  const changeBg     = (id) => { setSelectedBg(id);     bgRef.current = id;     loadBgImage(id) }
  const changeFilter = (id) => { setSelectedFilter(id); filterRef.current = id }

  /* ── Loop canvas con segmentación MediaPipe real ── */
  const startCanvasLoop = useCallback(async (rawStream) => {
    const canvas  = canvasRef.current
    const overlay = overlayRef.current
    if (!canvas) return rawStream

    const W = 640, H = 480
    canvas.width = W; canvas.height = H
    if (overlay) { overlay.width = W; overlay.height = H }

    const ctx  = canvas.getContext("2d")
    const octx = overlay?.getContext("2d")

    // Video element para el stream crudo
    const vid = document.createElement("video")
    vid.srcObject = rawStream; vid.autoplay = true; vid.playsInline = true; vid.muted = true
    rawVidRef.current = vid
    await new Promise(res => {
      vid.onloadedmetadata = () => res()
      if (vid.readyState >= 2) res()
    })
    await vid.play().catch(()=>{})

    // Canvas temporal para persona recortada
    const personCv  = document.createElement("canvas"); personCv.width=W; personCv.height=H
    const personCtx = personCv.getContext("2d")
    // Canvas para fondo desenfocado
    const blurCv  = document.createElement("canvas"); blurCv.width=W; blurCv.height=H
    const blurCtx = blurCv.getContext("2d")
    // Canvas para máscara suavizada
    const maskCv  = document.createElement("canvas"); maskCv.width=W; maskCv.height=H
    const maskCtx = maskCv.getContext("2d")

    // Resultado de segmentación más reciente
    let lastMask = null

    // Configurar callback de segmentación
    if (segRef.current) {
      segRef.current.onResults((results) => {
        lastMask = results.segmentationMask
      })
    }

    let frameCount = 0
    const SEG_EVERY = 2 // segmentar cada N frames para rendimiento

    const drawFrame = async () => {
      if (vid.readyState < 2) { animFrameRef.current = requestAnimationFrame(drawFrame); return }

      const bg   = bgRef.current
      const fid  = filterRef.current
      const fDef = FILTERS.find(f => f.id === fid) || FILTERS[0]
      frameCount++

      // Enviar frame al segmentador cada N frames
      if (segRef.current && bg !== "none" && frameCount % SEG_EVERY === 0) {
        try { await segRef.current.send({ image: vid }) } catch(_) {}
      }

      ctx.clearRect(0, 0, W, H)

      if (bg === "none" || !segRef.current || !lastMask) {
        // Sin fondo o sin segmentación: dibujar directo
        ctx.filter = fDef.css !== "none" ? fDef.css : "none"
        ctx.drawImage(vid, 0, 0, W, H)
        ctx.filter = "none"

      } else {
        // ── SEGMENTACIÓN REAL ──
        // 1. Preparar máscara suavizada
        maskCtx.clearRect(0, 0, W, H)
        maskCtx.drawImage(lastMask, 0, 0, W, H)

        // 2. Dibujar FONDO
        const bgDef = BACKGROUNDS.find(b => b.id === bg)
        if (bg === "blur") {
          blurCtx.filter = "blur(20px)"
          blurCtx.drawImage(vid, -30, -30, W+60, H+60)
          blurCtx.filter = "none"
          ctx.drawImage(blurCv, 0, 0)
        } else if (bgDef?.type === "color") {
          ctx.fillStyle = bgDef.color
          ctx.fillRect(0, 0, W, H)
        } else if (bgImgRef.current) {
          ctx.drawImage(bgImgRef.current, 0, 0, W, H)
        } else {
          ctx.fillStyle = "#000"
          ctx.fillRect(0, 0, W, H)
        }

        // 3. Dibujar PERSONA usando máscara como clipping
        personCtx.clearRect(0, 0, W, H)
        // Dibujar frame original con filtro
        personCtx.filter = fDef.css !== "none" ? fDef.css : "none"
        personCtx.drawImage(vid, 0, 0, W, H)
        personCtx.filter = "none"
        // Aplicar máscara: la máscara de MediaPipe es blanco=persona, negro=fondo
        personCtx.globalCompositeOperation = "destination-in"
        personCtx.drawImage(lastMask, 0, 0, W, H)
        personCtx.globalCompositeOperation = "source-over"

        // 4. Compositar persona sobre fondo
        ctx.drawImage(personCv, 0, 0)
      }

      // Overlay de cara
      if (fDef.overlay && OVERLAYS[fDef.overlay] && octx) {
        octx.clearRect(0, 0, W, H)
        OVERLAYS[fDef.overlay](octx, W, H)
        ctx.drawImage(overlay, 0, 0)
      }

      animFrameRef.current = requestAnimationFrame(drawFrame)
    }

    drawFrame()

    // Stream procesado desde canvas + audio original
    const processed = canvas.captureStream(30)
    rawStream.getAudioTracks().forEach(t => processed.addTrack(t))
    if (localVideoRef.current) localVideoRef.current.srcObject = processed
    return processed
  }, [])

  /* ── Stream de cámara ── */
  const getLocalStream = async () => {
    if (localStreamRef.current) { localStreamRef.current.getTracks().forEach(t=>t.stop()); localStreamRef.current=null }
    const constraints = isVideo
      ? { audio:true, video:{ width:640, height:480, facingMode:"user" } }
      : { audio:true, video:false }
    try {
      const s = await navigator.mediaDevices.getUserMedia(constraints)
      localStreamRef.current = s; return s
    } catch(err) {
      if (isVideo) {
        const a = await navigator.mediaDevices.getUserMedia({ audio:true, video:false })
        localStreamRef.current = a; return a
      }
      throw err
    }
  }

  const startCall = async () => {
    try {
      const raw = await getLocalStream()
      let toSend = raw
      if (isVideo) toSend = (await startCanvasLoop(raw)) || raw
      const pc = buildPC()
      toSend.getTracks().forEach(t => pc.addTrack(t, toSend))
      getSignalChannel()
        .on("broadcast",{ event:"call_answer" }, async ({ payload }) => {
          if (pc.signalingState !== "stable") await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp))
        })
        .on("broadcast",{ event:"call_ice" }, async ({ payload }) => {
          try { await pc.addIceCandidate(new RTCIceCandidate(payload.candidate)) } catch(_) {}
        })
        .on("broadcast",{ event:"call_reject" }, () => { setStatus("rejected"); setTimeout(hangUp,2000) })
        .on("broadcast",{ event:"call_end" }, () => hangUp())
        .subscribe()
      const offerSDP = await pc.createOffer()
      await pc.setLocalDescription(offerSDP)
      const notifCh = supabase.channel(`incoming-call-${targetUserId}`, { config:{ broadcast:{ self:false } } })
      await new Promise(res => notifCh.subscribe(s => { if(s==="SUBSCRIBED") res() }))
      await notifCh.send({ type:"broadcast", event:"call_offer", payload:{
        sdp: pc.localDescription, mode, conversationId,
        callerName: currentUser?.user_metadata?.username || "Alguien",
      }})
      supabase.removeChannel(notifCh)
    } catch(err) { console.error("Error iniciando:", err); setStatus("error") }
  }

  const acceptCall = async () => {
    setStatus("connecting")
    try {
      const raw = await getLocalStream()
      let toSend = raw
      if (isVideo) toSend = (await startCanvasLoop(raw)) || raw
      const pc = buildPC()
      toSend.getTracks().forEach(t => pc.addTrack(t, toSend))
      getSignalChannel()
        .on("broadcast",{ event:"call_ice" }, async ({ payload }) => {
          try { await pc.addIceCandidate(new RTCIceCandidate(payload.candidate)) } catch(_) {}
        })
        .on("broadcast",{ event:"call_end" }, () => hangUp())
        .subscribe()
      await pc.setRemoteDescription(new RTCSessionDescription(offer))
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      await getSignalChannel().send({ type:"broadcast", event:"call_answer", payload:{ sdp:pc.localDescription } })
    } catch(err) { console.error("Error aceptando:", err); setStatus("error") }
  }

  const rejectCall = async () => {
    await getSignalChannel().send({ type:"broadcast", event:"call_reject", payload:{} })
    hangUp()
  }

  const hangUp = () => {
    clearInterval(timerRef.current)
    cancelAnimationFrame(animFrameRef.current)
    if (pcRef.current) { pcRef.current.close(); pcRef.current=null }
    if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t=>t.stop())
    if (rawVidRef.current) { rawVidRef.current.srcObject=null }
    if (signalChannelRef.current) {
      signalChannelRef.current.send({ type:"broadcast", event:"call_end", payload:{} })
      supabase.removeChannel(signalChannelRef.current); signalChannelRef.current=null
    }
    onClose()
  }

  const toggleMute = () => {
    if (!localStreamRef.current) return
    localStreamRef.current.getAudioTracks().forEach(t => t.enabled=isMuted)
    setIsMuted(p=>!p)
  }
  const toggleCam = () => {
    if (!localStreamRef.current) return
    localStreamRef.current.getVideoTracks().forEach(t => t.enabled=isCamOff)
    setIsCamOff(p=>!p)
  }

  useEffect(() => {
    if (!isIncoming) startCall()
    return () => {
      clearInterval(timerRef.current)
      cancelAnimationFrame(animFrameRef.current)
      if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t=>t.stop())
      if (pcRef.current) pcRef.current.close()
      if (signalChannelRef.current) supabase.removeChannel(signalChannelRef.current)
    }
  }, [])

  const fDef = FILTERS.find(f => f.id === selectedFilter) || FILTERS[0]
  const statusText = {
    incoming:`Llamada entrante de ${otherUserName}`, calling:`Llamando a ${otherUserName}…`,
    connecting:"Conectando…", connected:fmtTime(elapsed), rejected:"Llamada rechazada", error:"Error al conectar",
  }[status] || ""

  const css = `
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    @keyframes slideUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
    @keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(59,130,246,.6)}50%{box-shadow:0 0 0 12px rgba(59,130,246,0)}}
    @keyframes spin{to{transform:rotate(360deg)}}
    .call-ring{animation:pulse 1.4s ease infinite}
    .call-btn:hover{filter:brightness(1.18);transform:scale(1.07)}
    .call-btn:active{transform:scale(0.95)}
    .bg-tile:hover,.filter-tile:hover{border-color:#3b82f6!important}
    .seg-spinner{display:inline-block;width:10px;height:10px;border:2px solid #3b82f6;border-top-color:transparent;border-radius:50%;animation:spin .7s linear infinite;margin-right:6px}
  `

  return (
    <div style={{ position:"fixed",inset:0,zIndex:2000,background:"rgba(0,0,0,0.92)",backdropFilter:"blur(14px)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif",animation:"fadeIn .2s ease" }}>
      <style>{css}</style>
      <div style={{ background:"#111113",border:"1px solid #27272a",borderRadius:"24px",padding:"28px 24px",width:isVideo?"640px":"360px",maxWidth:"96vw",maxHeight:"95vh",overflowY:"auto",boxShadow:"0 32px 80px rgba(0,0,0,0.85)",display:"flex",flexDirection:"column",alignItems:"center",gap:"18px",animation:"slideUp .2s ease" }}>

        {/* Avatar */}
        <div style={{ position:"relative" }}>
          <div className={status==="incoming"||status==="calling"?"call-ring":""} style={{ width:"72px",height:"72px",borderRadius:"50%",background:"linear-gradient(135deg,#3b82f6,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"30px",fontWeight:700,color:"white" }}>
            {(otherUserName||"?")[0].toUpperCase()}
          </div>
          <div style={{ position:"absolute",bottom:0,right:0,width:"22px",height:"22px",borderRadius:"50%",background:"#111113",border:"2px solid #111113",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"12px" }}>
            {isVideo?"🎥":"📞"}
          </div>
        </div>

        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:"18px",fontWeight:700,color:"#f4f4f5" }}>{otherUserName}</div>
          <div style={{ fontSize:"13px",marginTop:"4px",fontWeight:status==="connected"?600:400,color:status==="connected"?"#4ade80":"#71717a" }}>{statusText}</div>
          {isVideo && segStatus==="loading" && (
            <div style={{ fontSize:"11px",color:"#3b82f6",marginTop:"4px",display:"flex",alignItems:"center",justifyContent:"center" }}>
              <span className="seg-spinner"></span>Cargando efectos de fondo…
            </div>
          )}
          {isVideo && segStatus==="ready" && selectedBg!=="none" && (
            <div style={{ fontSize:"11px",color:"#4ade80",marginTop:"4px" }}>✓ Segmentación activa</div>
          )}
          {isVideo && segStatus==="failed" && (
            <div style={{ fontSize:"11px",color:"#f87171",marginTop:"4px" }}>⚠ Fondos en modo básico</div>
          )}
        </div>

        {/* Videos */}
        {isVideo && (
          <div style={{ position:"relative",width:"100%",borderRadius:"16px",overflow:"hidden",background:"#000",aspectRatio:"16/9" }}>
            <video ref={remoteVideoRef} autoPlay playsInline style={{ width:"100%",height:"100%",objectFit:"cover",display:"block" }} />
            <canvas ref={canvasRef} style={{ display:"none" }} />
            <canvas ref={overlayRef} style={{ display:"none" }} />
            <video ref={localVideoRef} autoPlay playsInline muted style={{ position:"absolute",bottom:"12px",right:"12px",width:"120px",height:"90px",objectFit:"cover",borderRadius:"12px",border:"2px solid #27272a",background:"#111" }} />
            {status!=="connected" && (
              <div style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",color:"#52525b",fontSize:"14px",background:"rgba(0,0,0,0.5)" }}>
                {status==="incoming"?"Acepta para ver el video":"Esperando conexión…"}
              </div>
            )}
          </div>
        )}
        {!isVideo && <video ref={remoteVideoRef} autoPlay playsInline style={{ display:"none" }} />}

        {/* Panel */}
        {isVideo && showPanel && (
          <div style={{ width:"100%",background:"#18181b",borderRadius:"16px",border:"1px solid #2e2e33",overflow:"hidden",animation:"fadeIn .15s ease" }}>
            <div style={{ display:"flex",borderBottom:"1px solid #2e2e33" }}>
              {[["bg","🖼️ Fondos"],["filter","✨ Filtros"]].map(([tab,label])=>(
                <button key={tab} onClick={()=>setActiveTab(tab)} style={{ flex:1,padding:"10px",background:"none",border:"none",color:activeTab===tab?"#f4f4f5":"#52525b",borderBottom:activeTab===tab?"2px solid #3b82f6":"2px solid transparent",cursor:"pointer",fontSize:"13px",fontWeight:600,fontFamily:"inherit" }}>{label}</button>
              ))}
            </div>

            {activeTab==="bg" && (
              <div style={{ padding:"14px",display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"8px" }}>
                {BACKGROUNDS.map(bg=>(
                  <button key={bg.id} className="bg-tile" onClick={()=>changeBg(bg.id)} style={{ padding:"10px 4px",borderRadius:"10px",border:`2px solid ${selectedBg===bg.id?"#3b82f6":"#2e2e33"}`,background:selectedBg===bg.id?"rgba(59,130,246,0.12)":"#111113",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:"4px",transition:"border-color .15s",opacity:segStatus==="loading"&&bg.id!=="none"?0.6:1 }}>
                    {bg.type==="image"
                      ? <div style={{ width:"40px",height:"28px",borderRadius:"6px",overflow:"hidden" }}><img src={bg.url} alt={bg.label} style={{ width:"100%",height:"100%",objectFit:"cover" }} /></div>
                      : <span style={{ fontSize:"22px",lineHeight:1 }}>{bg.preview}</span>
                    }
                    <span style={{ fontSize:"11px",color:selectedBg===bg.id?"#93c5fd":"#71717a",fontWeight:500 }}>{bg.label}</span>
                  </button>
                ))}
              </div>
            )}

            {activeTab==="filter" && (
              <div style={{ padding:"14px",display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"8px" }}>
                {FILTERS.map(f=>(
                  <button key={f.id} className="filter-tile" onClick={()=>changeFilter(f.id)} style={{ padding:"10px 6px",borderRadius:"10px",border:`2px solid ${selectedFilter===f.id?"#3b82f6":"#2e2e33"}`,background:selectedFilter===f.id?"rgba(59,130,246,0.12)":"#111113",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:"4px",transition:"border-color .15s" }}>
                    <div style={{ width:"44px",height:"44px",borderRadius:"50%",background:"linear-gradient(135deg,#3b82f6,#8b5cf6)",filter:f.css!=="none"?f.css:"none",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"20px" }}>
                      {f.overlay?{frog:"🐸",dog:"🐶",rainbow:"🌈",fire:"🔥"}[f.overlay]:"😊"}
                    </div>
                    <span style={{ fontSize:"11px",color:selectedFilter===f.id?"#93c5fd":"#71717a",fontWeight:500 }}>{f.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Controles */}
        <div style={{ display:"flex",gap:"14px",alignItems:"center",flexWrap:"wrap",justifyContent:"center" }}>
          {isVideo && status!=="incoming" && (
            <button className="call-btn" onClick={()=>setShowPanel(p=>!p)} title="Fondos y filtros" style={{ width:"48px",height:"48px",borderRadius:"50%",border:"none",background:showPanel?"#3b82f6":"#27272a",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"20px",transition:"background .15s,transform .1s" }}>🪄</button>
          )}
          {status==="incoming" && <>
            <button className="call-btn" onClick={rejectCall} style={{ width:"56px",height:"56px",borderRadius:"50%",border:"none",background:"#ef4444",cursor:"pointer",fontSize:"22px",display:"flex",alignItems:"center",justifyContent:"center",transition:"filter .15s,transform .1s" }}>📵</button>
            <button className="call-btn" onClick={acceptCall} style={{ width:"56px",height:"56px",borderRadius:"50%",border:"none",background:"#22c55e",cursor:"pointer",fontSize:"22px",display:"flex",alignItems:"center",justifyContent:"center",transition:"filter .15s,transform .1s" }}>📞</button>
          </>}
          {status==="connected" && <>
            <button className="call-btn" onClick={toggleMute} style={{ width:"48px",height:"48px",borderRadius:"50%",border:"none",background:isMuted?"#3b82f6":"#27272a",cursor:"pointer",fontSize:"20px",display:"flex",alignItems:"center",justifyContent:"center",transition:"background .15s,filter .15s,transform .1s" }}>{isMuted?"🔇":"🎙️"}</button>
            {isVideo&&<button className="call-btn" onClick={toggleCam} style={{ width:"48px",height:"48px",borderRadius:"50%",border:"none",background:isCamOff?"#3b82f6":"#27272a",cursor:"pointer",fontSize:"20px",display:"flex",alignItems:"center",justifyContent:"center",transition:"background .15s,filter .15s,transform .1s" }}>{isCamOff?"📷":"🎥"}</button>}
          </>}
          {status!=="incoming" && (
            <button className="call-btn" onClick={hangUp} style={{ width:"56px",height:"56px",borderRadius:"50%",border:"none",background:"#ef4444",cursor:"pointer",fontSize:"22px",display:"flex",alignItems:"center",justifyContent:"center",transition:"filter .15s,transform .1s" }}>📵</button>
          )}
        </div>

        {status==="calling" && <p style={{ margin:0,fontSize:"12px",color:"#3f3f46",textAlign:"center" }}>El otro usuario recibirá una notificación de llamada</p>}
      </div>
    </div>
  )
}