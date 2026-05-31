import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { handleError } from '../utils'

function Binder() {
    const [binder, setBinder] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [pages, setPages] = useState([])
    const navigate = useNavigate()

    // get the binder id
    const { id } = useParams()

    useEffect(() => {
        getBinder()
    }, [])

    const getBinder = async () => {
        try {
            setLoading(true)
            const response = await fetch(`http://localhost:5000/binder/${id}`, {
                method: 'GET',
                credentials: 'include'
            })

            if (!response.ok) {
                await handleError(response)
            }

            const data = await response.json()
            setBinder(data)
            setPages(data.pages)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const addPage = async () => {
        try {
            setLoading(true)
            const response = await fetch(`http://localhost:5000/binder/${id}`, {
                method: 'POST',
                credentials: 'include'
            })

            if (!response.ok) {
                await handleError(response)
            }

            const data = await response.json()
            setPages([...pages, data])
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const deletePage = async (page) => {
        try {
            const response = await fetch(`http://localhost:5000/binder/${id}/page/${page.page_number}`, {
                method: 'DELETE',
                credentials: 'include',
            })

            if (!response.ok) {
                await handleError(response)
            }

            const data = await response.json()
            getBinder()
        } catch (err) {
            setError(err.message)
        }
    }

    return loading
        ? <p>Loading...</p>
        : error
            ? <p>{error}</p>
            : <div>
                <h1>
                    Binder {id}
                </h1>
                <p>{binder.name}</p>
                {pages.map(page => ( //list of pages
                    <div key={page.id}>
                        <p onClick={() => navigate(`/binder/${binder.id}/page/${page.page_number}`)}> {page.page_number}</p>
                        <button onClick={() => deletePage(page)}>Delete Page</button>
                    </div>
                ))}
                <button onClick={() => addPage()}>Add Page</button>
                <button onClick={() => navigate('/binderlist')}>BinderList</button>
            </div>

}

export default Binder