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
                                    {card
                                        ? <div>
                                            {card.name}
                                            <button onClick={() => deleteCard(card)}>delete card</button>
                                            </div>
                                        : <button onClick={() => setSlot([row, col])}>empty</button> //onclick only avail if empty
                                    }
                                </span>
                            )
                        })}
                    </div>
                ))}
                {slot && (
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
                <button onClick={() => navigate(`/binder/${id}`)}>Back to binder</button>
            </div>
}

export default Page
