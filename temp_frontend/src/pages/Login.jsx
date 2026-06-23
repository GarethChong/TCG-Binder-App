import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'

function Login() {
    const navigate = useNavigate()
    const location = useLocation()

    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')
    useEffect(() => {
        //when the component first loads store the meesage if there exists one in router state
        //empty array only runs once when the component first loads, if no array runs on every render
        if (location.state?.message) {
            setMessage(location.state.message)
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
            navigate('/binderlist', { state: { message: data.message } })
        } else {
            setMessage('')
            setError(data.message)
        }
    }

    return (
        <AuthLayout>
            {/* Brand mark */}
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: '28px',
                    fontWeight: '700',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: '#0A0A14',
                    lineHeight: 1,
                }}>
                    TCG<span style={{ color: '#E8001D' }}>■</span>BINDER
                </h1>
                <p style={{
                    fontFamily: "'Exo 2', sans-serif",
                    fontSize: '11px',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: '#5A5A72',
                    marginTop: '4px',
                }}>
                    Sign in to your collection
                </p>
            </div>

            {/* Messages */}
            {message && (
                <p style={{
                    fontSize: '13px',
                    color: '#0052CC',
                    background: 'rgba(0,82,204,0.08)',
                    border: '1px solid rgba(0,82,204,0.2)',
                    borderLeft: '3px solid #0052CC',
                    padding: '8px 12px',
                    marginBottom: '16px',
                }}>
                    {message}
                </p>
            )}
            {error && (
                <p style={{
                    fontSize: '13px',
                    color: '#E8001D',
                    background: 'rgba(232,0,29,0.06)',
                    border: '1px solid rgba(232,0,29,0.2)',
                    borderLeft: '3px solid #E8001D',
                    padding: '8px 12px',
                    marginBottom: '16px',
                }}>
                    {error}
                </p>
            )}

            {/* Inputs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    style={{
                        fontFamily: "'Exo 2', sans-serif",
                        fontSize: '14px',
                        padding: '10px 14px',
                        background: '#F0F2F8',
                        border: '1px solid rgba(0,82,204,0.15)',
                        borderLeft: '3px solid #0052CC',
                        color: '#0A0A14',
                        outline: 'none',
                        width: '100%',
                        clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 0 100%)',
                    }}
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    style={{
                        fontFamily: "'Exo 2', sans-serif",
                        fontSize: '14px',
                        padding: '10px 14px',
                        background: '#F0F2F8',
                        border: '1px solid rgba(0,82,204,0.15)',
                        borderLeft: '3px solid #0052CC',
                        color: '#0A0A14',
                        outline: 'none',
                        width: '100%',
                        clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 0 100%)',
                    }}
                />
            </div>

            {/* Login button */}
            <button
                onClick={handleLogin}
                style={{
                    width: '100%',
                    padding: '11px',
                    background: '#0052CC',
                    color: '#fff',
                    border: 'none',
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: '15px',
                    fontWeight: '700',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))',
                    marginBottom: '12px',
                }}
            >
                Sign In
            </button>

            {/* Divider */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                margin: '20px 0',
            }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(0,82,204,0.15)' }} />
                <span style={{ fontSize: '11px', color: '#5A5A72', letterSpacing: '0.1em', textTransform: 'uppercase' }}>or</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(0,82,204,0.15)' }} />
            </div>

            {/* Register */}
            <p style={{ fontSize: '13px', color: '#5A5A72', marginBottom: '10px', textAlign: 'center' }}>
                Don't have an account?
            </p>
            <button
                onClick={() => navigate('/register')}
                style={{
                    width: '100%',
                    padding: '10px',
                    background: 'transparent',
                    color: '#0052CC',
                    border: '1px solid #0052CC',
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: '15px',
                    fontWeight: '700',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))',
                }}
            >
                Create Account
            </button>
        </AuthLayout>
    )
}

export default Login