import { useState } from 'react'

function Loading() {
    return (
        <div style={styles.loadingRoot}>
            <p style={styles.loadingText}>Loading...</p>
        </div>
    )
}

function ErrorMessage({ error, setError }) {
    const [hoveredButton, setHoveredButton] = useState(null)

    return (
        <div style={{ ...styles.errorMessage, flexDirection: 'column' }}>
            <div style={{ flexDirection: 'row', fontSize: '20px' }}>
                <p style={styles.errorText}>Error:</p>
                <button
                    onMouseEnter={() => setHoveredButton('close-error')}
                    onMouseLeave={() => setHoveredButton(null)}
                    onClick={() => setError(null)}
                    style={{
                        ...styles.closeButton,
                        textShadow: hoveredButton === 'close-error' ? '0 0 8px rgba(255, 255, 255, 0.9)' : 'none',
                    }}
                    title="Close error"
                >
                    ×
                </button>
            </div>
            <p style={{ ...styles.errorText, fontSize: '14px' }}>{error}</p>
        </div >
    )
}

const styles = {
    loadingRoot: {
        minHeight: '100vh',
        background: 'var(--background)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        fontFamily: "'Rajdhani', sans-serif",
        fontSize: '18px',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'var(--loading-text)',
    },
    errorMessage: {
        position: 'fixed',
        width: '34vw',
        background: 'var(--error-background)',
        left: '50%',
        transform: 'translateX(-50%)',
        top: 0,
        display: 'flex',
        alignItems: 'space-between',
        zIndex: 60,
        paddingLeft: '5px'
    },
    errorText: {
        fontFamily: "'Rajdhani', sans-serif",
        letterSpacing: '0.1em',
        color: 'var(--foreground)',
        display: 'flex',
        alignItems: 'center',
    },
    closeButton: {
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
        padding: 0,
    },
}

export { Loading, ErrorMessage }