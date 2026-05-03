import React, { forwardRef } from "react";

/**
 * LiquidGlass Component
 * Wraps elements with liquid glass morphism effect
 * Uses SVG displacement maps for physics-based refraction
 */

const LiquidGlass = forwardRef(
  (
    {
      children,
      className = "",
      intensity = "medium",
      rounded = true,
      shadow = true,
      blur = 40,
      ...props
    },
    ref,
  ) => {
    // Intensity presets: light, medium, strong
    const intensityMap = {
      light: {
        backdropBlur: blur * 0.6,
        saturate: 1.5,
        brightness: 1.05,
        borderOpacity: 0.06,
      },
      medium: {
        backdropBlur: blur,
        saturate: 1.8,
        brightness: 1.1,
        borderOpacity: 0.08,
      },
      strong: {
        backdropBlur: blur * 1.3,
        saturate: 2,
        brightness: 1.15,
        borderOpacity: 0.12,
      },
    };

    const config = intensityMap[intensity] || intensityMap.medium;

    const glassStyle = {
      background: `linear-gradient(
        135deg,
        rgba(255, 255, 255, ${config.borderOpacity * 2}) 0%,
        rgba(255, 255, 255, ${config.borderOpacity * 0.5}) 50%,
        rgba(255, 215, 0, ${config.borderOpacity * 0.75}) 100%
      )`,
      backdropFilter: `blur(${config.backdropBlur}px) saturate(${config.saturate}) brightness(${config.brightness})`,
      WebkitBackdropFilter: `blur(${config.backdropBlur}px) saturate(${config.saturate}) brightness(${config.brightness})`,
      border: `1px solid rgba(255, 255, 255, ${config.borderOpacity})`,
      boxShadow: shadow
        ? `
          0 8px 32px rgba(0, 0, 0, 0.1),
          inset 0 1px 0 rgba(255, 255, 255, 0.2),
          inset 0 -1px 0 rgba(0, 0, 0, 0.05)
        `
        : "none",
      borderRadius: rounded ? "24px" : "8px",
      isolation: "isolate",
    };

    return (
      <div
        ref={ref}
        className={`liquid-glass ${className}`}
        style={glassStyle}
        {...props}
      >
        {children}
      </div>
    );
  },
);

LiquidGlass.displayName = "LiquidGlass";

export default LiquidGlass;
