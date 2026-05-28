import { useState, useEffect, useCallback, useRef } from 'react'
import { ArrowLeft, ArrowRight, Play, Pause } from 'lucide-react'

// const CHARACTERS = [
//   {
//     src: 'https://fifth-gentle-45902158.figma.site/_components/v2/4de492f6d9cf8244ad5293233e5c6f52407d42fc/1.02464a56.png',
//     bg: '#F4845F',
//     name: 'BLAZE',
//     label: 'BLAZE FIGURINE',
//     sub: 'A fiery spirit forged from lava and light. Blaze comes battle-ready with a hand-finished gloss coat and ember-etched base.',
//   },
//   {
//     src: 'https://fifth-gentle-45902158.figma.site/_components/v2/4de492f6d9cf8244ad5293233e5c6f52407d42fc/2.b977faab.png',
//     bg: '#6BBF7A',
//     name: 'GROVE',
//     label: 'GROVE FIGURINE',
//     sub: "Born of moss and midnight. Grove's forest-green matte finish hides secrets only the wild woods know. A collector's rarest gem.",
//   },
//   {
//     src: 'https://fifth-gentle-45902158.figma.site/_components/v2/4de492f6d9cf8244ad5293233e5c6f52407d42fc/3.4df853b4.png',
//     bg: '#E882B4',
//     name: 'LUMINA',
//     label: 'LUMINA FIGURINE',
//     sub: 'Soft power in every curve. Lumina radiates a pearlescent aura with hand-painted detail work that catches every angle of light.',
//   },
//   {
//     src: 'https://fifth-gentle-45902158.figma.site/_components/v2/4de492f6d9cf8244ad5293233e5c6f52407d42fc/4.4457fbce.png',
//     bg: '#6EB5FF',
//     name: 'DRIFT',
//     label: 'DRIFT FIGURINE',
//     sub: "Cool as the open sky, sharp as a tailwind. Drift's arctic blue finish and aerodynamic sculpt make it the crown of any display.",
//   },
// ]
const CHARACTERS = [
  {
    src: '/char1.png',
    bg: '#59a4ba',
    name: 'BLAZE',
    label: 'BLAZE FIGURINE',
    sub: 'A fiery spirit forged from lava and light. Blaze comes battle-ready with a hand-finished gloss coat and ember-etched base.',
  },
  {
    src: '/char2.png',
    bg: '#c3a7cd',
    name: 'GROVE',
    label: 'GROVE FIGURINE',
    sub: "Born of moss and midnight. Grove's forest-green matte finish hides secrets only the wild woods know. A collector's rarest gem.",
  },
  {
    src: '/char3.png',
    bg: '#f498c4',
    name: 'LUMINA',
    label: 'LUMINA FIGURINE',
    sub: 'Soft power in every curve. Lumina radiates a pearlescent aura with hand-painted detail work that catches every angle of light.',
  },
  {
    src: '/char4.png',
    bg: '#3165c6',
    name: 'DRIFT',
    label: 'DRIFT FIGURINE',
    sub: "Cool as the open sky, sharp as a tailwind. Drift's arctic blue finish and aerodynamic sculpt make it the crown of any display.",
  },
]

