import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

function Home() {
    const navigate = useNavigate()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        navigate('/')
    }
    
    return (
        <div>
            <h1>Bienvenido a Velochat</h1>
            <button onClick={handleLogout}>Cerrar sesion</button>
            <Link to="/profile">Ver mi perfil</Link>
        </div>
    )
}

export default Home