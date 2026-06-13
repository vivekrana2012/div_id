import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import HomePage from '@/pages/HomePage'
import DraftsPage from '@/pages/DraftsPage'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import PostPage from '@/pages/PostPage'
import EditorPage from '@/pages/EditorPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<ProtectedRoute><DraftsPage /></ProtectedRoute>} />
          <Route path="/articles" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/posts/:id" element={<PostPage />} />
          <Route path="/editor" element={<ProtectedRoute><EditorPage /></ProtectedRoute>} />
          <Route path="/editor/:id" element={<ProtectedRoute><EditorPage /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
