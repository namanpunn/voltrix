// ─── mapHelpers.js ────────────────────────────────────────────────────────────
// Pure helper functions for Leaflet map rendering

/**
 * Creates a glowing pulsing Leaflet DivIcon
 * @param {string} color  - CSS color string
 * @param {object} L      - Leaflet instance
 */
export function makePulseIcon(color, L) {
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;width:22px;height:22px">
        <div style="
          position:absolute;inset:0;border-radius:50%;
          background:${color};opacity:0.2;
          animation:navPulse 1.8s ease-out infinite;">
        </div>
        <div style="
          position:absolute;top:4px;left:4px;
          width:14px;height:14px;border-radius:50%;
          background:${color};border:2.5px solid rgba(255,255,255,0.9);
          box-shadow:0 0 12px ${color};">
        </div>
      </div>
      <style>
        @keyframes navPulse {
          0%  { transform:scale(1);   opacity:0.2 }
          100%{ transform:scale(3.2); opacity:0   }
        }
      </style>`,
    iconAnchor: [11, 11],
  });
}

/**
 * Draws a glowing + solid polyline pair on the map
 * Returns { glowLine, mainLine } for later cleanup
 */
export function drawRouteLine(coordinates, L, map, color = "#22d3ee") {
  const glowLine = L.polyline(coordinates, {
    color,
    weight: 14,
    opacity: 0.1,
    lineJoin: "round",
  }).addTo(map);

  const mainLine = L.polyline(coordinates, {
    color,
    weight: 4,
    opacity: 0.9,
    lineJoin: "round",
  }).addTo(map);

  return { glowLine, mainLine };
}

/**
 * Remove a set of Leaflet layers from the map safely
 */
export function clearLayers(map, layers = []) {
  layers.forEach((l) => {
    if (l && map.hasLayer(l)) map.removeLayer(l);
  });
}