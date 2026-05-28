import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function BinderList() {
    const [binders, setBinders] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    //for creating new binders
    const [name, setName] = useState('')
    const [size, setSize] = useState(0)
    const navigate = useNavigate()

    useEffect(() => {
        getBinders()
    }, [])

    const createBinder = async () => {
        try {
            setLoading(true)
            const response = await fetch('http://localhost:5000/binderlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ name, size })
            })

            if (!response.ok) {
                throw new Error('Failed to create binder')
            }

            const data = await response.json()
            setBinders([...binders, data])
        } catch (err) {
            setError(true)
        } finally {
            setLoading(false)
        }
    }

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
                    <p onClick={() => navigate(`/binder/${binder.id}`)} key={binder.id}>{binder.name}</p>
                ))}
                <hr />
                <input
                    type="text"
                    placeholder="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <input
                    type="number"
                    placeholder="size"
                    value={size}
                    onChange={(e) => setSize(parseInt(e.target.value))}
                />
                <button onClick={createBinder}>Create New Binder</button>
                <button onClick={() => logout()}>Logout</button>
            </div>
}

export default BinderList