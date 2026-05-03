import React, { useRef, useLayoutEffect, useState } from 'react'
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useMotionValue,
  useVelocity,
  useAnimationFrame,
} from 'framer-motion'

/**
 * ScrollVelocity — velocity-reactive infinite scroll text.
 * Text speeds up when scrolling fast, reverses when scrolling up.
 * Inspired by MAHESHPPAI/Portfolio-website.
 */
function useElementWidth(ref) {
  const [width, setWidth] = useState(0)
  useLayoutEffect(() => {
    const update = () => { if (ref.current) setWidth(ref.current.offsetWidth) }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [ref])
  return width
}

function VelocityRow({ children, baseVelocity = 100, className = '' }) {
  const baseX = useMotionValue(0)
  const { scrollY } = useScroll()
  const scrollVelocity = useVelocity(scrollY)
  const smoothVelocity = useSpring(scrollVelocity, { damping: 50, stiffness: 400 })
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 5], { clamp: false })

  const copyRef = useRef(null)
  const copyWidth = useElementWidth(copyRef)

  const wrap = (min, max, v) => {
    const range = max - min
    return ((((v - min) % range) + range) % range) + min
  }

  const x = useTransform(baseX, (v) => {
    if (copyWidth === 0) return '0px'
    return `${wrap(-copyWidth, 0, v)}px`
  })

  const directionFactor = useRef(1)
  useAnimationFrame((t, delta) => {
    let moveBy = directionFactor.current * baseVelocity * (delta / 1000)
    if (velocityFactor.get() < 0) directionFactor.current = -1
    else if (velocityFactor.get() > 0) directionFactor.current = 1
    moveBy += directionFactor.current * moveBy * velocityFactor.get()
    baseX.set(baseX.get() + moveBy)
  })

  return (
    <div className="overflow-hidden whitespace-nowrap">
      <motion.div className="inline-flex" style={{ x }}>
        {[...Array(6)].map((_, i) => (
          <span key={i} ref={i === 0 ? copyRef : null} className={className}>
            {children}&nbsp;
          </span>
        ))}
      </motion.div>
    </div>
  )
}

export default function ScrollVelocity({ texts = [], velocity = 80, className = '' }) {
  return (
    <section className="py-4">
      {texts.map((text, i) => (
        <VelocityRow
          key={i}
          baseVelocity={i % 2 !== 0 ? -velocity : velocity}
          className={className}
        >
          {text}
        </VelocityRow>
      ))}
    </section>
  )
}
