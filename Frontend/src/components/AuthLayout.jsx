import { useMemo } from 'react'

//cards available in the pool
const ALL_CARDS = [
    '/cards/nidoking.png',
    '/cards/zekrom.png',
    '/cards/umbreon-karen.png',
    '/cards/dark-venusaur.png',
    '/cards/dark-charizard.png',
    '/cards/pikachu.png',
    '/cards/gardevoir.png',
    '/cards/palkia.png',
    '/cards/sigilyph.png',
    '/cards/heracross.png',
    '/cards/mewtwo.png',
    '/cards/umbreon-darkrai.png',
]

//shuffle array and pick first n items
function pickRandom(arr, n) {
    return [...arr]
        .sort(() => Math.random() - 0.5)
        .slice(0, n)
}

//each card's fixed position, rotation and animation timing
const CARD_POSITIONS = [
    { top: '8%',  left: '13%',  rotate: '-12deg', duration: '18s', delay: '0s'   },
    { top: '65%', left: '15%',  rotate: '8deg',   duration: '22s', delay: '-6s'  },
    { top: '35%', left: '25%', rotate: '5deg',   duration: '30s', delay: '-15s'  },
    { top: '10%', right: '16%', rotate: '14deg',  duration: '20s', delay: '-3s'  },
    { top: '43%', right: '13%', rotate: '-9deg',  duration: '25s', delay: '-10s' },
    { top: '70%', right: '24%', rotate: '-6deg',  duration: '24s', delay: '-8s'  }
]

function AuthLayout({ children }) {
    //pick 5 random cards once when the component first loads
    //useMemo means it won't re-pick on every render, only on first mount
    const cards = useMemo(() => pickRandom(ALL_CARDS, 6), [])

    return (
        <div className="auth-root">

            {/* Render 5 floating cards, each with a random image */}
            {cards.map((src, i) => {
                const pos = CARD_POSITIONS[i]
                return (
                    <div
                        key={i}
                        className="card-float"
                        style={{
                            top:             pos.top,
                            left:            pos.left,
                            right:           pos.right,
                            '--rotate':      pos.rotate,
                            animationDuration: pos.duration,
                            animationDelay:    pos.delay,
                        }}
                    >
                        <img src={src} alt="" />
                    </div>
                )
            })}

            {/* Blue glow orb sitting behind the form */}
            <div className="glow-orb" />

            {/* The actual form content passed in from Login/Register */}
            <div className="auth-panel">
                {children}
            </div>

            <style>{`
                .auth-root {
                    min-height: 100vh;
                    background: #0A0A14;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    overflow: hidden;
                    font-family: 'Exo 2', sans-serif;
                }

                .glow-orb {
                    position: absolute;
                    width: 500px;
                    height: 500px;
                    border-radius: 50%;
                    background: radial-gradient(circle, rgba(0,82,204,0.18) 0%, transparent 70%);
                    pointer-events: none;
                }

                .auth-panel {
                    position: relative;
                    z-index: 10;
                    background: #FFFFFF;
                    border-top: 3px solid #0052CC;
                    padding: 40px 36px;
                    width: 100%;
                    max-width: 400px;
                    clip-path: polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px));
                    box-shadow: 0 0 0 1px rgba(0,82,204,0.2), 0 8px 48px rgba(0,82,204,0.15);
                }

                .card-float {
                    position: absolute;
                    width: 150px;
                    height: 210px;
                    clip-path: polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px));
                    animation: drift linear infinite;
                    pointer-events: none;
                    transform: rotate(var(--rotate, 0deg));
                    opacity: 0.55;
                    transition: opacity 0.3s;
                }

                .card-float img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    display: block;
                }

                @keyframes drift {
                    0%   { transform: translateY(0px)   rotate(var(--rotate, 0deg)); opacity: 0.45; }
                    50%  { transform: translateY(-28px) rotate(var(--rotate, 0deg)); opacity: 0.7;  }
                    100% { transform: translateY(0px)   rotate(var(--rotate, 0deg)); opacity: 0.45; }
                }
            `}</style>
        </div>
    )
}

export default AuthLayout