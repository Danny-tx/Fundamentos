import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

// Hook que maneja el silencio de conversaciones por usuario.
// Guarda las conversaciones silenciadas en localStorage para no necesitar tabla extra.
// Si ya tienes una tabla conversation_participants con columna "muted",
// puedes reemplazar el localStorage por llamadas a Supabase.
function useMutedConversations() {
    const [mutedIds, setMutedIds] = useState(() => {
        try {
            const stored = localStorage.getItem('muted_conversations')
            return stored ? JSON.parse(stored) : []
        } catch {
            return []
        }
    })

    // Sincronizar con localStorage cada vez que cambie
    useEffect(() => {
        localStorage.setItem('muted_conversations', JSON.stringify(mutedIds))
    }, [mutedIds])

    const muteConversation = (conversationId) => {
        setMutedIds(prev => {
            if (prev.includes(conversationId)) return prev
            return [...prev, conversationId]
        })
    }

    const unmuteConversation = (conversationId) => {
        setMutedIds(prev => prev.filter(id => id !== conversationId))
    }

    const toggleMute = (conversationId) => {
        if (mutedIds.includes(conversationId)) {
            unmuteConversation(conversationId)
        } else {
            muteConversation(conversationId)
        }
    }

    const isMuted = (conversationId) => mutedIds.includes(conversationId)

    return { mutedIds, muteConversation, unmuteConversation, toggleMute, isMuted }
}

export default useMutedConversations