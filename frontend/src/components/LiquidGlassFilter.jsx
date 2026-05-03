import React, { useEffect, useRef, useCallback } from "react";

/**
 * LiquidGlassFilter Component
 * Generates SVG displacement and specular maps for liquid glass effect
 * Lightweight, canvas-based physics calculations
 */

const LiquidGlassFilter = ({
  id = "liquid-glass-default",
  width = 400,
  height = 100,
}) => {
  const svgRef = useRef(null);
  const defsRef = useRef(null);

  const generateDisplacementMap = useCallback((w, h) => {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");

    // Create image data with default displacement (128,128,0)
    const img = ctx.createImageData(w, h);
    const d = img.data;

    // Fill with neutral displacement values
    for (let i = 0; i < d.length; i += 4) {
      d[i] = 128; // R - X displacement
      d[i + 1] = 128; // G - Y displacement
      d[i + 2] = 0; // B - unused
      d[i + 3] = 255; // Alpha
    }

    // Add subtle wave pattern for visual interest
    const centerX = w / 2;
    const centerY = h / 2;
    const maxDist = Math.hypot(w / 2, h / 2);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const dist = Math.hypot(x - centerX, y - centerY);
        const angle = Math.atan2(y - centerY, x - centerX);

        // Subtle circular displacement pattern
        const displacement = Math.sin(dist / 30 - Date.now() / 5000) * 8;
        const offset = Math.cos(angle) * displacement;

        const idx = (y * w + x) * 4;
        d[idx] = Math.max(0, Math.min(255, 128 + offset));
        d[idx + 1] = Math.max(
          0,
          Math.min(255, 128 + Math.sin(angle) * displacement),
        );
      }
    }

    ctx.putImageData(img, 0, 0);
    return canvas.toDataURL();
  }, []);

  const generateSpecularMap = useCallback((w, h) => {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");

    const img = ctx.createImageData(w, h);
    const d = img.data;
    d.fill(0);

    const centerX = w / 2;
    const centerY = h / 2;
    const radius = Math.min(w, h) / 2.5;

    // Create radial gradient specular highlight
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const dx = x - centerX;
        const dy = y - centerY;
        const dist = Math.hypot(dx, dy);

        if (dist < radius) {
          const intensity = (1 - dist / radius) * (1 - dist / radius);
          const alpha = Math.floor(intensity * 200);

          const idx = (y * w + x) * 4;
          d[idx] = 255; // R
          d[idx + 1] = 255; // G
          d[idx + 2] = 255; // B
          d[idx + 3] = alpha; // Alpha - bright in center, fades out
        }
      }
    }

    ctx.putImageData(img, 0, 0);
    return canvas.toDataURL();
  }, []);

  useEffect(() => {
    const dispUrl = generateDisplacementMap(width, height);
    const specUrl = generateSpecularMap(width, height);

    if (defsRef.current) {
      defsRef.current.innerHTML = `
        <filter id="${id}" x="0%" y="0%" width="100%" height="100%">
          <!-- Gaussian blur for smoothness -->
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.8" result="blurred" />
          
          <!-- Load displacement map -->
          <feImage href="${dispUrl}" x="0" y="0" width="${width}" height="${height}" result="disp_map" />
          
          <!-- Apply displacement for refraction effect -->
          <feDisplacementMap
            in="blurred"
            in2="disp_map"
            scale="12"
            xChannelSelector="R"
            yChannelSelector="G"
            result="displaced"
          />
          
          <!-- Load specular map for highlights -->
          <feImage href="${specUrl}" x="0" y="0" width="${width}" height="${height}" result="spec_map" />
          
          <!-- Blend specular highlights with displaced image -->
          <feComposite in="spec_map" in2="displaced" operator="screen" result="final" />
        </filter>
      `;
    }
  }, [id, width, height, generateDisplacementMap, generateSpecularMap]);

  return (
    <svg
      ref={svgRef}
      xmlns="http://www.w3.org/2000/svg"
      width="0"
      height="0"
      style={{
        position: "absolute",
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      <defs ref={defsRef} />
    </svg>
  );
};

export default LiquidGlassFilter;
