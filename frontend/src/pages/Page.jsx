import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { handleError } from '../utils'

function Page() {
    const [binderName, setBinderName] = useState("")
    const [page, setPage] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [cards, setCards] = useState([])
    const [images, setImages] = useState([])
    const navigate = useNavigate()

    //states for card and image addition
    const [slot, setSlot] = useState(null)
    const [slotType, setSlotType] = useState(null)
    const [cardList, setCardList] = useState([])
    const [search, setSearch] = useState("")
    const [image_url, setImage_url] = useState("")
    const [width, setWidth] = useState(1)
    const [selectedSlot, setSelectedSlot] = useState(null)

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
    const [userPrompt, setUserPrompt] = useState("")
    const [style, setStyle] = useState('traditional')

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
                await handleError(response)
            }

            const data = await response.json()
            setBinderName(data.binder_name)
            setPage(data)
            setCards(data.cards)
            setImages(data.images)
        } catch (err) {
            setError(err.message)
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
                await handleError(response)
            }

            const data = await response.json()
            setCardList(data)
        } catch (err) {
            setError(err.message)
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
                await handleError(response)
            }

            const data = await response.json()
            setSlot(null)
            setCardList([])
            setSearch("")
            setCards([...cards, data])
            setSlotType(null)
        } catch (err) {
            setError(err.message)
        }
    }

    const deleteCard = async (card) => {
        try {
            const response = await fetch(`http://localhost:5000/binder/${id}/page/${number}/card/${card.id}`, {
                method: 'DELETE',
                credentials: 'include',
            })

            if (!response.ok) {
                await handleError(response)
            }

            const data = await response.json()
            setCards(cards.filter(c => c.id !== card.id)) //removing the deleted card
        } catch (err) {
            setError(err.message)
        }
    }

    const addImage = async (image, width) => {
        try {
            const response = await fetch(`http://localhost:5000/binder/${id}/page/${number}/image`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    image_url: image,
                    slot_row: slot[0],
                    slot_col: slot[1],
                    width: width
                })
            })

            if (!response.ok) {
                await handleError(response)
            }

            const data = await response.json()
            setSlot(null)
            setImage_url("")
            setSearch("")
            setSlotType(null)
            getPage()
        } catch (err) {
            setError(err.message)
        }
    }

    const deleteImage = async (image) => {
        try {
            const response = await fetch(`http://localhost:5000/binder/${id}/page/${number}/image/${image.id}`, {
                method: 'DELETE',
                credentials: 'include',
            })

            if (!response.ok) {
                await handleError(response)
            }

            const data = await response.json()
            //removing the deleted card
            setImages(images.filter(i => i.id !== image.id && (i.slot_row !== image.slot_row || i.slot_col !== image.slot_col + 1)))
        } catch (err) {
            setError(err.message)
        }
    }

    const swap = async () => {
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
                await handleError(response)
            }

            const data = await response.json()
            setFromSlot(null)
            setToSlot(null)
            getPage()
        } catch (err) {
            setError(err.message)
        }
    }

    const getPrice = async (card) => {
        try {
            setLoadingPrice(prev => ({ ...prev, [card.id]: true }))
            const response = await fetch(`http://localhost:5000/binder/${id}/page/${number}/card/${card.id}/price`, {
                method: 'GET',
                credentials: 'include',
            })

            if (!response.ok) {
                setPrices(prev => ({ ...prev, [card.id]: 'unavailable' }))
                return
            }

            const data = await response.json()
            setPrices(prev => ({ ...prev, [card.id]: data }))
        } catch (err) {
            setError(err.message)
        } finally {
            setLoadingPrice(prev => ({ ...prev, [card.id]: false }))
        }
    }

    const calculateTotal = (prices, cards) => {
        return Object.values(prices)
            .filter(price => price !== 'unavailable')
            .reduce((total, price) => ({
                low: total.low + price.low,
                mid: total.mid + price.mid,
                high: total.high + price.high
            }), { low: 0, mid: 0, high: 0 })
    }

    const aiSuggestions = async () => {
        try {
            setShowModal(true)
            setLoadingSuggestions(true)
            const response = await fetch(`http://localhost:5000/binder/${id}/page/${number}/suggestions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    user_prompt: userPrompt,
                    style: style
                })
            })

            if (!response.ok) {
                await handleError(response)
            }

            const data = await response.json()
            setSuggestions(data.suggestions)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoadingSuggestions(false)
            setUserPrompt("")
        }
    }

    const totals = calculateTotal(prices, cards)

    if (loading) return (
        <div style={styles.loadingRoot}>
            <p style={styles.loadingText}>Loading collection...</p>
        </div>
    )

    if (error) return (
        <div style={styles.loadingRoot}>
            <p style={styles.errorText}>{error}</p>
        </div>
    )

    return (
        <div>

            {/* top bar */}
            <div>
                <div style={styles.brand}>
                    TCG<span style={{ color: '#E8001D' }}>■</span>BINDER
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '15px', marginLeft: '8px' }}>— {binderName}</span>
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '15px', marginLeft: '8px' }}> {page.page_number}</span>
                </div>
                <button onClick={() => navigate(`/binder/${id}`)} style={styles.binderListButton} title="binder">
                    {/* Arrow pointing back to binder */}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                        strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    <span style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Binder</span>
                </button>
            </div>

            {/* main area */}
            <div style={{ display: 'flex', flexDirection: 'row' }}>
                {/* left panel */}
                <div>
                    <p>Low: {totals.low}</p>
                    <p>Mid: {totals.mid}</p>
                    <p>High: {totals.high}</p>
                </div>


                {/* grid */}
                <div>
                    {Array.from({ length: page.size }, (_, i) => i).map(row => ( //create outer rows, each wrapped in div
                        <div key={row} style={{ display: 'grid', gridTemplateColumns: `repeat(${page.size}, 1fr)` }}>
                            {Array.from({ length: page.size }, (_, i) => i).map(col => { //create columns within each row
                                const card = cards.find(c => c.slot_row === row && c.slot_col === col)
                                const image = images.find(i => i.slot_row === row && i.slot_col === col)
                                return ( //span sits next to other elements, div starts a new line
                                    <span key={col} style={{ margin: '5px' }}>
                                        {card // checks if cards exist or if the slot is empty
                                            ? mode === 'add'
                                                ? <div>
                                                    <img src={card.image_url} alt={card.name} onClick={() => setSelectedSlot(card)}
                                                        style={{ width: '50px' }} />
                                                    {prices[card.id] //check if prices have been fetched, else it fetches them
                                                        ? prices[card.id] === 'unavailable' //note: no pricing vs not loading is different
                                                            ? <p>No pricing available</p>
                                                            : <div>
                                                                {Object.entries(prices[card.id]).map(([type, values]) => (
                                                                    <div key={type}>
                                                                        <p>{type}: low ${values.low} mid ${values.mid} high ${values.high}</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        : loadingPrice[card.id]
                                                            ? <p>Loading Price...</p>
                                                            : <div />
                                                    }
                                                </div>
                                                : <div>
                                                    <img src={card.image_url} alt={card.name} onClick={() => {
                                                        if (!fromSlot) {
                                                            setFromSlot([row, col])
                                                        } else if (!toSlot) {
                                                            setToSlot([row, col])
                                                        } else {
                                                            setFromSlot(toSlot)
                                                            setToSlot([row, col])
                                                        }
                                                    }}
                                                        style={{ width: '50px' }} />
                                                    {prices[card.id] //check if prices have been fetched, else it fetches them
                                                        ? prices[card.id] === 'unavailable' //note: no pricing vs not loading is different
                                                            ? <p>No pricing available</p>
                                                            : <div>
                                                                {Object.entries(prices[card.id]).map(([type, values]) => (
                                                                    <div key={type}>
                                                                        <p>{type}: low ${values.low} mid ${values.mid} high ${values.high}</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        : loadingPrice[card.id]
                                                            ? <p>Loading Price...</p>
                                                            : <div />
                                                    }
                                                </div>
                                            : image //if no card, check if there is image, otherwise is empty
                                                ? image.is_primary //check if is primary image, else skip
                                                    ? mode === 'add'
                                                        ? <div>
                                                            <img src={image.image_url} style={{ width: '50px' }} onClick={() => setSelectedSlot(image)} />
                                                        </div>
                                                        : <div>
                                                            <img src={image.image_url} style={{ width: '50px' }} onClick={() => {
                                                                if (!fromSlot) {
                                                                    setFromSlot([row, col])
                                                                } else if (!toSlot) {
                                                                    setToSlot([row, col])
                                                                } else {
                                                                    setFromSlot(toSlot)
                                                                    setToSlot([row, col])
                                                                }
                                                            }} />
                                                        </div>
                                                    : null
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
                </div>

                {/* right panel */}
                <div>
                    <button onClick={() => {
                        setMode(mode === 'add' ? 'swap' : 'add') //button to toggle between modes; reset all states when toggling modes
                        setSlot(null)
                        setCardList([])
                        setSearch("")
                        setFromSlot(null)
                        setToSlot(null)
                        setSlotType(null)
                        setSelectedSlot(null)
                    }}>Switch to {mode === 'add' ? 'Swap' : 'Add'} Mode</button>
                    {mode === 'add' && slot && (
                        <div>
                            {slotType === null
                                ? <div>
                                    <button onClick={() => setSlotType('card')}>Add Card</button>
                                    <button onClick={() => setSlotType('image')}>Add Image</button>
                                </div>
                                : slotType == 'card'
                                    ? <div>
                                        <input
                                            type="text"
                                            placeholder="Search card"
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
                                    : <div>
                                        <input
                                            type="text"
                                            placeholder="Set Image"
                                            value={image_url}
                                            onChange={(e) => setImage_url(e.target.value)}
                                        />
                                        <button onClick={() => setWidth(width === 1 ? 2 : 1)}>Width: {width}</button>
                                        <button onClick={() => addImage(image_url, width)}>Search</button>
                                    </div>
                            }
                        </div>
                    )}
                    {mode === 'swap' && (
                        <div>
                            <p>From slot: {fromSlot ? `row ${fromSlot[0]}, col ${fromSlot[1]}` : 'not selected'}</p>
                            <p>To slot: {toSlot ? `row ${toSlot[0]}, col ${toSlot[1]}` : 'not selected'}</p>
                            {fromSlot && toSlot && (
                                <button onClick={() => swap()}>Swap</button>
                            )}
                        </div>
                    )}
                    {selectedSlot && (
                        <div>
                            {selectedSlot.is_primary === undefined //check if is image or card
                                ? <button onClick={() => getPrice(selectedSlot)}>Get Price</button>
                                : null
                            }
                            {selectedSlot.is_primary === undefined //check if is image or card
                                ? <button onClick={() => deleteCard(selectedSlot)}>Delete Card</button>
                                : <button onClick={() => deleteImage(selectedSlot)}>Delete Image</button>
                            }
                        </div>
                    )}
                    <h3>AI Suggestion</h3>
                    <input
                        type="text"
                        placeholder="Good day, how may I be of assistance?"
                        value={userPrompt}
                        onChange={(e) => setUserPrompt(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') aiSuggestions() }}
                    />
                    <select value={style} onChange={(e) => setStyle(e.target.value)}>
                        <option value="traditional">Traditional</option>
                        <option value="michi">Michi Method</option>
                    </select>
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
                </div>
            </div>
        </div>
    )
}

const styles = {
    root: {
        minHeight: '100vh',
        background: '#0A0A14',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Exo 2', sans-serif",
        overflow: 'hidden',
    },
    loadingRoot: {
        minHeight: '100vh',
        background: '#0A0A14',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        fontFamily: "'Rajdhani', sans-serif",
        fontSize: '18px',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.4)',
    },
    errorText: {
        fontFamily: "'Rajdhani', sans-serif",
        fontSize: '18px',
        letterSpacing: '0.1em',
        color: '#E8001D',
    },
    topBar: {
        display: 'flex', //keeps things horizontally
        alignItems: 'center',
        justifyContent: 'space-between', //pushes one child to left and other to the right
        padding: '20px 32px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
    },
    brand: {
        fontFamily: "'Rajdhani', sans-serif",
        fontSize: '20px',
        fontWeight: '700',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: '#fff',
    },
    binderListButton: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        background: 'transparent',
        border: '1px solid rgba(255,255,255,0.15)',
        color: 'rgba(255,255,255,0.6)',
        padding: '6px 12px',
        cursor: 'pointer',
        fontFamily: "'Exo 2', sans-serif",
        clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))',
        transition: 'color 0.2s, border-color 0.2s',
    },
    binderName: {
        writingMode: 'vertical-rl',
        textOrientation: 'mixed',
        transform: 'rotate(180deg)',
        fontFamily: "'Rajdhani', sans-serif",
        fontSize: '13px',
        fontWeight: '700',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.9)',
        maxHeight: '160px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        userSelect: 'none',
    },
    outerBookBar: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px 32px',
        flex: 1, //allows to take up remaining vertical space between top bar and folio indicator
    },
    page: {
        background: '#12121f',
        border: '1px solid rgba(0,82,204,0.25)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        padding: '7px',
        width: '30vw',
        height: '42vw',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
    },
    arrowButton: {
        background: 'transparent',
        color: 'rgba(0,82,204,0.6)',
        fontSize: '36px',
        cursor: 'pointer',
        padding: '0 16px',
    },
    pageFooter: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '8px 4px',
    },
    footerButton: {
        fontFamily: 'Rajdhani',
        fontSize: '11px',
        padding: '4px 8px',
        border: '1px solid #0052CC',
        background: 'transparent',
        cursor: 'pointer',
        clipPath: 'polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 5px 100%, 0 calc(100% - 5px))',
        width: '8vw',
        height: '3vw',
    },
    cardSlot: {
        border: '1px solid rgba(0,82,204,0.25)',
        background: 'rgba(0,82,204,0.04)',
        aspectRatio: '2.5/3.5',
        borderRadius: '3px',
    },
    binderStrip: {
        height: '6px',
        background: 'transparent',
        marginBottom: '1px',
    },
    folioIndicator: { //bar for the folio count
        display: 'flex',
        justifyContent: 'center',
        gap: '10px',
        padding: '15px',
    },
    folioDot: { //counter for the folio number
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        background: 'rgba(0,82,204,0.3)',
    },
    folioDotActive: {
        background: '#0052CC',
    },
    addSheetButton: {
        background: 'transparent',
        color: '#9edfec',
        fontSize: '80px',
        cursor: 'pointer',
        width: '30vw',
        height: '42vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    }
}

export default Page
