import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { handleError } from '../utils'

function Binder() {
    const [binder, setBinder] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [pages, setPages] = useState([])
    const [folios, setFolios] = useState([])
    const [folioIndex, setFolioIndex] = useState(0)
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
            setFolios(groupIntoFolios(data.pages))
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const addSheet = async () => {
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
            const updatedPages = [...pages, data[0], data[1]]
            setPages(updatedPages)
            setFolios(groupIntoFolios(updatedPages))
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const deleteSheet = async (page) => {
        try {
            const response = await fetch(`http://localhost:5000/binder/${id}/page/${page.page_number}`, {
                method: 'DELETE',
                credentials: 'include',
            })

            if (!response.ok) {
                await handleError(response)
            }

            const data = await response.json()
            await getBinder()
            //ensures that the foliocount is within and wont redirect to a blank page
            const newFolioCount = Math.ceil((pages.length - 2) / 2)
            if (folioIndex >= newFolioCount) {
                setFolioIndex(Math.max(0, folioIndex - 1))
            }
        } catch (err) {
            setError(err.message)
        }
    }

    const clearSheet = async (page) => {
        try {
            const response = await fetch(`http://localhost:5000/binder/${id}/page/${page.page_number}/clear`, {
                method: 'PUT',
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

    //function to accumulate the pages to be side by side like a real binder
    const groupIntoFolios = (pages) => {
        const groups = pages.reduce((acc, page) => {
            const group = Math.floor(page.page_number / 2)
            if (!acc[group]) { acc[group] = [] }
            acc[group].push(page)
            return acc
        }, {})
        return Object.values(groups)
    }

    if (loading) return <p>Loading...</p>

    if (error) return <p>{error}</p>

    //to organise the pagese side by side before rendering
    const currentFolio = folios[folioIndex]

    if (!currentFolio) {
        return <div>
            <button onClick={() => addSheet()}>Add Sheet</button>
            <button onClick={() => navigate('/binderlist')}>Back</button>
        </div>
    }

    const leftPage = currentFolio?.length === 2
        ? currentFolio[0]
        : currentFolio[0].page_number === pages.length
            ? currentFolio[0]
            : null

    const rightPage = currentFolio?.length === 2
        ? currentFolio[1]
        : currentFolio[0].page_number === 1
            ? currentFolio[0]
            : null

    return <div>
        <h1>
            Binder {id}
        </h1>
        <p>{binder.name}</p>
        <div>
            {folioIndex > 0 && <button onClick={() => setFolioIndex(folioIndex - 1)}>←</button>}

            {leftPage
                ? (
                    <div key={leftPage.id}>
                        <p onClick={() => navigate(`/binder/${binder.id}/page/${leftPage.page_number}`)}>{leftPage.page_number}</p>
                        <button onClick={() => clearSheet(leftPage)}>Clear Page</button>
                        <button onClick={() => deleteSheet(leftPage)}>Delete Sheet</button>
                    </div>
                )
                : (<div />)
            }
            {rightPage
                ? (
                    <div key={rightPage.id}>
                        <p onClick={() => navigate(`/binder/${binder.id}/page/${rightPage.page_number}`)}>{rightPage.page_number}</p>
                        <button onClick={() => clearSheet(rightPage)}>Clear Page</button>
                        <button onClick={() => deleteSheet(rightPage)}>Delete Sheet</button>
                    </div>
                )
                : pages.length < 30
                    ? <button onClick={() => addSheet()}>Add Sheet</button>
                    : <div />
            }
            {folioIndex < folios.length - 1 && <button onClick={() => setFolioIndex(folioIndex + 1)}>→</button>}
        </div>
        <button onClick={() => addSheet()}>Add Sheet</button>
        <button onClick={() => navigate('/binderlist')}>BinderList</button>
    </div>

}

export default Binder