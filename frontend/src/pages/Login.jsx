import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

function Login() {
    const navigate = useNavigate()
    const location = useLocation()

    //first value is the current value, second value is the function to update; '' is the initial value starting username with an empty string
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [successMessage, setSuccessMessage] = useState('')
    useEffect(() => {
        //when the component first loads store the meesage if there exists one in router state
        if (location.state?.message) {
            setSuccessMessage(location.state.message)
            }
        }, [])

    const handleLogin = async () => {
    //call the backend
    const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', //essential for flask login sessions
        body: JSON.stringify({ username, password })
    })
        const data = await response.json()

        if (response.ok) {
            navigate('/', { state: { message: data.message } })
        } else {
            setSuccessMessage('')
            setError(data.message)
        }
    }

    return (
        <div>
            <h1>TCG Binder App</h1>
            {successMessage && <p>{successMessage}</p>}
            {error && <p>{error}</p>}
            <input 
                type="text" 
                placeholder="Username" 
                value={username}
                onChange={(e) => setUsername(e.target.value)} //catches and changes user input in real time
            />
            <input 
                type="password" 
                placeholder="Password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <button onClick={handleLogin}>Login</button>
            <h4>Register for an account here</h4>
            <button onClick={() => navigate('/register')}>Register</button>
        </div>
    )
}

export default Login