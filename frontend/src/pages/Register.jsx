import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function Register() {
    const navigate = useNavigate()

    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')

    const handleRegistration = async () => {
        const response = await fetch('http://localhost:5000/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', //essential for flask login sessions
            body: JSON.stringify({ username, password })
        })
        const data = await response.json()

        if (response.ok) {
            navigate('/login', { state: { message: data.message } })
        } else {
            setError(data.message)
        }
    }

    return (
        <div>
            <h1>TCG Binder App</h1>
            {error && <p>{error}</p>}
            <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
            />
            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <button onClick={handleRegistration}>Register</button>
        </div>
    )

}

export default Register