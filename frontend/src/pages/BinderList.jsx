import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { handleError } from '../utils'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '../components/ui/dialog'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'

//colours for the binders
const PRESET_COLOURS = [
    { name: 'Crimson',  value: '#C0392B' },
    { name: 'Blue',     value: '#0052CC' },
    { name: 'Forest',   value: '#1E8449' },
    { name: 'Purple',   value: '#6C3483' },
    { name: 'Orange',   value: '#D35400' },
    { name: 'Teal',     value: '#117A65' },
    { name: 'Pink',     value: '#C0527A' },
    { name: 'Onyx',     value: '#1A1A2E' },
    { name: 'Gold',     value: '#B7950B' },
    { name: 'Steel',    value: '#5D6D7E' },
]

function BinderList() {
    const [binders, setBinders] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [name, setName] = useState('')
    const [size, setSize] = useState(9)
    const [colour, setColour] = useState(PRESET_COLOURS[0].value)
    const [selectedId, setSelectedId] = useState(null)
    const [dialogOpen, setDialogOpen] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        getBinders()
    }, [])

    const getBinders = async () => {
        try {
            const response = await fetch('http://localhost:5000/binderlist', {
                method: 'GET',
                credentials: 'include',
            })
            if (!response.ok) await handleError(response)
            const data = await response.json()
            setBinders(data)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const createBinder = async () => {
        try {
            const response = await fetch('http://localhost:5000/binderlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ name, size, colour })
            })
            if (!response.ok) await handleError(response)
            const data = await response.json()
            setBinders([...binders, data])
            //reset form
            setName('')
            setSize(9)
            setColour(PRESET_COLOURS[0].value)
            setDialogOpen(false)
        } catch (err) {
            setError(err.message)
        }
    }

    const deleteBinder = async (e, binder) => {
        //stop click from bubbling up to the binder click handler
        e.stopPropagation()
        try {
            const response = await fetch(`http://localhost:5000/binder/${binder.id}`, {
                method: 'DELETE',
                credentials: 'include',
            })
            if (!response.ok) await handleError(response)
            setBinders(binders.filter(b => b.id !== binder.id))
        } catch (err) {
            setError(err.message)
        }
    }

    const handleBinderClick = (binder) => {
        //prevent trigger if already animating
        if (selectedId !== null) return
        setSelectedId(binder.id)
        setTimeout(() => {
            navigate(`/binder/${binder.id}`)
        }, 600) //waits 6 secons for animation to finish
    }

    const logout = async () => {
        const response = await fetch('http://localhost:5000/logout', {
            method: 'POST',
            credentials: 'include',
        })
        if (response.ok) navigate('/login')
    }

    // Fill remaining slots up to 10
    const emptySlots = Math.max(0, 10 - binders.length)

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

            {/* Top bar */}
            <div style={styles.topBar}>
                <div style={styles.brand}>
                    TCG<span style={{ color: '#E8001D' }}>■</span>BINDER
                </div>
                <button onClick={logout} style={styles.logoutBtn} title="Logout">
                    {/* Arrow pointing left = exit */}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" 
                    strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    <span style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Exit</span>
                </button>
            </div>

            {/* Page title */}
            <div style={styles.titleArea}>
                <h1 style={styles.title}>My Collection</h1>
                <p style={styles.subtitle}>{binders.length} of 10 binders</p>
            </div>

            {/* Shelf area */}
            <div style={styles.shelfArea}>

                {/* The binders and empty slots */}
                <div style={styles.bindersRow}>

                    {/* Existing binders */}
                    {binders.map((binder) => {
                        const isSelected = selectedId === binder.id
                        return (
                            <div
                                key={binder.id}
                                onClick={() => handleBinderClick(binder)}
                                style={{
                                    ...styles.binder,
                                    background: `linear-gradient(135deg, ${binder.colour || '#0052CC'}, ${binder.colour || '#0052CC'}99)`,
                                    transform: isSelected ? 'translateY(-120%) scale(1.08)' : 'translateY(0) scale(1)',
                                    opacity: isSelected ? 0 : 1,
                                    transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease',
                                    boxShadow: isSelected
                                        ? 'none'
                                        : '4px 0 12px rgba(0,0,0,0.4), inset -2px 0 6px rgba(0,0,0,0.2)',
                                }}
                            >
                                {/* Spine highlight */}
                                <div style={styles.spineHighlight} />

                                {/* Vertical binder name */}
                                <span style={styles.binderName}>
                                    {binder.name}
                                </span>

                                {/* Delete button */}
                                <button
                                    onClick={(e) => deleteBinder(e, binder)}
                                    style={styles.deleteBtn}
                                    title="Delete binder"
                                >
                                    ×
                                </button>
                            </div>
                        )
                    })}

                    {/* Empty slots */}
                    {binders.length < 10 && (
                        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                            <DialogTrigger asChild>
                                <div style={styles.emptySlot}>
                                    <span style={styles.plusIcon}>+</span>
                                </div>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle style={styles.dialogTitle}>
                                        New Binder
                                    </DialogTitle>
                                </DialogHeader>

                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Name</label>
                                    <Input
                                        placeholder="e.g. Charizard Holos"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="bg-white text-black border-blue-600 border-l-4"
                                    />
                                </div>

                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Pocket Size</label>
                                    <div style={styles.sizeRow}>
                                        {[2, 3, 4].map(s => (
                                            <button
                                                key={s}
                                                onClick={() => setSize(s)}
                                                style={{
                                                    ...styles.sizeBtn,
                                                    background: size === s ? '#0052CC' : 'transparent',
                                                    color: size === s ? '#fff' : '#0052CC',
                                                }}
                                            >
                                                {s}-grid
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Colour</label>
                                    <div style={styles.colourRow}>
                                        {PRESET_COLOURS.map(c => (
                                            <button
                                                key={c.value}
                                                title={c.name}
                                                onClick={() => setColour(c.value)}
                                                style={{
                                                    ...styles.colourBtn,
                                                    background: c.value,
                                                    outline: colour === c.value
                                                        ? '3px solid #fff'
                                                        : '3px solid transparent',
                                                    boxShadow: colour === c.value
                                                        ? `0 0 0 5px ${c.value}66`
                                                        : 'none',
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <DialogFooter>
                                    <Button
                                        onClick={createBinder}
                                        disabled={!name.trim()}
                                        style={{
                                            fontFamily: "'Rajdhani', sans-serif",
                                            fontWeight: '700',
                                            letterSpacing: '0.1em',
                                            textTransform: 'uppercase',
                                        }}
                                    >
                                        Create Binder
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    )}

                    {/* Remaining empty visual slots after the + button */}
                    {Array.from({ length: emptySlots - 1 }).map((_, i) => (
                        <div key={`empty-${i}`} style={styles.emptySlotDead} />
                    ))}

                </div>

                {/* Shelf plank */}
                <div style={styles.shelf}>
                    <div style={styles.shelfEdge} />
                </div>

            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Exo+2:wght@400;500;600&display=swap');
            `}</style>
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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
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
    logoutBtn: {
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
    shelfArea: {
        padding: '0 32px',
        paddingBottom: '0',
    },
    bindersRow: {
        display: 'flex',
        alignItems: 'flex-end',
        gap: '6px',
        minHeight: '220px',
    },
    binder: {
        width: '60px',
        height: '200px',
        borderRadius: '3px 6px 6px 3px',
        cursor: 'pointer',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    spineHighlight: {
        position: 'absolute',
        left: '4px',
        top: '8px',
        bottom: '8px',
        width: '3px',
        background: 'rgba(255,255,255,0.2)',
        borderRadius: '2px',
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
    emptySlot: {
        width: '60px',
        height: '200px',
        border: '1px dashed rgba(255,255,255,0.15)',
        borderRadius: '3px 6px 6px 3px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        transition: 'border-color 0.2s',
    },
    plusIcon: {
        fontSize: '24px',
        color: 'rgba(255,255,255,0.25)',
        fontWeight: '300',
        lineHeight: 1,
    },
    emptySlotDead: {
        width: '60px',
        height: '200px',
        border: '1px dashed rgba(255,255,255,0.06)',
        borderRadius: '3px 6px 6px 3px',
        flexShrink: 0,
    },
    shelf: {
        height: '18px',
        background: 'linear-gradient(180deg, #2A2D3E 0%, #1A1D2E 100%)',
        borderRadius: '2px',
        marginTop: '2px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        position: 'relative',
    },
    shelfEdge: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: 'rgba(255,255,255,0.08)',
        borderRadius: '2px 2px 0 0',
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
    sizeRow: {
        display: 'flex',
        gap: '8px',
    },
    sizeBtn: {
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
    colourRow: {
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
    },
    colourBtn: {
        width: '28px',
        height: '28px',
        borderRadius: '50%',
        border: 'none',
        cursor: 'pointer',
        transition: 'box-shadow 0.15s, outline 0.15s',
    },
}

export default BinderList