import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function BinderList() {
    const [binders, setBinders] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        getBinders()
    }, [])

    const getBinders = async () => {
        try {
            const response = await fetch('http://localhost:5000/binderlist', {
                method: 'GET',
                credentials: 'include',
            })

            if (!response.ok) {
                throw new Error('Failed to fetch binders')
            }

            const data = await response.json()
            setBinders(data)
        } catch (err) {
            setError(true)
        } finally {
            setLoading(false)
        }
    }

    const logout = async () => {
        const response = await fetch('http://localhost:5000/logout', {
            method: 'POST',
            credentials: 'include',
        })
        const data = await response.json()

        if (response.ok) {
            navigate('/login')
        }
    }

    return loading
        ? <p>Loading...</p>
        : error
            ? <p>Sorry, could not fetch Binders</p>
            : <div>
                <h1>
                    Binder List
                </h1>
                {binders.map(binder => (
                    <p key={binder.id}>{binder.name}</p>
                ))}
                <button onClick={() => logout()}>Logout</button>
            </div>
}

export default BinderList