const GRAIN_SVG = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.08'/></svg>`
)}`

/* ── BigTextWord: clips in from below on each character change ── */
function BigTextWord({ text }) {
  const [displayed, setDisplayed] = useState(text)
  const [key, setKey] = useState(0)
  useEffect(() => {
    setKey(k => k + 1)
    const t = setTimeout(() => setDisplayed(text), 60)
    return () => clearTimeout(t)
  }, [text])
  return (
    <div style={{ overflow: 'hidden', display: 'inline-block', lineHeight: 1 }}>
      <span
        key={key}
        style={{
          display: 'inline-block',
          fontFamily: "'Anton', sans-serif",
          fontSize: 'clamp(90px, 28vw, 380px)',
          fontWeight: 900,
          color: 'white',
          lineHeight: 1,
          textTransform: 'uppercase',
          letterSpacing: '-0.02em',
          whiteSpace: 'nowrap',
          animation: 'slideUp 0.55s cubic-bezier(0.22,1,0.36,1) forwards',
        }}
      >
        {displayed}
      </span>
    </div>
  )
}

/* ── AnimatedText: fade + slide on character change ── */
function AnimatedText({ text, style, className }) {
  const [displayed, setDisplayed] = useState(text)
  const [key, setKey] = useState(0)
  useEffect(() => {
    setKey(k => k + 1)
    const t = setTimeout(() => setDisplayed(text), 55)
    return () => clearTimeout(t)
  }, [text])
  return (
    <span
      key={key}
      className={className}
      style={{ ...style, display: 'block', animation: 'fadeSlideIn 0.42s cubic-bezier(0.22,1,0.36,1) forwards' }}
    >
      {displayed}
    </span>
  )
}

/* ────────────────────────────────────────────────────
   CAROUSEL POSITION LOGIC
   ─────────────────────────────────────────────────────
   4 roles:  center | left | right | offscreen

   "offscreen" is the 4th character that is NOT visible.
   Its horizontal start position depends on the last
   navigation direction so it always enters from the
   correct edge and exits toward the correct edge:

     going NEXT  →  entering character comes from the RIGHT  (right edge ~90%)
                     exiting  character leaves  to  the LEFT  (~10%)
     going PREV  →  entering character comes from the LEFT   (~10%)
                     exiting  character leaves  to  the RIGHT (~90%)

   opacity:0 means we never see it "sitting" out there —
   only the smooth fade-in / fade-out is perceived.
──────────────────────────────────────────────────── */
export default function App() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640)
  const [autoPlay, setAutoPlay] = useState(false)
  // Track direction so we know which edge the offscreen char should use
  const [dir, setDir] = useState('next')
  const intervalRef = useRef(null)

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    CHARACTERS.forEach(c => { const i = new Image(); i.src = c.src })
  }, [])

  const navigate = useCallback((direction) => {
    if (isAnimating) return
    setDir(direction)
    setIsAnimating(true)
    setActiveIndex(prev => direction === 'next' ? (prev + 1) % 4 : (prev + 3) % 4)
    setTimeout(() => setIsAnimating(false), 700)
  }, [isAnimating])

  useEffect(() => {
    if (autoPlay) {
      intervalRef.current = setInterval(() => navigate('next'), 3000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [autoPlay, navigate])

  // Role assignments
  const center    = activeIndex
  const leftIdx   = (activeIndex + 3) % 4
  const rightIdx  = (activeIndex + 1) % 4
  const offscreen = (activeIndex + 2) % 4

  const getRole = (index) => {
    if (index === center)    return 'center'
    if (index === leftIdx)   return 'left'
    if (index === rightIdx)  return 'right'
    return 'offscreen'
  }

  // Offscreen X depends on direction:
  //   next → offscreen character lives near the RIGHT edge
  //          (it was the right, will become left — enters from right on next turn)
  //   prev → offscreen character lives near the LEFT edge
  const offLeft = dir === 'next' ? '88%' : '12%'

  const TRANSITION = 'transform 680ms cubic-bezier(0.4,0,0.2,1), filter 680ms cubic-bezier(0.4,0,0.2,1), opacity 680ms cubic-bezier(0.4,0,0.2,1), left 680ms cubic-bezier(0.4,0,0.2,1), height 680ms cubic-bezier(0.4,0,0.2,1), bottom 680ms cubic-bezier(0.4,0,0.2,1)'

  const base = { position: 'absolute', aspectRatio: '0.6 / 1', willChange: 'transform,filter,opacity,left', transition: TRANSITION }

  const getRoleStyles = (role) => {
    const m = isMobile
    switch (role) {
      case 'center':
        return {
          ...base,
          left: '50%',
          transform: `translateX(-50%) scale(${m ? 1.25 : 1.68})`,
          height: m ? '60%' : '92%',
          bottom: m ? '22%' : 0,
          filter: 'blur(0px)',
          opacity: 1,
          zIndex: 20,
        }
      case 'left':
        return {
          ...base,
          left: m ? '18%' : '28%',
          transform: 'translateX(-50%) scale(1)',
          height: m ? '18%' : '30%',
          bottom: m ? '32%' : '14%',
          filter: 'blur(2px)',
          opacity: 0.82,
          zIndex: 10,
        }
      case 'right':
        return {
          ...base,
          left: m ? '82%' : '72%',
          transform: 'translateX(-50%) scale(1)',
          height: m ? '18%' : '30%',
          bottom: m ? '32%' : '14%',
          filter: 'blur(2px)',
          opacity: 0.82,
          zIndex: 10,
        }
      case 'offscreen':
        // Invisible — only the fade + edge-drift matters
        return {
          ...base,
          left: offLeft,
          transform: 'translateX(-50%) scale(0.82)',
          height: m ? '18%' : '30%',
          bottom: m ? '32%' : '14%',
          filter: 'blur(5px)',
          opacity: 0,          // ← KEY: never visually present
          zIndex: 1,
          pointerEvents: 'none',
        }
    }
  }

  const char = CHARACTERS[activeIndex]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Anton&display=swap');

        @keyframes slideUp {
          from { transform: translateY(115%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes fadeSlideIn {
          from { transform: translateY(12px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }

        .auto-pill {
          display: flex; align-items: center; gap: 0.45rem;
          cursor: pointer; user-select: none;
          background: rgba(255,255,255,0.14);
          border: 1.5px solid rgba(255,255,255,0.42);
          border-radius: 999px;
          padding: 0.32rem 0.8rem 0.32rem 0.55rem;
          transition: background 200ms;
          backdrop-filter: blur(8px);
        }
        .auto-pill:hover { background: rgba(255,255,255,0.24); }

        .pill-track {
          width: 1.75rem; height: 0.95rem;
          border-radius: 999px;
          background: rgba(255,255,255,0.22);
          position: relative;
          transition: background 320ms;
        }
        .pill-track.on { background: rgba(255,255,255,0.88); }
        .pill-track::after {
          content: '';
          position: absolute;
          top: 2.5px; left: 2.5px;
          width: 0.55rem; height: 0.55rem;
          border-radius: 50%;
          background: white;
          transition: transform 320ms cubic-bezier(0.4,0,0.2,1), background 320ms;
        }
        .pill-track.on::after {
          transform: translateX(0.8rem);
          background: #333;
        }

        .nav-btn {
          width: 3rem; height: 3rem;
          border-radius: 9999px;
          background: transparent;
          border: 2px solid rgba(255,255,255,0.8);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: transform 150ms, background-color 180ms, border-color 180ms;
        }
        .nav-btn:hover {
          transform: scale(1.07);
          background-color: rgba(255,255,255,0.14);
          border-color: white;
        }
        .nav-btn:active { transform: scale(0.96); }

        @media (min-width: 640px) {
          .nav-btn        { width: 3.75rem; height: 3.75rem; }
          .bottom-info    { bottom: 4.5rem !important; left: 5.5rem !important; }
          .bottom-link    { bottom: 4.5rem !important; right: 5.5rem  !important; }
          .brand-label    { left: 5.5rem    !important; }
          .auto-top       { right: 5.5rem   !important; }
        
      `}</style>

      <div
        style={{
          backgroundColor: char.bg,
          transition: 'background-color 680ms cubic-bezier(0.4,0,0.2,1)',
          fontFamily: "'Inter', sans-serif",
          position: 'relative',
          width: '100%',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>

          {/* Grain overlay */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 50,
            opacity: 0.38,
            backgroundImage: `url("${GRAIN_SVG}")`,
            backgroundSize: '200px 200px', backgroundRepeat: 'repeat',
          }} />

          {/* Giant ghost name — animates on character change */}
          <div style={{
            position: 'absolute', inset: '17% 0 auto 0',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none', userSelect: 'none', zIndex: 2,
          }}>
            <BigTextWord text={char.name} />
          </div>

          {/* Brand — top left */}
          <div className="brand-label" style={{
            position: 'absolute', top: '1.4rem', left: '1rem', zIndex: 60,
            fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase',
            color: 'white', opacity: 0.88, letterSpacing: '0.2em',
          }}>
            <img className='logo' src="/prasanth.png" alt="" />
          </div>

          {/* Auto-swap toggle — top right */}
          <div className="auto-top" style={{ position: 'absolute', top: '1.2rem', right: '1rem', zIndex: 60 }}>
            <button className="auto-pill" onClick={() => setAutoPlay(v => !v)}>
              {autoPlay
                ? <Pause size={12} color="white" strokeWidth={2.6} />
                : <Play  size={12} color="white" strokeWidth={2.6} />}
              <div className={`pill-track ${autoPlay ? 'on' : ''}`} />
              <span style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.13em', color: 'white', opacity: 0.88 }}>
                AUTO
              </span>
            </button>
          </div>

          {/* ── Carousel characters ── */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 3 }}>
            {CHARACTERS.map((c, index) => {
              const role   = getRole(index)
              const styles = getRoleStyles(role)
              return (
                <div key={index} style={styles}>
                  <img
                    src={c.src}
                    alt={`Character ${index + 1}`}
                    draggable={false}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'bottom center' }}
                  />
                </div>
              )
            })}
          </div>

          {/* Bottom-left: name + description + nav */}
          <div className="bottom-info" style={{ position: 'absolute', bottom: '1.4rem', left: '1rem', zIndex: 60, maxWidth: '340px' }}>

            <AnimatedText
              text={char.label}
              style={{
                fontWeight: 800, textTransform: 'uppercase',
                letterSpacing: '0.04em', fontSize: '0.95rem',
                color: 'white', opacity: 0.96, marginBottom: '0.4rem',
              }}
            />

            <AnimatedText
              text={char.sub}
              className="hidden sm:block"
              style={{
                fontSize: '0.85rem', color: 'white', opacity: 0.82,
                lineHeight: 1.65, marginBottom: '1.15rem',
              }}
            />

            {/* Nav row: arrows + dots */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginTop: '0.7rem' }}>
              <button className="nav-btn" onClick={() => navigate('prev')}>
                <ArrowLeft size={20} strokeWidth={2.3} color="white" />
              </button>
              <button className="nav-btn" onClick={() => navigate('next')}>
                <ArrowRight size={20} strokeWidth={2.3} color="white" />
              </button>

              {/* Pill-dot progress */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.38rem', marginLeft: '0.2rem' }}>
                {CHARACTERS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (isAnimating || i === activeIndex) return
                      const d = i > activeIndex ? 'next' : 'prev'
                      setDir(d)
                      setIsAnimating(true)
                      setActiveIndex(i)
                      setTimeout(() => setIsAnimating(false), 700)
                    }}
                    style={{
                      width:   i === activeIndex ? '1.35rem' : '0.42rem',
                      height:  '0.42rem',
                      borderRadius: '999px',
                      background: 'white',
                      opacity: i === activeIndex ? 1 : 0.38,
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      transition: 'width 380ms cubic-bezier(0.4,0,0.2,1), opacity 380ms',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Bottom-right: DISCOVER IT */}
          <a
            href="#"
            className="bottom-link"
            style={{
              position: 'absolute',
              bottom: '1.4rem',
              right: '1rem',
              zIndex: 60,
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontFamily: "'Anton', sans-serif",
              fontSize: 'clamp(18px, 3.8vw, 52px)',
              fontWeight: 400,
              color: 'white',
              opacity: 0.93,
              letterSpacing: '-0.02em',
              lineHeight: 1,
              textTransform: 'uppercase',
              textDecoration: 'none',
              transition: 'opacity 200ms, gap 200ms',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.gap = '0.7rem' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '0.93'; e.currentTarget.style.gap = '0.45rem' }}
          >
            <a href="https://www.linkedin.com/in/prasad-r-s-4256a7274/" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>
              DEVELOPER
            </a>
            <ArrowRight
              size={isMobile ? 17 : 28}
              strokeWidth={2.3}
              color="white"
            />
          </a>

        </div>
      </div>
    </>
  )
}