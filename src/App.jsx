import { Routes,Route } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import Home from './pages/Home'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Profile from './pages/Profile'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/Register" element={<Register />} />
      <Route path="/ForgotPassword" element={<ForgotPassword />} />
      <Route path="/Home" element={
      <ProtectedRoute>
        <Home />
      </ProtectedRoute>
      } />
      <Route path="/profile" element={
      <ProtectedRoute>
      <Profile />
      </ProtectedRoute>
      } />
    </Routes>
  )
}

export default App
