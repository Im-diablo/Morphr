import React, { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

/**
 * CustomCursor — branded cursor that morphs on interactive elements.
 * Small dot + trailing ring. Ring expands on hover over links/buttons.
 * Hidden on mobile/touch.
 */
export default function CustomCursor() {
  const cursorX = useMotionValue(-100)
  const cursorY = useMotionValue(-100)
  const springX = useSpring(cursorX, { damping: 25, stiffness: 350, mass: 0.5 })
  const springY = useSpring(cursorY, { damping: 25, stiffness: 350, mass: 0.5 })
  const [hovered, setHovered] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [isTouch, setIsTouch] = useState(false)

  useEffect(() => {
    // Detect touch device
    if ('ontouchstart' in window) {
      setIsTouch(true)
      return
    }

    const moveCursor = (e) => {
      cursorX.set(e.clientX)
      cursorY.set(e.clientY)
    }

    const handleMouseEnter = (e) => {
      const target = e.target.closest('a, button, [data-cursor-hover], input, textarea, .cursor-hover')
      if (target) setHovered(true)
    }

    const handleMouseLeave = (e) => {
      const target = e.target.closest('a, button, [data-cursor-hover], input, textarea, .cursor-hover')
      if (target) setHovered(false)
    }

    const handleHide = () => setHidden(true)
    const handleShow = () => setHidden(false)

    window.addEventListener('mousemove', moveCursor)
    document.addEventListener('mouseover', handleMouseEnter)
    document.addEventListener('mouseout', handleMouseLeave)
    document.addEventListener('mouseleave', handleHide)
    document.addEventListener('mouseenter', handleShow)

    return () => {
      window.removeEventListener('mousemove', moveCursor)
      document.removeEventListener('mouseover', handleMouseEnter)
      document.removeEventListener('mouseout', handleMouseLeave)
      document.removeEventListener('mouseleave', handleHide)
      document.removeEventListener('mouseenter', handleShow)
    }
  }, [cursorX, cursorY])

  if (isTouch) return null

  return (
    <>
      {/* Dot — instant follow */}
      <motion.div
        className="cursor-dot"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: '#FFD700',
          pointerEvents: 'none',
          zIndex: 9999,
          x: cursorX,
          y: cursorY,
          translateX: '-50%',
          translateY: '-50%',
          opacity: hidden ? 0 : 1,
          scale: hovered ? 0 : 1,
        }}
      />

      {/* Ring — spring-delayed follow, morphs on hover */}
      <motion.div
        className="cursor-ring"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: hovered ? 48 : 32,
          height: hovered ? 48 : 32,
          borderRadius: '50%',
          border: `1px solid ${hovered ? 'rgba(255,215,0,0.6)' : 'rgba(255,215,0,0.25)'}`,
          background: hovered ? 'rgba(255,215,0,0.06)' : 'transparent',
          pointerEvents: 'none',
          zIndex: 9998,
          x: springX,
          y: springY,
          translateX: '-50%',
          translateY: '-50%',
          opacity: hidden ? 0 : 1,
          transition: 'width 0.3s, height 0.3s, border-color 0.3s, background 0.3s',
        }}
      />
    </>
  )
}
