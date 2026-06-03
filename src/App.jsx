import { Routes,Route } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Home from './pages/Home'
import Profile from './pages/Profile'
import Conversations from './pages/Conversations'
import Contacts from './pages/Contacts'
import NewConversation from './pages/NewConversations'
import Chat from './pages/Chat'
import ChangePassword from './pages/ChangePassword'
import OfflineIndicator from './components/OfflineIndicator'

function App() {
  return (
    <>
    <OfflineIndicator />
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
      <Route path="/conversations" element={
      <ProtectedRoute>
        <Conversations />
      </ProtectedRoute>
      } />
      <Route path="/contacts" element={
      <ProtectedRoute>
        <Contacts />
      </ProtectedRoute>
      } />
      <Route path="/chat/:id" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
      <Route path="/new-conversations" element={
      <ProtectedRoute>
        <NewConversation />
      </ProtectedRoute>
      } /> 
      <Route path="/reset-password" element={<ResetPassword/>} />
      <Route path="/change-password" element={
        <ProtectedRoute>
          <ChangePassword />
        </ProtectedRoute>
      } />
      </Routes>
    </>
  )
}

export default App