import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { handleError } from '../utils'
import { Button } from '../components/ui/button'

function Binder() {
    const [binder, setBinder] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [pages, setPages] = useState([])
    const [folios, setFolios] = useState([])
    const [folioIndex, setFolioIndex] = useState(0)
    const [hoveredButton, setHoveredButton] = useState(null)
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
            getBinder()
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

    const clearPage = async (page) => {
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

    //to organise the pagese side by side before rendering
    const currentFolio = folios[folioIndex]

    if (!currentFolio) {
        return <div style={styles.root}>
            {/* Top bar */}
            <div style={styles.topBar}>
                <div style={styles.brand}>
                    TCG<span style={{ color: '#E8001D' }}>■</span>BINDER
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '15px', marginLeft: '8px' }}>— {binder.name}</span>
                </div>
                <button onClick={() => navigate('/binderlist')} style={styles.binderListButton} title="binderlist">
                    {/* Arrow pointing back to binderlist */}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                        strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    <span style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Collection</span>
                </button>
            </div>

            {/* Centered empty prompt */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
                <p style={styles.loadingText}>No pages yet</p>
                {pages.length < 30
                    ? <button onClick={() => addSheet()} style={styles.addSheetButton}>+</button>
                    : <p style={styles.loadingText}>Binder full</p>
                }
            </div>
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

    return (
        <div style={styles.root}>

            {/* Top bar */}
            <div style={styles.topBar}>
                <div style={styles.brand}>
                    TCG<span style={{ color: '#E8001D' }}>■</span>BINDER
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '15px', marginLeft: '8px' }}>— {binder.name}</span>
                </div>
                <button onClick={() => navigate('/binderlist')} style={styles.binderListButton} title="binderlist">
                    {/* Arrow pointing back to binderlist */}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                        strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    <span style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Collection</span>
                </button>
            </div>

            {/* Book area */}
            <div style={styles.outerBookBar}>

                {/* left arrow */}
                {folioIndex > 0 && <button
                    onClick={() => setFolioIndex(folioIndex - 1)}
                    onMouseEnter={() => setHoveredButton('left-arrow')}
                    onMouseLeave={() => setHoveredButton(null)}
                    style={{
                        ...styles.arrowButton,
                        textShadow: hoveredButton === 'left-arrow' ? '0 0 8px rgba(150, 223, 246, 0.6)' : 'none',
                    }}
                >
                    ←
                </button>}

                <div style={{ alignItems: 'flex-start', display: 'flex' }}>
                    {/* left page */}
                    {leftPage
                        ? (
                            <div>
                                <div style={styles.page}>
                                    <div style={{ ...styles.binderStrip, background: binder.colour }} />

                                    {/* grid */}
                                    {Array.from({ length: binder.size }, (_, i) => i).map(row => ( //create outer rows, each wrapped in div
                                        <div key={row} style={{ display: 'grid', gridTemplateColumns: `repeat(${binder.size}, 1fr)` }}>
                                            {Array.from({ length: binder.size }, (_, i) => i).map(col => { //create columns within each row
                                                const card = leftPage.cards.find(c => c.slot_row === row && c.slot_col === col)
                                                const image = leftPage.images.find(i => i.slot_row === row && i.slot_col === col)
                                                return ( //span sits next to other elements, div starts a new line
                                                    <span key={col} style={{ margin: '5px' }}>
                                                        {card // checks if cards exist or if the slot is empty
                                                            ? <img src={card.image_url} alt={card.name} style={{ width: '50px' }} />
                                                            : image //if no card, check if there is image, otherwise is empty
                                                                ? image.is_primary //check if is primary image, else skip
                                                                    ? <img src={image.image_url} style={{ width: '50px' }} />
                                                                    : <div />
                                                                : <div style={styles.cardSlot} />
                                                        }
                                                    </span>
                                                )
                                            })}
                                        </div>
                                    ))}
                                </div>

                                {/* footer buttons */}
                                <div style={styles.pageFooter}>
                                    <button
                                        onMouseEnter={() => setHoveredButton('left-nav')}
                                        onMouseLeave={() => setHoveredButton(null)}
                                        onClick={() => navigate(`/binder/${binder.id}/page/${leftPage.page_number}`)}
                                        style={{
                                            ...styles.footerButton,
                                            color: 'rgba(235,235,220,0.8)',
                                            border: `1px solid ${hoveredButton === 'left-nav' ? '#0052CC' : 'rgba(0,82,204,0.4)'}`,
                                            boxShadow: hoveredButton === 'left-nav' ? '0 0 8px rgba(0,82,204,0.6)' : 'none',
                                        }}
                                    >
                                        Page {leftPage.page_number}
                                    </button>
                                    <button
                                        onMouseEnter={() => setHoveredButton('left-clear')}
                                        onMouseLeave={() => setHoveredButton(null)}
                                        onClick={() => clearPage(leftPage)}
                                        style={{
                                            ...styles.footerButton,
                                            color: 'rgba(235,235,220,0.8)',
                                            border: `1px solid ${hoveredButton === 'left-clear' ? '#d9c91f' : 'rgba(0,82,204,0.4)'}`,
                                            boxShadow: hoveredButton === 'left-clear' ? '0 0 8px rgba(0,82,204,0.6)' : 'none',
                                        }}
                                    >
                                        Clear Page
                                    </button>
                                    <button
                                        onMouseEnter={() => setHoveredButton('left-delete')}
                                        onMouseLeave={() => setHoveredButton(null)}
                                        onClick={() => deleteSheet(leftPage)}
                                        style={{
                                            ...styles.footerButton,
                                            color: 'rgba(235,235,220,0.8)',
                                            border: `1px solid ${hoveredButton === 'left-delete' ? '#E8001D' : 'rgba(0,82,204,0.4)'}`,
                                            boxShadow: hoveredButton === 'left-delete' ? '0 0 8px rgba(0,82,204,0.6)' : 'none',
                                        }}
                                    >
                                        Delete Sheet
                                    </button>
                                </div>
                            </div>
                        )
                        : <div />}

                    {/* spine gap */}
                    <div style={{ width: '12px' }} />

                    {/* right page */}
                    <div>
                        {rightPage
                            ? (
                                <div>
                                    <div style={styles.page}>
                                        <div style={{ ...styles.binderStrip, background: binder.colour }} />  {/* strip first */}

                                        {/* grid */}
                                        {Array.from({ length: binder.size }, (_, i) => i).map(row => ( //create outer rows, each wrapped in div
                                            <div key={row} style={{ display: 'grid', gridTemplateColumns: `repeat(${binder.size}, 1fr)` }}>
                                                {Array.from({ length: binder.size }, (_, i) => i).map(col => { //create columns within each row
                                                    const card = rightPage.cards.find(c => c.slot_row === row && c.slot_col === col)
                                                    const image = rightPage.images.find(i => i.slot_row === row && i.slot_col === col)
                                                    return ( //span sits next to other elements, div starts a new line
                                                        <span key={col} style={{ margin: '5px' }}>
                                                            {card // checks if cards exist or if the slot is empty
                                                                ? <img src={card.image_url} alt={card.name} style={{ width: '50px' }} />
                                                                : image //if no card, check if there is image, otherwise is empty
                                                                    ? image.is_primary //check if is primary image, else skip
                                                                        ? <img src={image.image_url} style={{ width: '50px' }} />
                                                                        : <div />
                                                                    : <div style={styles.cardSlot} />
                                                            }
                                                        </span>
                                                    )
                                                })}
                                            </div>
                                        ))}
                                    </div>
                                    {/* footer buttons */}
                                    <div style={styles.pageFooter}>
                                        <button
                                            onMouseEnter={() => setHoveredButton('right-nav')}
                                            onMouseLeave={() => setHoveredButton(null)}
                                            onClick={() => navigate(`/binder/${binder.id}/page/${rightPage.page_number}`)}
                                            style={{
                                                ...styles.footerButton,
                                                color: 'rgba(235,235,220,0.8)',
                                                border: `1px solid ${hoveredButton === 'right-nav' ? '#0052CC' : 'rgba(0,82,204,0.4)'}`,
                                                boxShadow: hoveredButton === 'right-nav' ? '0 0 8px rgba(0,82,204,0.6)' : 'none',
                                            }}
                                        >
                                            Page {rightPage.page_number}
                                        </button>
                                        <button
                                            onMouseEnter={() => setHoveredButton('right-clear')}
                                            onMouseLeave={() => setHoveredButton(null)}
                                            onClick={() => clearPage(rightPage)}
                                            style={{
                                                ...styles.footerButton,
                                                color: 'rgba(235,235,220,0.8)',
                                                border: `1px solid ${hoveredButton === 'right-clear' ? '#d9c91f' : 'rgba(0,82,204,0.4)'}`,
                                                boxShadow: hoveredButton === 'right-clear' ? '0 0 8px rgba(0,82,204,0.6)' : 'none',
                                            }}
                                        >
                                            Clear Page
                                        </button>
                                        <button
                                            onMouseEnter={() => setHoveredButton('right-delete')}
                                            onMouseLeave={() => setHoveredButton(null)}
                                            onClick={() => deleteSheet(rightPage)}
                                            style={{
                                                ...styles.footerButton,
                                                color: 'rgba(235,235,220,0.8)',
                                                border: `1px solid ${hoveredButton === 'right-delete' ? '#E8001D' : 'rgba(0,82,204,0.4)'}`,
                                                boxShadow: hoveredButton === 'right-delete' ? '0 0 8px rgba(0,82,204,0.6)' : 'none',
                                            }}
                                        >
                                            Delete Sheet
                                        </button>
                                    </div>
                                </div>
                            )
                            : pages.length < 30
                                ?
                                <div>
                                    <div style={{ ...styles.page, alignItems: 'center', justifyContent: 'center' }}>
                                        <div style={{ height: '6px', marginBottom: '1px' }}></div>
                                        <button
                                            onMouseEnter={() => setHoveredButton('add-sheet')}
                                            onMouseLeave={() => setHoveredButton(null)}
                                            onClick={() => addSheet()}
                                            style={{
                                                ...styles.addSheetButton,
                                                textShadow: hoveredButton === 'add-sheet' ? '0 0 8px rgba(255, 255, 255, 0.6)' : 'none',
                                            }}
                                        >
                                            +
                                        </button>
                                    </div>
                                    <div style={{ height: '3vw' }}></div>
                                </div>
                                : <div />
                        }
                    </div>
                </div>

                {/* right arrow */}
                {folioIndex < folios.length - 1 && <button
                    onClick={() => setFolioIndex(folioIndex + 1)}
                    onMouseEnter={() => setHoveredButton('right-arrow')}
                    onMouseLeave={() => setHoveredButton(null)}
                    style={{
                        ...styles.arrowButton,
                        textShadow: hoveredButton === 'right-arrow' ? '0 0 8px rgba(150, 223, 246, 0.6)' : 'none',
                    }}
                >
                    →
                </button>}
            </div >

            {/* Folio indicator */}
            <div style={styles.folioIndicator}>
                {folios.map((_, i) => (
                    <div key={i} style={i === folioIndex ? { ...styles.folioDot, ...styles.folioDotActive } : styles.folioDot} />
                ))}
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
    titleArea: {
        padding: '40px 32px 0',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        paddingBottom: '40px',
    },
    title: {
        fontFamily: "'Rajdhani', sans-serif",
        fontSize: '48px',
        fontWeight: '700',
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        color: '#fff',
        lineHeight: 1,
    },
    subtitle: {
        fontFamily: "'Exo 2', sans-serif",
        fontSize: '13px',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.35)',
        marginTop: '6px',
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
    deleteBtn: {
        position: 'absolute',
        top: '4px',
        right: '4px',
        width: '16px',
        height: '16px',
        background: 'rgba(0,0,0,0.4)',
        border: 'none',
        borderRadius: '50%',
        color: 'rgba(255,255,255,0.7)',
        fontSize: '14px',
        lineHeight: '14px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0,
        transition: 'opacity 0.2s',
        padding: 0,
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

export default Binder