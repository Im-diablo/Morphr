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

    if (!defsRef.current) return;

    // Security: use DOM API instead of innerHTML to prevent XSS via the id prop
    const SVG_NS = "http://www.w3.org/2000/svg";
    const defs = defsRef.current;

    // Clear previous content safely
    while (defs.firstChild) defs.removeChild(defs.firstChild);

    // Sanitize the id to only allow safe characters
    const safeId = String(id).replace(/[^a-zA-Z0-9_-]/g, "");

    const filter = document.createElementNS(SVG_NS, "filter");
    filter.setAttribute("id", safeId);
    filter.setAttribute("x", "0%");
    filter.setAttribute("y", "0%");
    filter.setAttribute("width", "100%");
    filter.setAttribute("height", "100%");

    // Gaussian blur
    const blur = document.createElementNS(SVG_NS, "feGaussianBlur");
    blur.setAttribute("in", "SourceGraphic");
    blur.setAttribute("stdDeviation", "0.8");
    blur.setAttribute("result", "blurred");
    filter.appendChild(blur);

    // Displacement map image
    const dispImage = document.createElementNS(SVG_NS, "feImage");
    dispImage.setAttribute("href", dispUrl);
    dispImage.setAttribute("x", "0");
    dispImage.setAttribute("y", "0");
    dispImage.setAttribute("width", String(width));
    dispImage.setAttribute("height", String(height));
    dispImage.setAttribute("result", "disp_map");
    filter.appendChild(dispImage);

    // Displacement map filter
    const dispMap = document.createElementNS(SVG_NS, "feDisplacementMap");
    dispMap.setAttribute("in", "blurred");
    dispMap.setAttribute("in2", "disp_map");
    dispMap.setAttribute("scale", "12");
    dispMap.setAttribute("xChannelSelector", "R");
    dispMap.setAttribute("yChannelSelector", "G");
    dispMap.setAttribute("result", "displaced");
    filter.appendChild(dispMap);

    // Specular map image
    const specImage = document.createElementNS(SVG_NS, "feImage");
    specImage.setAttribute("href", specUrl);
    specImage.setAttribute("x", "0");
    specImage.setAttribute("y", "0");
    specImage.setAttribute("width", String(width));
    specImage.setAttribute("height", String(height));
    specImage.setAttribute("result", "spec_map");
    filter.appendChild(specImage);

    // Screen blend (feBlend, not feComposite — "screen" is a blend mode, not a composite operator)
    const blend = document.createElementNS(SVG_NS, "feBlend");
    blend.setAttribute("in", "spec_map");
    blend.setAttribute("in2", "displaced");
    blend.setAttribute("mode", "screen");
    blend.setAttribute("result", "final");
    filter.appendChild(blend);

    defs.appendChild(filter);
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
