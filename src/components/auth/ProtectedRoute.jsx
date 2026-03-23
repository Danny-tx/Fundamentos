import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useNavigate } from "react-router-dom";

function ProtectedRoute({children}) {
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        supabase.auth.getSession().then(({data:{session}})=>{
            if (!session) {
                navigate('/')
            }
            setLoading(false)
        })
    }, [] )
    if (loading) return <p>Cargando...</p>

    return children
}

export default ProtectedRoute