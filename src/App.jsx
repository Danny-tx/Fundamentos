import { Routes, Route } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
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
import ChangePassword from './pages/Changepassword'
import OfflineIndicator from './components/OfflineIndicator'
import AdminDashboard from './pages/AdminDashboard'
import CallModal from './components/CallModal'

function App() {
  const [incomingCall, setIncomingCall] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    let callChannel

    const setup = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setCurrentUser(user)

      callChannel = supabase
        .channel(`incoming-call-${user.id}`, { config: { broadcast: { self: false } } })
        .on('broadcast', { event: 'call_offer' }, ({ payload }) => {
          if (payload?.callerName && payload?.sdp && payload?.conversationId) {
            setIncomingCall({
              mode: payload.mode || 'audio',
              offer: payload.sdp,
              otherUserName: payload.callerName,
              conversationId: payload.conversationId,
            })
          }
        })
        .subscribe()
    }

    setup()
    return () => { if (callChannel) supabase.removeChannel(callChannel) }
  }, [])

  return (
    <>
      <OfflineIndicator />
      {incomingCall && currentUser && (
        <CallModal
          conversationId={incomingCall.conversationId}
          currentUser={currentUser}
          otherUserName={incomingCall.otherUserName}
          targetUserId={null}
          mode={incomingCall.mode}
          isIncoming={true}
          offer={incomingCall.offer}
          onClose={() => setIncomingCall(null)}
        />
      )}
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/Register" element={<Register />} />
        <Route path="/ForgotPassword" element={<ForgotPassword />} />
        <Route path="/Home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/conversations" element={<ProtectedRoute><Conversations /></ProtectedRoute>} />
        <Route path="/contacts" element={<ProtectedRoute><Contacts /></ProtectedRoute>} />
        <Route path="/chat/:id" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path="/new-conversations" element={<ProtectedRoute><NewConversation /></ProtectedRoute>} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
      </Routes>
    </>
  )
}

export default App