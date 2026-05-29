import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import BinderList from './pages/BinderList'
import Binder from './pages/Binder'
import Page from './pages/Page'
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
                <Route path="/binder/:id" element={
                  <ProtectedRoute>
                    <Binder />
                  </ProtectedRoute>
                } />
                <Route path="/binder/:id/page/:number" element={
                  <ProtectedRoute>
                    <Page />
                  </ProtectedRoute>
                } />
            </Routes>
        </BrowserRouter>
    )
}

export default App
