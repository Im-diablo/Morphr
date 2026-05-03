import { useEffect } from 'react'
import Lenis from 'lenis'

/**
 * SmoothScroll — Lenis smooth scroll wrapper.
 * Produces that buttery, momentum-based scroll feel
 * found on every Awwwards-winning site.
 */
export default function SmoothScroll({ children }) {
  useEffect(() => {
    const lenis = new Lenis({
      autoRaf: true,
      lerp: 0.08,
      smoothWheel: true,
      wheelMultiplier: 0.8,
    })

    // Expose lenis instance globally for other components
    window.__lenis = lenis

    return () => {
      lenis.destroy()
      delete window.__lenis
    }
  }, [])

  return children
}
