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
import { Input } from '../components/ui/input'
import { Loading, ErrorMessage } from '../components/StatusMessage'
import API_URL from '../config'

function BinderList() {
    const [binders, setBinders] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [name, setName] = useState('')
    const [size, setSize] = useState(3)
    const [colour, setColour] = useState(PRESET_COLOURS[0].value)
    const [selectedId, setSelectedId] = useState(null)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [hoveredButton, setHoveredButton] = useState(null)
    const [hoveredId, setHoveredId] = useState(null)
    const navigate = useNavigate()

    //states to change between entering and editing
    const [mode, setMode] = useState('normal')
    const [selectedBinder, setSelectedBinder] = useState(null)

    useEffect(() => {
        getBinders()
    }, [])

    const getBinders = async () => {
        try {
            const response = await fetch(`${API_URL}/binderlist`, {
                method: 'GET',
                credentials: 'include',
            })
            if (!response.ok) await handleError(response, navigate)
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
            const response = await fetch(`${API_URL}/binderlist`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ name, size, colour })
            })
            if (!response.ok) await handleError(response, navigate)
            const data = await response.json()
            setBinders([...binders, data])
            //reset form
            setName('')
            setSize(3)
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
            const response = await fetch(`${API_URL}/${binder.id}`, {
                method: 'DELETE',
                credentials: 'include',
            })
            if (!response.ok) await handleError(response, navigate)
            setBinders(binders.filter(b => b.id !== binder.id))
        } catch (err) {
            setError(err.message)
        }
    }

    const renameBinder = async (name, binder) => {
        try {
            const response = await fetch(`${API_URL}/${binder.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ name })
            })
            if (!response.ok) await handleError(response, navigate)
            const data = await response.json()
            setSelectedBinder(null)
            getBinders()
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
        }, 600) //waits 6 seconds for animation to finish
    }

    const logout = async () => {
        const response = await fetch(`${API_URL}/logout`, {
            method: 'POST',
            credentials: 'include',
        })
        if (response.ok) navigate('/login')
    }

    // Fill remaining slots up to 10
    const emptySlots = Math.max(0, 10 - binders.length)

    if (loading) return (
        <Loading />
    )

    return (
        <div style={styles.root}>
            {/* Error Message */}
            {error
                ? <ErrorMessage error={error} setError={setError} />
                : null}

            {/* Top bar */}
            <div style={styles.topBar}>
                <div style={styles.brand}>
                    TCG<span style={{ color: 'var(--danger)' }}>■</span>BINDER
                </div>
                <button
                    onMouseEnter={() => setHoveredButton('logout')}
                    onMouseLeave={() => setHoveredButton(null)}
                    onClick={logout}
                    style={{
                        ...styles.logoutButton,
                        border: `1px solid ${hoveredButton === 'logout' ? 'var(--back)' : 'rgba(255,255,255,0.15)'}`,
                    }}
                    title="logout"
                >
                    {/* Arrow pointing left = exit */}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                        strokeLinejoin="round"> {/* drawing area is 24 by 24 */}
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /> {/* forms the box / bracket shape */}
                        <polyline points="16 17 21 12 16 7" /> {/* forms the arrow head  */}
                        <line x1="21" y1="12" x2="9" y2="12" /> {/* forms the arrow line */}
                    </svg>
                    <span
                        style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Logout</span>
                </button>
            </div>

            {/* Toggle Mode */}
            <div style={{ textAlign: 'right', marginTop: '5px' }}>
                <button
                    onMouseEnter={() => setHoveredButton('change-mode')}
                    onMouseLeave={() => setHoveredButton(null)}
                    onClick={() => {
                        setMode(mode === 'normal' ? 'edit' : 'normal') //button to toggle between modes; reset all states when toggling modes
                    }}
                    style={{
                        ...styles.toggleButton,
                        border: `1px solid ${hoveredButton === 'change-mode' ? 'var(--border)' : 'rgba(0,82,204,0.4)'}`,
                        boxShadow: hoveredButton === 'change-mode' ? '0 0 8px rgba(0,82,204,0.6)' : 'none',
                    }}
                >
                    Switch to {mode === 'normal' ? 'Edit' : 'Normal'} Mode
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
                            mode === 'normal'
                                ? <div
                                    key={binder.id}
                                    onMouseEnter={() => setHoveredId(binder.id)}
                                    onMouseLeave={() => setHoveredId(null)}
                                    onClick={() => handleBinderClick(binder)}
                                    style={{
                                        ...styles.binder,
                                        background: `linear-gradient(135deg, ${binder.colour || 'var(--border)'}, ${binder.colour || 'var(--border)'}99)`,
                                        transform: isSelected ? 'translateY(-120%) scale(1.08)' : 'translateY(0) scale(1)',
                                        opacity: isSelected ? 0 : 1,
                                        transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease',
                                        boxShadow: isSelected
                                            ? 'none'
                                            : '4px 0 12px rgba(0,0,0,0.4), inset -2px 0 6px rgba(0,0,0,0.2)',
                                        border: hoveredId === binder.id ? 'rgb(255, 255, 255)' : null
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
                                        onMouseEnter={() => setHoveredButton('delete-binder')}
                                        onMouseLeave={() => setHoveredButton(null)}
                                        onClick={(e) => deleteBinder(e, binder)}
                                        style={{
                                            ...styles.deleteButton,
                                            opacity: hoveredId === binder.id ? 1 : 0,
                                            textShadow: hoveredButton === 'delete-binder' ? '0 0 8px rgba(255, 255, 255, 0.9)' : 'none',
                                        }}
                                        title="Delete binder"
                                    >
                                        ×
                                    </button>
                                </div>
                                : <div
                                    key={binder.id}
                                    onMouseEnter={() => setHoveredId(binder.id)}
                                    onMouseLeave={() => setHoveredId(null)}
                                    onClick={() => setSelectedBinder(binder)}
                                    style={{
                                        ...styles.binder,
                                        background: `linear-gradient(135deg, ${binder.colour || 'var(--border)'}, ${binder.colour || 'var(--border)'}99)`,
                                        border: hoveredId === binder.id ? 'rgb(255, 255, 255)' : null
                                    }}
                                >
                                    {/* Spine highlight */}
                                    <div style={styles.spineHighlight} />

                                    {/* Vertical binder name */}
                                    <span style={styles.binderName}>
                                        {binder.name}
                                    </span>
                                </div>
                        )
                    })}

                    {/* Dialog for name change */}
                    <Dialog open={selectedBinder} onOpenChange={setSelectedBinder}>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle style={styles.dialogTitle}>
                                        Rename Binder
                                    </DialogTitle>
                                </DialogHeader>

                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Name</label>
                                    <Input
                                        placeholder= {selectedBinder?.name}
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>

                                <DialogFooter>
                                    <button
                                        onMouseEnter={() => setHoveredButton('rename-binder')}
                                        onMouseLeave={() => setHoveredButton(null)}
                                        onClick={() => renameBinder(name, selectedBinder)}
                                        disabled={!name.trim()}
                                        style={{
                                            ...styles.dialogButton,
                                            color: 'var(--primary-text)',
                                            border: `1px solid ${hoveredButton === 'rename-binder' ? 'var(--border)' : 'rgba(255,255,255,0.15)'}`,
                                            boxShadow: hoveredButton === 'rename-binder' ? '0 0 8px rgba(0,82,204,0.6)' : 'none',
                                        }}
                                    >
                                        Change Name
                                    </button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                    {/* Empty slots */}
                    {binders.length < 10 && (
                        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                            <DialogTrigger asChild>
                                <div
                                    onMouseEnter={() => setHoveredButton('add-binder')}
                                    onMouseLeave={() => setHoveredButton(null)}
                                    disabled={!name.trim()}
                                    style={{
                                        ...styles.emptySlot,
                                        boxShadow: hoveredButton === 'add-binder' ? '0 0 8px rgba(255,255,255,0.6)' : 'none',
                                    }}
                                >
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
                                                    ...styles.sizeButton,
                                                    background: size === s ? 'var(--border)' : 'var(--background)',
                                                    color: size === s ? '#fff' : 'var(--border)',
                                                }}
                                            >
                                                {s}-pocket
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Colour</label>
                                    <div style={styles.colourRow}>
                                        {PRESET_COLOURS.map(preset => (
                                            <button
                                                key={preset.value}
                                                title={preset.name}
                                                onClick={() => setColour(preset.value)}
                                                style={{
                                                    ...styles.colourButton,
                                                    background: preset.value,
                                                    outline: colour === preset.value
                                                        ? '3px solid #fff'
                                                        : '3px solid transparent',
                                                    boxShadow: colour === preset.value
                                                        ? `0 0 0 5px ${preset.value}66`
                                                        : 'none',
                                                }}

                                            />
                                        ))}
                                    </div>
                                </div>

                                <DialogFooter>
                                    <button
                                        onMouseEnter={() => setHoveredButton('create-binder')}
                                        onMouseLeave={() => setHoveredButton(null)}
                                        onClick={createBinder}
                                        disabled={!name.trim()}
                                        style={{
                                            ...styles.dialogButton,
                                            color: 'var(--primary-text)',
                                            border: `1px solid ${hoveredButton === 'create-binder' ? 'var(--border)' : 'rgba(255,255,255,0.15)'}`,
                                            boxShadow: hoveredButton === 'create-binder' ? '0 0 8px rgba(0,82,204,0.6)' : 'none',
                                        }}
                                    >
                                        Create Binder
                                    </button>
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

//colours for the binders
const PRESET_COLOURS = [
    { name: 'Crimson', value: '#C0392B' },
    { name: 'Blue', value: '#0052CC' },
    { name: 'Forest', value: '#1E8449' },
    { name: 'Purple', value: '#6C3483' },
    { name: 'Orange', value: '#D35400' },
    { name: 'Teal', value: '#117A65' },
    { name: 'Pink', value: '#C0527A' },
    { name: 'Onyx', value: '#1A1A2E' },
    { name: 'Gold', value: '#B7950B' },
    { name: 'Steel', value: '#5D6D7E' },
]

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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
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
    logoutButton: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        background: 'transparent',
        color: 'var(--muted-text)',
        padding: '6px 12px',
        cursor: 'pointer',
        fontFamily: "'Exo 2', sans-serif",
        clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))',
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
        color: 'var(--loading-text)',
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
        width: '9vw',
        height: '27vw',
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
    deleteButton: {
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
        padding: 0,
    },
    emptySlot: {
        width: '9vw',
        height: '27vw',
        border: '1px dashed rgba(255,255,255,0.15)',
        borderRadius: '3px 6px 6px 3px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    plusIcon: {
        fontSize: '24px',
        color: 'rgba(255,255,255,0.25)',
        fontWeight: '300',
        lineHeight: 1,
    },
    emptySlotDead: {
        width: '9vw',
        height: '27vw',
        border: '1px dashed rgba(255,255,255,0.06)',
        borderRadius: '3px 6px 6px 3px',
        flexShrink: 0,
    },
    shelf: {
        height: '1.5vw',
        background: 'linear-gradient(180deg, #432200 0%, #351a00 100%)',
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
    sizeButton: {
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
    colourRow: {
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
    },
    colourButton: {
        width: '28px',
        height: '28px',
        borderRadius: '50%',
        border: 'none',
        cursor: 'pointer',
        transition: 'box-shadow 0.15s, outline 0.15s',
    },
    dialogButton: {
        flex: 1,
        padding: '7px',
        border: '1px solid var(--border)',
        fontFamily: "'Rajdhani', sans-serif",
        fontSize: '13px',
        fontWeight: '700',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        clipPath: 'polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 5px 100%, 0 calc(100% - 5px))',
        background: 'transparent'
    },
    toggleButton: {
        fontFamily: 'Rajdhani',
        fontSize: '11px',
        padding: '4px 8px',
        border: '1px solid var(--border)',
        background: 'transparent',
        cursor: 'pointer',
        clipPath: 'polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 5px 100%, 0 calc(100% - 5px))',
        width: '140px',
        height: '40px',
    },
}

export default BinderList