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
        <h1 style={{color: "yellow"}}>Bienvenido a Velochat</h1>
            <p><Link to="/profile">Ver mi perfil</Link></p>
            <p><Link to="/conversations">Ver conversaciones</Link></p>
            <p><Link to="/contacts">Ver contactos</Link></p>
            <p></p>
            <button onClick={handleLogout}>Cerrar sesion</button>
            <p></p>
        </div>
    )
}

export default Home