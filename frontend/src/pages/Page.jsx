import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { handleError } from '../utils'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '../components/ui/dialog'
import { Input } from '../components/ui/input'

function Page() {
    const [binderName, setBinderName] = useState("")
    const [page, setPage] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [cards, setCards] = useState([])
    const [images, setImages] = useState([])
    const [hoveredButton, setHoveredButton] = useState(null)
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

    //states to change between swapping and addition
    const [mode, setMode] = useState('add')

    //states to check the prices
    const [loadingPrice, setLoadingPrice] = useState({})
    const [prices, setPrices] = useState({})

    //states for ai suggestions
    const [aiPanelOpen, setAiPanelOpen] = useState(false)
    const [suggestions, setSuggestions] = useState("")
    const [loadingSuggestions, setLoadingSuggestions] = useState(false)
    const [userPrompt, setUserPrompt] = useState("")
    const [style, setStyle] = useState('traditional')
    const [panelWidth, setPanelWidth] = useState(300)
    const [dragging, setDragging] = useState(false)
    const [displayWidth, setDisplayWidth] = useState(0)

    const { id, number } = useParams()

    useEffect(() => {
        getPage()
    }, [])

    useEffect(() => {
        if (!dragging) return

        const handleMouseMove = (e) => {
            let width = window.innerWidth - e.clientX //length of windowscreen minus horizontal position of mouse
            let clampedValue = Math.max(300, Math.min(window.innerWidth * 0.25, width)) //check if its within the boundaries
            setPanelWidth(clampedValue)
            setDisplayWidth(clampedValue)
        }

        const handleMouseUp = () => setDragging(false)

        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [dragging])

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
        <div style={styles.root}>

            {/* top bar */}
            <div style={styles.topBar}>
                <div style={styles.brand}>
                    TCG<span style={{ color: '#E8001D' }}>■</span>BINDER
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '15px', marginLeft: '8px' }}>— {binderName}</span>
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '15px', marginLeft: '8px' }}>Page {page.page_number}</span>
                </div>
                <button onClick={() => navigate(`/binder/${id}`)} style={styles.backButton} title="binder">
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

            <div style={{ display: 'flex', flexDirection: 'row' }} >

                {/* main area */}
                <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', flex: 1 }}>
                    {/* left panel */}
                    <div style={styles.panel}>
                        <p style={styles.totalValue}>Low: {totals.low}</p>
                        <p style={styles.totalValue}>Mid: {totals.mid}</p>
                        <p style={styles.totalValue}>High: {totals.high}</p>
                    </div>


                    {/* grid */}
                    <div style={styles.page}>
                        {Array.from({ length: page.size }, (_, i) => i).map(row => ( //create outer rows, each wrapped in div
                            <div key={row} style={{ display: 'grid', gridTemplateColumns: `repeat(${page.size}, 1fr)` }}>
                                {Array.from({ length: page.size }, (_, i) => i).map(col => { //create columns within each row
                                    const card = cards.find(c => c.slot_row === row && c.slot_col === col)
                                    const image = images.find(i => i.slot_row === row && i.slot_col === col)
                                    return ( //span sits next to other elements, div starts a new line
                                        image && !image.is_primary //check if is primary image, else skip
                                            ? null
                                            : <span key={col} style={{
                                                margin: '5px',
                                                gridColumn: image && image.width === 2 ? 'span 2' : undefined
                                            }}>
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
                                                                style={{ width: '100%' }} />
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
                                                        ? mode === 'add'
                                                            ? <div>
                                                                <img src={image.image_url} style={{ width: '100%' }} onClick={() => setSelectedSlot(image)} />
                                                            </div>
                                                            : <div>
                                                                <img src={image.image_url} style={{ width: '100%' }} onClick={() => {
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
                                                        : mode === 'add' //if slot is empty, checks if it is in add or swap mode
                                                            ? <div
                                                                onMouseEnter={() => setHoveredButton(`${row}-${col}`)}
                                                                onMouseLeave={() => setHoveredButton(null)}
                                                                onClick={() => setSlot([row, col])}
                                                                style={{
                                                                    ...styles.cardSlot,
                                                                    textShadow: hoveredButton === `${row}-${col}`
                                                                        ? '0 0 8px rgba(150, 223, 246, 0.6)'
                                                                        : 'none',
                                                                    boxShadow: hoveredButton === `${row}-${col}`
                                                                        ? '0 0 8px rgba(0,82,204,0.6)'
                                                                        : 'none'
                                                                }}>
                                                                +
                                                            </div>
                                                            : <div
                                                                onMouseEnter={() => setHoveredButton(`${row}-${col}`)}
                                                                onMouseLeave={() => setHoveredButton(null)}
                                                                onClick={() => {
                                                                    if (!fromSlot) {
                                                                        setFromSlot([row, col])
                                                                    } else if (!toSlot) {
                                                                        setToSlot([row, col])
                                                                    } else {
                                                                        setFromSlot(toSlot)
                                                                        setToSlot([row, col])
                                                                    }
                                                                }}
                                                                style={{
                                                                    ...styles.cardSlot,
                                                                    textShadow: hoveredButton === `${row}-${col}`
                                                                        ? '0 0 8px rgba(150, 223, 246, 0.6)'
                                                                        : 'none',
                                                                    boxShadow: hoveredButton === `${row}-${col}`
                                                                        ? '0 0 8px rgba(0,82,204,0.6)'
                                                                        : 'none'
                                                                }}
                                                            >
                                                                +
                                                            </div>
                                                }
                                            </span>
                                    )
                                })}
                            </div>
                        ))}
                    </div>

                    {/* dialog to add card / image */}
                    <Dialog open={slot !== null} onOpenChange={(isOpen) => { if (!isOpen) { setSlot(null); setSlotType(null) } }}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle style={styles.dialogTitle}>Add Item</DialogTitle>
                            </DialogHeader>

                            <div>
                                {/* default page */}
                                {slotType === null
                                    ? <div style={{ display: 'flex', flexDirection: 'row' }}>
                                        <button
                                            onMouseEnter={() => setHoveredButton('add-card')}
                                            onMouseLeave={() => setHoveredButton(null)}
                                            onClick={() => setSlotType('card')}
                                            style={{
                                                ...styles.backButton,
                                                color: 'rgba(235,235,220,0.8)',
                                                border: `1px solid ${hoveredButton === 'add-card' ? '#eef653' : 'rgba(0,82,204,0.4)'}`,
                                            }}>
                                            Add Card
                                        </button>
                                        <button
                                            onMouseEnter={() => setHoveredButton('add-image')}
                                            onMouseLeave={() => setHoveredButton(null)}
                                            onClick={() => setSlotType('image')}
                                            style={{
                                                ...styles.addObjectButton,
                                                color: 'rgba(235,235,220,0.8)',
                                                border: `1px solid ${hoveredButton === 'add-image' ? '#f4f7bd' : 'rgba(0,82,204,0.4)'}`,
                                            }}>
                                            Add Image
                                        </button>
                                    </div>
                                    : slotType == 'card'
                                        ? <div style={styles.formGroup}>
                                            <div style={{ display: 'flex', flexDirection: 'row' }}>
                                                <label style={styles.label}>Add Card</label>
                                                <button
                                                    onMouseEnter={() => setHoveredButton('back-dialog')}
                                                    onMouseLeave={() => setHoveredButton(null)}
                                                    onClick={() => setSlotType(null)}
                                                    style={{
                                                        ...styles.backButton,
                                                        color: 'rgba(235,235,220,0.8)',
                                                        border: `1px solid ${hoveredButton === 'back-dialog' ? '#fafafa' : 'rgba(0,82,204,0.4)'}`,
                                                    }}>
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                                                        strokeLinejoin="round">
                                                        <polyline points="8 17 3 12 8 7" /> {/* forms left arrow head  */}
                                                        <line x1="3" y1="12" x2="15" y2="12" /> {/* shift line down  */}
                                                    </svg>
                                                    <span style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Back</span>
                                                </button>
                                            </div>

                                            <Input
                                                type="text"
                                                placeholder="Search card"
                                                value={search}
                                                onChange={(e) => setSearch(e.target.value)}
                                            />
                                            <button style={styles.dialogButton} onClick={() => searchCard()}>Search</button>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
                                                {cardList.map(card => (
                                                    <div key={`${card.number}-${card.set}`}>
                                                        <img src={card.image} alt={card.name} style={{ width: '50px' }} onClick={() => addCard(card)} />
                                                        <p style={styles.cardText}>{card.name} — {card.set}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        : <div style={styles.formGroup}>
                                            <div style={{ display: 'flex', flexDirection: 'row' }}>
                                                <label style={styles.label}>Add Image</label>
                                                <button
                                                    onMouseEnter={() => setHoveredButton('back-dialog')}
                                                    onMouseLeave={() => setHoveredButton(null)}
                                                    onClick={() => setSlotType(null)}
                                                    style={{
                                                        ...styles.backButton,
                                                        color: 'rgba(235,235,220,0.8)',
                                                        border: `1px solid ${hoveredButton === 'back-dialog' ? '#fafafa' : 'rgba(0,82,204,0.4)'}`,
                                                    }}>
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                                                        strokeLinejoin="round">
                                                        <polyline points="8 17 3 12 8 7" /> {/* forms left arrow head  */}
                                                        <line x1="3" y1="12" x2="15" y2="12" /> {/* shift line down  */}
                                                    </svg>
                                                    <span style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Back</span>
                                                </button>
                                            </div>

                                            <Input
                                                type="text"
                                                placeholder="Set Image"
                                                value={image_url}
                                                onChange={(e) => setImage_url(e.target.value)}
                                            />
                                            <div style={styles.widthRow}>
                                                <button
                                                    onClick={() => setWidth(width === 1 ? 2 : 1)}
                                                    style={{
                                                        ...styles.widthButton,
                                                        background: width === 2 ? '#0052CC' : 'transparent',
                                                        color: width === 2 ? 'rgba(235,235,220,0.8)' : '#0052CC',
                                                    }}
                                                >
                                                    Width: {width}
                                                </button>
                                            </div>
                                            <button onClick={() => addImage(image_url, width)} style={styles.dialogButton}>Search</button>
                                        </div>
                                }
                            </div>
                        </DialogContent>
                    </Dialog>

                    {/* right panel */}
                    <div style={styles.panel}>
                        <button
                            onMouseEnter={() => setHoveredButton('change-mode')}
                            onMouseLeave={() => setHoveredButton(null)}
                            onClick={() => {
                                setMode(mode === 'add' ? 'swap' : 'add') //button to toggle between modes; reset all states when toggling modes
                                setSlot(null)
                                setCardList([])
                                setSearch("")
                                setFromSlot(null)
                                setToSlot(null)
                                setSlotType(null)
                                setSelectedSlot(null)
                            }}
                            style={{
                                ...styles.rightPanelButton,
                                color: 'rgba(235,235,220,0.8)',
                                border: `1px solid ${hoveredButton === 'change-mode' ? '#0052CC' : 'rgba(0,82,204,0.4)'}`,
                                boxShadow: hoveredButton === 'change-mode' ? '0 0 8px rgba(0,82,204,0.6)' : 'none',
                            }}
                        >
                            Switch to {mode === 'add' ? 'Swap' : 'Add'} Mode
                        </button>
                        {mode === 'swap' && (
                            <div>
                                <p>From slot: {fromSlot ? `row ${fromSlot[0]}, col ${fromSlot[1]}` : 'not selected'}</p>
                                <p>To slot: {toSlot ? `row ${toSlot[0]}, col ${toSlot[1]}` : 'not selected'}</p>
                                {fromSlot && toSlot && (
                                    <button
                                        onMouseEnter={() => setHoveredButton('swap')}
                                        onMouseLeave={() => setHoveredButton(null)}
                                        onClick={() => swap()}
                                        style={{
                                            ...styles.rightPanelButton,
                                            color: 'rgba(235,235,220,0.8)',
                                            border: `1px solid ${hoveredButton === 'swap' ? '#0052CC' : 'rgba(0,82,204,0.4)'}`,
                                            boxShadow: hoveredButton === 'swap' ? '0 0 8px rgba(0,82,204,0.6)' : 'none',
                                        }}
                                    >
                                        Swap
                                    </button>
                                )}
                            </div>
                        )}
                        {selectedSlot && (
                            <div>
                                {selectedSlot.is_primary === undefined //check if is image or card
                                    ? <button
                                        onMouseEnter={() => setHoveredButton('get-price')}
                                        onMouseLeave={() => setHoveredButton(null)}
                                        onClick={() => getPrice(selectedSlot)}
                                        style={{
                                            ...styles.rightPanelButton,
                                            color: 'rgba(235,235,220,0.8)',
                                            border: `1px solid ${hoveredButton === 'get-price' ? '#d9c91f' : 'rgba(0,82,204,0.4)'}`,
                                            boxShadow: hoveredButton === 'get-price' ? '0 0 8px rgba(0,82,204,0.6)' : 'none',
                                        }}
                                    >
                                        Get Price
                                    </button>
                                    : null
                                }
                                {selectedSlot.is_primary === undefined //check if is image or card
                                    ? <button
                                        onMouseEnter={() => setHoveredButton('delete-card')}
                                        onMouseLeave={() => setHoveredButton(null)}
                                        onClick={() => deleteCard(selectedSlot)}
                                        style={{
                                            ...styles.rightPanelButton,
                                            color: 'rgba(235,235,220,0.8)',
                                            border: `1px solid ${hoveredButton === 'delete-card' ? '#E8001D' : 'rgba(0,82,204,0.4)'}`,
                                            boxShadow: hoveredButton === 'delete-card' ? '0 0 8px rgba(0,82,204,0.6)' : 'none',
                                        }}
                                    >
                                        Delete Card
                                    </button>
                                    : <button
                                        onMouseEnter={() => setHoveredButton('delete-image')}
                                        onMouseLeave={() => setHoveredButton(null)}
                                        onClick={() => deleteImage(selectedSlot)}
                                        style={{
                                            ...styles.rightPanelButton,
                                            color: 'rgba(235,235,220,0.8)',
                                            border: `1px solid ${hoveredButton === 'delete-image' ? '#E8001D' : 'rgba(0,82,204,0.4)'}`,
                                            boxShadow: hoveredButton === 'delete-image' ? '0 0 8px rgba(0,82,204,0.6)' : 'none',
                                        }}
                                    >
                                        Delete Image
                                    </button>
                                }
                            </div>
                        )}
                        {!aiPanelOpen && (
                            <button
                                onMouseEnter={() => setHoveredButton('ai-suggestions')}
                                onMouseLeave={() => setHoveredButton(null)}
                                onClick={() => {
                                    setAiPanelOpen(true)
                                    requestAnimationFrame(() => {
                                        setDisplayWidth(panelWidth)  //transitions smoothly to target
                                    })
                                }}
                                style={{
                                    ...styles.rightPanelButton,
                                    color: 'rgba(235,235,220,0.8)',
                                    border: `1px solid ${hoveredButton === 'ai-suggestions' ? '#ffffff' : 'rgba(0,82,204,0.4)'}`,
                                    boxShadow: hoveredButton === 'ai-suggestions' ? '0 0 8px rgba(0,82,204,0.6)' : 'none',
                                    transition: 'width 0.3s ease-out'
                                }}
                            >
                                AI Suggestions
                            </button>
                        )}
                    </div>
                </div>

                {/* panel handle */}
                {aiPanelOpen && (
                    <div
                        style={styles.aiPanelHandler}
                        onMouseDown={() => setDragging(true)}
                    >
                    </div>
                )}

                {/* ai panel */}
                {aiPanelOpen && (
                    <div style={{ ...styles.aiPanel, width: `${displayWidth}px` }}>
                        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', transition: 'width 0.3s ease-in' }}>
                            <h3>AI Suggestions (Groq)</h3>
                            <button onClick={() => {
                                setDisplayWidth(0)
                                setTimeout(() => {
                                    setAiPanelOpen(false)
                                }, 600)
                            }}
                            >
                                x
                            </button>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            {suggestions && (
                                loadingSuggestions //checks if loading
                                    ? <p>Generating suggestions...</p>
                                    : <p>{suggestions}</p>
                            )}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Input
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
                        </div>
                    </div>
                )}
            </div>
        </div >
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
    backButton: {
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
    page: {
        background: '#12121f',
        border: '1px solid rgba(0,82,204,0.25)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        padding: '10px',
        width: '35vw',
        height: '49vw',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
    },
    panel: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        padding: '8px 4px',
    },
    totalValue: {
        fontFamily: 'Rajdhani',
        fontSize: '15px',
        color: 'rgba(235,235,220,0.8)',
        padding: '4px 8px',
        background: 'transparent',
    },
    rightPanelButton: {
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
        background: 'transparent',
        color: 'rgba(255,255,255,0.4)',
        fontSize: '20px',
        aspectRatio: '2.5/3.5',
        borderRadius: '3px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    aiPanelHandler: {
        width: '2px',
        background: 'rgba(255,255,255,0.6)',
        cursor: 'col-resize'
    },
    aiPanel: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        overflow: 'hidden'
    },
    dialogTitle: {
        fontFamily: "'Rajdhani', sans-serif",
        fontSize: '20px',
        fontWeight: '700',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
    },
    formGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
    },
    label: {
        fontFamily: "'Exo 2', sans-serif",
        fontSize: '11px',
        fontWeight: '600',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: '#5A5A72',
    },
    addObjectButton: {
        flex: 1,
        padding: '7px',
        fontFamily: "'Rajdhani', sans-serif",
        fontSize: '13px',
        fontWeight: '700',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        clipPath: 'polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 5px 100%, 0 calc(100% - 5px))',
        transition: 'background 0.15s, color 0.15s',
    },
    dialogButton: {
        flex: 1,
        padding: '7px',
        border: '1px solid #0052CC',
        fontFamily: "'Rajdhani', sans-serif",
        fontSize: '13px',
        fontWeight: '700',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        clipPath: 'polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 5px 100%, 0 calc(100% - 5px))',
        transition: 'background 0.15s, color 0.15s',
    },
    cardText: {
        flex: 1,
        padding: '7px',
        fontFamily: "'Rajdhani', sans-serif",
        fontSize: '13px',
        fontWeight: '700',
        letterSpacing: '0.08em',
        color: 'rgba(235,235,220,0.8)'
    },
    widthRow: {
        display: 'flex',
        gap: '8px',
    },
    widthButton: {
        flex: 1,
        padding: '7px',
        border: '1px solid #0052CC',
        fontFamily: "'Rajdhani', sans-serif",
        fontSize: '13px',
        fontWeight: '700',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        clipPath: 'polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 5px 100%, 0 calc(100% - 5px))',
        transition: 'background 0.15s, color 0.15s',
    },
}

export default Page