import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { handleError } from '../utils'
import ReactMarkdown from 'react-markdown'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from '../components/ui/select'
import { Loading, ErrorMessage } from '../components/StatusMessage'
import API_URL from '../config'

function Page() {
    const [binderName, setBinderName] = useState("")
    const [page, setPage] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [cards, setCards] = useState([])
    const [images, setImages] = useState([])
    const [colour, setColour] = useState(null)
    const [hoveredButton, setHoveredButton] = useState(null)
    const navigate = useNavigate()

    //states for card and image addition
    const [slot, setSlot] = useState(null)
    const [slotType, setSlotType] = useState(null)
    const [cardList, setCardList] = useState([])
    const [search, setSearch] = useState("")
    const [image_url, setImage_url] = useState("")
    const [width, setWidth] = useState("1")
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

    useEffect(() => { //for the adjustable panel
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
            const response = await fetch(`${API_URL}/binder/${id}/page/${number}`, {
                method: 'GET',
                credentials: 'include'
            })

            if (!response.ok) {
                await handleError(response, navigate)
            }

            const data = await response.json()
            setBinderName(data.binder_name)
            setPage(data)
            setCards(data.cards)
            setImages(data.images)
            setColour(data.colour)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const searchCard = async () => {
        try {
            const response = await fetch(`${API_URL}/cards/search?name=${search}`, {
                method: 'GET',
                credentials: 'include',
            })

            if (!response.ok) {
                await handleError(response, navigate)
            }

            const data = await response.json()
            setCardList(data)
        } catch (err) {
            setError(err.message)
        }
    }

    const addCard = async (card) => {
        try {
            const response = await fetch(`${API_URL}/binder/${id}/page/${number}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    card_id: card.card_id,
                    name: card.name,
                    card_number: card.number,
                    card_set: card.set,
                    image_url: card.image,
                    slot_row: slot[0],
                    slot_col: slot[1]
                })
            })

            if (!response.ok) {
                await handleError(response, navigate)
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
            const response = await fetch(`${API_URL}/binder/${id}/page/${number}/card/${card.id}`, {
                method: 'DELETE',
                credentials: 'include',
            })

            if (!response.ok) {
                await handleError(response, navigate)
            }

            const data = await response.json()
            setCards(cards.filter(c => c.id !== card.id)) //removing the deleted card
        } catch (err) {
            setError(err.message)
        }
    }

    const addImage = async (image, width) => {
        try {
            const response = await fetch(`${API_URL}/binder/${id}/page/${number}/image`, {
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
                await handleError(response, navigate)
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
            const response = await fetch(`${API_URL}/binder/${id}/page/${number}/image/${image.id}`, {
                method: 'DELETE',
                credentials: 'include',
            })

            if (!response.ok) {
                await handleError(response, navigate)
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
            const response = await fetch(`${API_URL}/binder/${id}/page/${number}`, {
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
                await handleError(response, navigate)
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
            const response = await fetch(`${API_URL}/binder/${id}/page/${number}/card/${card.id}/price`, {
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

    const aiSuggestions = async () => {
        try {
            setLoadingSuggestions(true)
            const response = await fetch(`${API_URL}/binder/${id}/page/${number}/suggestions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    user_prompt: userPrompt,
                    style: style
                })
            })

            if (!response.ok) {
                await handleError(response, navigate)
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

    if (loading) return (
        <Loading />
    )

    return (
        <div style={styles.root}>
            {/* Error Message */}
            {error
                ? <ErrorMessage error={error} setError={setError} />
                : null}

            {/* top bar */}
            <div style={styles.topBar}>
                <div style={styles.brand}>
                    TCG<span style={{ color: 'var(--danger)' }}>■</span>BINDER
                    <span style={{ color: 'var(--loading-text)', fontSize: '15px', marginLeft: '8px' }}>— {binderName}</span>
                    <span style={{ color: 'var(--loading-text)', fontSize: '15px', marginLeft: '8px' }}>Page {page.page_number}</span>
                </div>
                <button
                    onMouseEnter={() => setHoveredButton('collection')}
                    onMouseLeave={() => setHoveredButton(null)}
                    onClick={() => navigate(`/binder/${id}`)}
                    style={{
                        ...styles.backButton,
                        gap: '6px',
                        padding: '6px 12px',
                        border: `1px solid ${hoveredButton === 'collection' ? 'var(--back)' : 'rgba(255,255,255,0.15)'}`,
                    }}
                    title="binder"
                >
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
                <div style={{ padding: '20px 32px', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', flex: 1 }}>
                    {/* left panel */}
                    <div style={styles.panel}>
                        {selectedSlot
                            ? prices[selectedSlot.id] //check if prices have been fetched, else it fetches them
                                ? prices[selectedSlot.id] === 'unavailable' //note: no pricing vs not loading is different
                                    ? <p style={styles.valueText}>No pricing available</p>
                                    : <div>
                                        {Object.entries(prices[selectedSlot.id]).map(([type, values]) => (
                                            <div key={type} style={styles.valueText}>
                                                <p>{type}: low ${values.low} mid ${values.mid} high ${values.high}</p>
                                            </div>
                                        ))}
                                    </div>
                                : loadingPrice[selectedSlot.id]
                                    ? <p>Loading Price...</p>
                                    : <div />
                            : <div />
                        }
                    </div>

                    {/* grid */}
                    <div style={{
                        ...styles.page,
                        borderTop: `5px solid ${colour}`,
                        borderLeft: `5px solid ${number % 2 === 0 ? colour : 'none'}`,
                        borderRight: `5px solid ${number % 2 === 1 ? colour : 'none'}`,
                        borderBottom: `5px solid ${colour}`
                    }}
                    >
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
                                                gridColumn: image && image.width === 2 ? 'span 2' : undefined,
                                                border: (fromSlot && fromSlot[0] === row && fromSlot[1] === col) ||
                                                    (toSlot && toSlot[0] === row && toSlot[1] === col)
                                                    ? '1px solid rgba(255,255,255,0.8)'
                                                    : 'none'
                                            }}>
                                                {card // checks if cards exist or if the slot is empty
                                                    ? mode === 'add'
                                                        ? <div style={{ display: 'flex', flexDirection: 'row', }}>
                                                            <div style={{ height: '100%' }}>
                                                                <img src={card.image_url} alt={card.name} onClick={() => setSelectedSlot(card)}
                                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                            </div>
                                                        </div>
                                                        : <div style={{ height: '100%' }}>
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
                                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        </div>
                                                    : image //if no card, check if there is image, otherwise is empty
                                                        ? mode === 'add'
                                                            ? <div style={{ height: '100%' }}>
                                                                <img src={image.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onClick={() => setSelectedSlot(image)} />
                                                            </div>
                                                            : <div style={{ height: '100%' }}>
                                                                <img src={image.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onClick={() => {
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
                    <Dialog open={slot !== null} onOpenChange={(isOpen) => { if (!isOpen) { setSlot(null); setSlotType(null); setWidth("1") } }}>
                        <DialogContent showCloseButton={slotType === null}>
                            <DialogHeader>
                                {slotType === 'card'
                                    ? <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <DialogTitle style={styles.dialogTitle}>Add Card</DialogTitle>
                                        <button
                                            onMouseEnter={() => setHoveredButton('back-dialog')}
                                            onMouseLeave={() => setHoveredButton(null)}
                                            onClick={() => setSlotType(null)}
                                            style={{
                                                ...styles.backButton,
                                                gap: '2px',
                                                padding: '3px 6px',
                                                color: 'var(--foreground)',
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
                                    : slotType === 'image'
                                        ? <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <DialogTitle style={styles.dialogTitle}>Add Image</DialogTitle>
                                            <button
                                                onMouseEnter={() => setHoveredButton('back-dialog')}
                                                onMouseLeave={() => setHoveredButton(null)}
                                                onClick={() => setSlotType(null)}
                                                style={{
                                                    ...styles.backButton,
                                                    gap: '2px',
                                                    padding: '3px 6px',
                                                    color: 'var(--foreground)',
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
                                        : <DialogTitle style={styles.dialogTitle}>Add Item</DialogTitle>}
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
                                                ...styles.addObjectButton,
                                                color: 'var(--foreground)',
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
                                                color: 'var(--foreground)',
                                                border: `1px solid ${hoveredButton === 'add-image' ? '#f4f7bd' : 'rgba(0,82,204,0.4)'}`,
                                            }}>
                                            Add Image
                                        </button>
                                    </div>
                                    : slotType == 'card'
                                        ? <div style={styles.formGroup}>
                                            <Input
                                                type="text"
                                                placeholder="Search card"
                                                value={search}
                                                onChange={(e) => setSearch(e.target.value)}
                                            />
                                            <button style={styles.dialogButton} onClick={() => searchCard()}>Search</button>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', overflowY: 'auto', maxHeight: '80vh' }}>
                                                {cardList.map(card => (
                                                    <div key={`${card.number}-${card.set}`}>
                                                        <img src={card.image} alt={card.name} style={{ width: '50px' }} onClick={() => addCard(card)} />
                                                        <p style={styles.cardText}>{card.name} — {card.set}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        : <div style={styles.formGroup}>
                                            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                                                <Input
                                                    type="text"
                                                    placeholder="Set Image"
                                                    value={image_url}
                                                    onChange={(e) => setImage_url(e.target.value)}
                                                />
                                                <Select
                                                    style={{ ...styles.inputText, width: '85px' }}
                                                    value={width}
                                                    onValueChange={(e) => setWidth(e)}
                                                >
                                                    <SelectTrigger className="font-rajdhani text-[12px] min-w-[100px] w-[100px] h-[15px]">
                                                        <SelectValue placeholder="Select width" />
                                                    </SelectTrigger>
                                                    <SelectContent className="font-rajdhani min-w-[100px]">
                                                        <SelectItem value="1">Width: 1</SelectItem>
                                                        <SelectItem value="2">Width: 2</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <button onClick={() => addImage(image_url, Number(width))} style={styles.dialogButton}>Search</button>
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
                                color: 'var(--foreground)',
                                border: `1px solid ${hoveredButton === 'change-mode' ? 'var(--border)' : 'rgba(0,82,204,0.4)'}`,
                                boxShadow: hoveredButton === 'change-mode' ? '0 0 8px rgba(0,82,204,0.6)' : 'none',
                            }}
                        >
                            Switch to {mode === 'add' ? 'Swap' : 'Add'} Mode
                        </button>
                        {mode === 'swap' && (
                            <div>
                                {fromSlot && toSlot && (
                                    <button
                                        onMouseEnter={() => setHoveredButton('swap')}
                                        onMouseLeave={() => setHoveredButton(null)}
                                        onClick={() => swap()}
                                        style={{
                                            ...styles.rightPanelButton,
                                            color: 'var(--foreground)',
                                            border: `1px solid ${hoveredButton === 'swap' ? 'var(--border)' : 'rgba(0,82,204,0.4)'}`,
                                            boxShadow: hoveredButton === 'swap' ? '0 0 8px rgba(0,82,204,0.6)' : 'none',
                                        }}
                                    >
                                        Swap
                                    </button>
                                )}
                            </div>
                        )}
                        {selectedSlot && (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {selectedSlot.is_primary === undefined //check if is image or card
                                    ? <button
                                        onMouseEnter={() => setHoveredButton('get-price')}
                                        onMouseLeave={() => setHoveredButton(null)}
                                        onClick={() => getPrice(selectedSlot)}
                                        style={{
                                            ...styles.rightPanelButton,
                                            color: 'var(--foreground)',
                                            border: `1px solid ${hoveredButton === 'get-price' ? 'var(--caution)' : 'rgba(0,82,204,0.4)'}`,
                                            boxShadow: hoveredButton === 'get-price' ? '0 0 8px rgba(0,82,204,0.6)' : 'none',
                                        }}
                                    >
                                        Fetch Price
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
                                            color: 'var(--foreground)',
                                            border: `1px solid ${hoveredButton === 'delete-card' ? 'var(--danger)' : 'rgba(0,82,204,0.4)'}`,
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
                                            color: 'var(--foreground)',
                                            border: `1px solid ${hoveredButton === 'delete-image' ? 'var(--danger)' : 'rgba(0,82,204,0.4)'}`,
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
                                    color: 'var(--foreground)',
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

                {/* panel resizing handle */}
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
                            <h3 style={styles.aiHeader}>AI Suggestions (Groq)</h3>
                            <button
                                onMouseEnter={() => setHoveredButton('close-ai')}
                                onMouseLeave={() => setHoveredButton(null)}
                                onClick={() => {
                                    setDisplayWidth(0)
                                    setTimeout(() => {
                                        setAiPanelOpen(false)
                                    }, 600)
                                }}
                                style={{
                                    ...styles.aiButton,
                                    background: hoveredButton === 'close-ai' ? 'var(--danger)' : 'transparent'
                                }}
                            >
                                ×
                            </button>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            {suggestions && (
                                loadingSuggestions //checks if loading
                                    ? <p style={styles.aiText}>Generating suggestions...</p>
                                    : <div style={styles.aiText}>
                                        <ReactMarkdown>{suggestions}</ReactMarkdown>
                                    </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Input
                                type="text"
                                placeholder="Good day, how may I be of assistance?"
                                value={userPrompt}
                                onChange={(e) => setUserPrompt(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') aiSuggestions() }}
                                style={styles.inputText}
                            />
                            <Select
                                style={{ ...styles.inputText, width: '85px' }}
                                value={style}
                                onValueChange={(e) => setStyle(e)}
                            >
                                <SelectTrigger className="font-rajdhani text-[var(--ai-text)] text-[12px] min-w-[100px] w-[100px] h-[15px]">
                                    <SelectValue placeholder="Select style" />
                                </SelectTrigger>
                                <SelectContent className="font-rajdhani text-[var(--ai-text)] min-w-[100px]">
                                    <SelectItem value="traditional">Traditional</SelectItem>
                                    <SelectItem value="michi">Michi</SelectItem>
                                </SelectContent>
                            </Select>
                            <button
                                onMouseEnter={() => setHoveredButton('search-ai')}
                                onMouseLeave={() => setHoveredButton(null)}
                                onClick={() => { if (userPrompt) aiSuggestions() }}
                                style={{
                                    ...styles.aiButton,
                                    background: hoveredButton === 'search-ai' ? 'var(--border)' : 'transparent'
                                }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"
                                    strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="12" y1="19" x2="12" y2="5" /> {/* arrow line */}
                                    <polyline points="5 12 12 5 19 12" /> {/* upwards arrow head */}
                                </svg>
                            </button>
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
        background: 'var(--background)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Exo 2', sans-serif",
        overflow: 'hidden',
    },
    topBar: {
        display: 'flex', //keeps things horizontally
        alignItems: 'center',
        justifyContent: 'space-between', //pushes one child to left and other to the right
        padding: '20px 32px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        height: '8vh'
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
        background: 'transparent',
        border: '1px solid rgba(255,255,255,0.15)',
        color: 'var(--muted-foreground)',
        cursor: 'pointer',
        fontFamily: "'Exo 2', sans-serif",
        clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))',
        transition: 'color 0.2s, border-color 0.2s',
    },
    page: {
        background: 'var(--grid)',
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
    valueText: {
        fontFamily: 'Rajdhani',
        fontSize: '11px',
        color: 'var(--foreground)',
        padding: '4px 8px',
        background: 'transparent',
    },
    rightPanelButton: {
        fontFamily: 'Rajdhani',
        fontSize: '11px',
        padding: '4px 8px',
        border: '1px solid var(--border)',
        background: 'transparent',
        cursor: 'pointer',
        clipPath: 'polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 5px 100%, 0 calc(100% - 5px))',
        width: '120px',
        height: '40px',
    },
    cardSlot: {
        border: '1px solid rgba(0,82,204,0.25)',
        background: 'transparent',
        color: 'var(--loading-text)',
        fontSize: '20px',
        aspectRatio: '2.5/3.5',
        borderRadius: '3px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    aiPanelHandler: {
        width: '2px',
        background: 'var(--muted-foreground)',
        cursor: 'col-resize'
    },
    aiPanel: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        overflow: 'hidden',
        background: 'var(--background)',
        maxHeight: '92vh',
    },
    aiHeader: {
        fontFamily: "'Rajdhani', sans-serif",
        fontSize: '24px',
        fontWeight: '600',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: '#fff',
        lineHeight: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0'
    },
    aiText: {
        flex: 1,
        padding: '7px',
        fontFamily: "'Rajdhani', sans-serif",
        fontSize: '12px',
        fontWeight: '600',
        letterSpacing: '0.08em',
        color: 'var(--ai-text)',
        border: 'var(--back)'
    },
    inputText: {
        padding: '3px',
        fontFamily: "'Rajdhani', sans-serif",
        fontSize: '12px',
        fontWeight: '600',
        letterSpacing: '0.08em',
        color: 'var(--ai-text)',
        border: 'var(--back)'
    },
    aiButton: {
        fontFamily: 'Rajdhani',
        fontSize: '22px',
        padding: '4px 8px',
        cursor: 'pointer',
        width: '2vw',
        height: '2vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid var(--back)',
        lineHeight: '1'
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
        fontWeight: '400',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        clipPath: 'polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 5px 100%, 0 calc(100% - 5px))',
        transition: 'background 0.15s, color 0.15s',
    },
    dialogButton: {
        flex: 1,
        padding: '7px',
        border: '1px solid var(--border)',
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
        color: 'var(--foreground)'
    },
    widthButton: {
        flex: 1,
        padding: '7px',
        border: '1px solid var(--border)',
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