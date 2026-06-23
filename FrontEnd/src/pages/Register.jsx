import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import API_URL from '../config'

function Register() {
    const navigate = useNavigate()

    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')

    const handleRegistration = async () => {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
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
                    Create your account
                </p>
            </div>

            {/* Error message */}
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
                    onKeyDown={(e) => e.key === 'Enter' && handleRegistration()}
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

            {/* Register button */}
            <button
                onClick={handleRegistration}
                style={{
                    width: '100%',
                    padding: '11px',
                    background: '#E8001D',
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
                Create Account
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

            {/* Back to login */}
            <p style={{ fontSize: '13px', color: '#5A5A72', marginBottom: '10px', textAlign: 'center' }}>
                Already have an account?
            </p>
            <button
                onClick={() => navigate('/login')}
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
                Sign In
            </button>
        </AuthLayout>
    )
}

export default Register