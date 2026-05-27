import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import BinderList from './pages/BinderList'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/binderlist" element={
                  <ProtectedRoute>
                    <BinderList />
                  </ProtectedRoute>
                } />
            </Routes>
        </BrowserRouter>
    )
}

export default App
