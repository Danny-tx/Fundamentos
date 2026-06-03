import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

// Hook que maneja la lógica de bloqueo de usuarios.
// Devuelve: lista de bloqueados, función para bloquear, función para desbloquear.
function useBlockedUsers() {
    const [blockedIds, setBlockedIds] = useState([])

    useEffect(() => {
        fetchBlocked()
    }, [])

    const fetchBlocked = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data } = await supabase
            .from('blocked_users')
            .select('blocked_id')
            .eq('blocker_id', user.id)

        if (data) {
            setBlockedIds(data.map(r => r.blocked_id))
        }
    }

    const blockUser = async (targetId) => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { error } = await supabase
            .from('blocked_users')
            .insert({ blocker_id: user.id, blocked_id: targetId })

        if (!error) {
            setBlockedIds(prev => [...prev, targetId])
        }
        return error
    }

    const unblockUser = async (targetId) => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { error } = await supabase
            .from('blocked_users')
            .delete()
            .eq('blocker_id', user.id)
            .eq('blocked_id', targetId)

        if (!error) {
            setBlockedIds(prev => prev.filter(id => id !== targetId))
        }
        return error
    }

    const isBlocked = (userId) => blockedIds.includes(userId)

    return { blockedIds, blockUser, unblockUser, isBlocked }
}

export default useBlockedUsers