import React from 'react'

/**
 * GrainOverlay — film grain texture overlay.
 * Adds cinematic texture to the entire page. Pure CSS, zero JS cost.
 */
export default function GrainOverlay() {
  return (
    <div
      className="grain-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9000,
        pointerEvents: 'none',
        opacity: 0.035,
        mixBlendMode: 'overlay',
      }}
    />
  )
}
