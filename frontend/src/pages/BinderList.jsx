import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { handleError } from '../utils'

function BinderList() {
    const [binders, setBinders] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

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
                await handleError(response)
            }

            const data = await response.json()
            setBinders([...binders, data])
        } catch (err) {
            setError(err.message)
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
                await handleError(response)
            }

            const data = await response.json()
            setBinders(data)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const deleteBinder = async (binder) => {
        try {
            const response = await fetch(`http://localhost:5000/binder/${binder.id}`, {
                method: 'DELETE',
                credentials: 'include',
            })

            if (!response.ok) {
                await handleError(response)
            }

            const data = await response.json()
            setBinders(binders.filter(b => b.id != binder.id)) //update binder selection
        } catch (err) {
            setError(err.message)
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
            ? <p>{error}</p>
            : <div>
                <h1 className="text-3xl text-red-500">Binder List</h1>
                {binders.map(binder => (
                    <div key={binder.id}>
                    <p onClick={() => navigate(`/binder/${binder.id}`)}>{binder.name}</p>
                    <button onClick={() => deleteBinder(binder)}>Delete Binder</button>
                    </div>
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