import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

function Page() {
    const [page, setPage] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)
    const [cards, setCards] = useState([])
    const navigate = useNavigate()

    //states for card addition
    const [slot, setSlot] = useState(null)
    const [cardList, setCardList] = useState([])
    const [search, setSearch] = useState("")

    //states for card swapping
    const [fromSlot, setFromSlot] = useState(null)
    const [toSlot, setToSlot] = useState(null)

    //state to change between swapping and addition
    const [mode, setMode] = useState('add')

    //state to check the prices
    const [loadingPrice, setLoadingPrice] = useState({})
    const [prices, setPrices] = useState({})

    //state for ai suggestions
    const [showModal, setShowModal] = useState(false)
    const [suggestions, setSuggestions] = useState("")
    const [loadingSuggestions, setLoadingSuggestions] = useState(false)

    const { id, number } = useParams()

    useEffect(() => {
        getPage()
    }, [])

    const getPage = async () => {
        try {
            setLoading(true)
            const response = await fetch(`http://localhost:5000/binder/${id}/page/${number}`, {
                method: 'GET',
                credentials: 'include'
            })

            if (!response.ok) {
                throw new Error('Failed to get page')
            }

            const data = await response.json()
            setPage(data)
            setCards(data.cards)
        } catch (err) {
            setError(true)
        } finally {
            setLoading(false)
        }
    }

    const searchCard = async () => {
        try {
            const response = await fetch(`http://localhost:5000/cards/search?name=${search}`, {
                method: 'GET',
                credentials: 'include',
            })

            if (!response.ok) {
                throw new Error('Failed to find card')
            }

            const data = await response.json()
            setCardList(data)
        } catch (err) {
            setError(true)
        }
    }

    const addCard = async (card) => {
        try {
            const response = await fetch(`http://localhost:5000/binder/${id}/page/${number}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    name: card.name,
                    card_number: card.number,
                    card_set: card.set,
                    image_url: card.image,
                    slot_row: slot[0],
                    slot_col: slot[1]
                })
            })

            if (!response.ok) {
                throw new Error('Failed to add card')
            }

            const data = await response.json()
            setSlot(null)
            setCardList([])
            setSearch("")
            setCards([...cards, data])
        } catch (err) {
            setError(true)
        }
    }

    const swapCard = async () => {
        try {
            const response = await fetch(`http://localhost:5000/binder/${id}/page/${number}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    from_row: fromSlot[0],
                    from_col: fromSlot[1],
                    to_row: toSlot[0],
                    to_col: toSlot[1],
                })
            })

            if (!response.ok) {
                throw new Error('Failed to swap carda')
            }

            const data = await response.json()
            setFromSlot(null)
            setToSlot(null)
            getPage()
        } catch (err) {
            setError(true)
        }
    }

    const deleteCard = async (card) => {
        try {
            const response = await fetch(`http://localhost:5000/binder/${id}/page/${number}/card/${card.id}`, {
                method: 'DELETE',
                credentials: 'include',
            })

            if (!response.ok) {
                throw new Error('Failed to delete card')
            }

            const data = await response.json()
            setCards(cards.filter(c => c.id !== card.id)) //removing the deleted card
        } catch (err) {
            setError(true)
        }
    }

    const getPrice = async (card) => {
        try {
            setLoadingPrice({ ...loadingPrice, [card.id]: true })
            const response = await fetch(`http://localhost:5000/binder/${id}/page/${number}/card/${card.id}/price`, {
                method: 'GET',
                credentials: 'include',
            })

            if (!response.ok) {
                throw new Error('Failed to fetch price of card')
            }

            const data = await response.json()
            setPrices({ ...prices, [card.id]: data })
        } catch (err) {
            setError(true)
        } finally {
            setLoadingPrice({ ...loadingPrice, [card.id]: false })
        }
    }

    const aiSuggestions = async () => {
        try {
            setShowModal(true)
            setLoadingSuggestions(true)
            const response = await fetch(`http://localhost:5000/binder/${id}/page/${number}/suggestions`, {
                method: 'GET',
                credentials: 'include',
            })

            if (!response.ok) {
                throw new Error('Failed to fetch ai suggestion')
            }

            const data = await response.json()
            setSuggestions(data.suggestions)
        } catch (err) {
            setError(true)
        } finally {
            setLoadingSuggestions(false)
        }
    }


    return loading
        ? <p>Loading...</p>
        : error
            ? <p>Sorry, could not fetch Page</p>
            : <div>
                <h1>
                    Page {number}
                </h1>
                {Array.from({ length: page.size }, (_, i) => i).map(row => ( //create outer rows, each wrapped in div
                    <div key={row}>
                        {Array.from({ length: page.size }, (_, i) => i).map(col => { //create columns within each row
                            const card = cards.find(c => c.slot_row === row && c.slot_col === col)
                            return ( //span sits next to other elements, div starts a new line
                                <span key={col} style={{ margin: '5px' }}>
                                    {card // checks if cards exist or if the slot is empty
                                        ? <div>
                                            {card.name}
                                            {prices[card.id]
                                                ? <div>
                                                    {Object.entries(prices[card.id]).map(([type, values]) => (
                                                        <div key={type}>
                                                            <p>{type}: low ${values.low} mid ${values.mid} high ${values.high}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                                : loadingPrice[card.id]
                                                    ? <p>Loading Price...</p>
                                                    : <button onClick={() => getPrice(card)}>Check Price</button>
                                            }
                                            <button onClick={() => deleteCard(card)}>delete card</button>
                                            {mode === 'swap' && ( //only shows in swapmode 
                                                <button onClick={() => {
                                                    if (!fromSlot) {
                                                        setFromSlot([row, col])
                                                    } else if (!toSlot) {
                                                        setToSlot([row, col])
                                                    } else {
                                                        setFromSlot(toSlot)
                                                        setToSlot([row, col])
                                                    }
                                                }}>Select</button>
                                            )}
                                        </div>
                                        : mode === 'add' //if slot is empty, checks if it is in add or swap mode
                                            ? <button onClick={() => setSlot([row, col])}>empty</button>
                                            : <button onClick={() => {
                                                if (!fromSlot) {
                                                    setFromSlot([row, col])
                                                } else if (!toSlot) {
                                                    setToSlot([row, col])
                                                } else {
                                                    setFromSlot(toSlot)
                                                    setToSlot([row, col])
                                                }
                                            }}>empty</button>
                                    }
                                </span>
                            )
                        })}
                    </div>
                ))}
                <button onClick={() => {
                    setMode(mode === 'add' ? 'swap' : 'add') //button to toggle between modes; reset all states when toggling modes
                    setSlot(null)
                    setCardList([])
                    setSearch("")
                    setFromSlot(null)
                    setToSlot(null)
                }}>Switch to {mode === 'add' ? 'Swap' : 'Add'} Mode</button>
                {mode === 'add' && slot && (
                    <div>
                        <input
                            type="text"
                            placeholder="Seach card"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <button onClick={() => searchCard()}>Search</button>
                        {cardList.map(card => (
                            <div key={`${card.number}-${card.set}`}>
                                <img src={card.image} alt={card.name} style={{ width: '50px' }} />
                                <p>{card.name} — {card.set}</p>
                                <button onClick={() => addCard(card)}>Add Card</button>
                            </div>
                        ))}
                    </div>
                )}
                {mode === 'swap' && (
                    <div>
                        <p>From slot: {fromSlot ? `row ${fromSlot[0]}, col ${fromSlot[1]}` : 'not selected'}</p>
                        <p>To slot: {toSlot ? `row ${toSlot[0]}, col ${toSlot[1]}` : 'not selected'}</p>
                        {fromSlot && toSlot && (
                            <button onClick={() => swapCard()}>Swap</button>
                        )}
                    </div>
                )}
                <button onClick={() => aiSuggestions()}>AI Suggestions</button>
                {showModal && ( //modal for ai suggestions
                    <div style={{
                        position: 'fixed',
                        top: 0, left: 0,
                        width: '100%', height: '100%',
                        backgroundColor: 'rgba(0,0,0,0.5)'  //dark overlay
                    }}>
                        <div style={{
                            background: 'white',
                            margin: '10% auto',
                            padding: '20px',
                            width: '60%',
                            maxHeight: '70vh',
                            overflowY: 'auto'  //make it scrollable
                        }}>
                            <h2>AI Suggestions</h2>
                            {loadingSuggestions //checks if loading
                                ? <p>Generating suggestions...</p>
                                : <p>{suggestions}</p>
                            }
                            <button onClick={() => setShowModal(false)}>Close</button>
                        </div>
                    </div>
                )}

                <button onClick={() => navigate(`/binder/${id}`)}>Back to binder</button>
            </div>
}

export default Page
