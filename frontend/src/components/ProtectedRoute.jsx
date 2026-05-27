import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function ProtectedRoute({ children }) {
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        const checkAuth = async () => {
            const response = await fetch('http://localhost:5000/auth/check', {
                method: 'GET',
                credentials: 'include', //essential for flask login sessions
            })
            const data = await response.json()

            setLoading(false)

            // check directly from route rather than authenticate state so that data is readily available (else it has to wait for next render)
            if (!data.authenticated) {
                navigate('/login', { state: { message: "User not authenticated, please login to continue" } })
            }
        }
        checkAuth()
    }, [])
    
    return (
        loading
            ? <p>Loading...</p>
            : children
    )
}

export default ProtectedRoute