// ─── components/MapView.jsx ───────────────────────────────────────────────────
"use client";

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { Box, Typography, CircularProgress } from "@mui/material";

const C = {
  navy: "#0a0f1e", navyCard: "#111827", navyBorder: "#1e2d45",
  cyan: "#22d3ee", rose: "#f43f5e",
  textPrimary: "#f1f5f9", textMuted: "#64748b",
};
const fonts = { body: "'DM Sans', sans-serif", display: "'Space Grotesk', sans-serif" };

// ── Leaflet CSS injected once ─────────────────────────────────────────────────
function ensureLeafletCSS() {
  if (typeof window === "undefined") return;
  if (document.getElementById("leaflet-css")) return;
  const link = document.createElement("link");
  link.id = "leaflet-css"; link.rel = "stylesheet";
  link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
  document.head.appendChild(link);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function makePulseIcon(L, color) {
  return L.divIcon({
    className: "",
    html: `<div style="position:relative;width:22px;height:22px">
      <div style="position:absolute;inset:0;border-radius:50%;background:${color};opacity:.2;animation:navPulse 1.8s ease-out infinite"></div>
      <div style="position:absolute;top:4px;left:4px;width:14px;height:14px;border-radius:50%;background:${color};border:2.5px solid rgba(255,255,255,.9);box-shadow:0 0 10px ${color}"></div>
    </div>
    <style>@keyframes navPulse{0%{transform:scale(1);opacity:.2}100%{transform:scale(3);opacity:0}}</style>`,
    iconAnchor: [11, 11],
  });
}

function drawRoute(map, L, coordinates, fromCoords, toCoords, color, layersRef) {
  // clear old layers
  layersRef.current.forEach(l => { try { map.removeLayer(l); } catch(_) {} });
  layersRef.current = [];

  const glow = L.polyline(coordinates, { color, weight: 14, opacity: 0.1, lineJoin: "round" }).addTo(map);
  const line = L.polyline(coordinates, { color, weight: 4,  opacity: 0.9, lineJoin: "round" }).addTo(map);
  const mA   = L.marker(fromCoords, { icon: makePulseIcon(L, color) }).addTo(map);
  const mB   = L.marker(toCoords,   { icon: makePulseIcon(L, C.rose) }).addTo(map);

  layersRef.current = [glow, line, mA, mB];

  // invalidateSize + fitBounds — crucial for maps in conditionally rendered containers
  setTimeout(() => {
    map.invalidateSize({ animate: false });
    map.fitBounds(line.getBounds(), { padding: [60, 60] });
  }, 100);
}

// ── SingleMap ─────────────────────────────────────────────────────────────────
const SingleMap = forwardRef(function SingleMap({ label, labelColor = C.cyan, badge }, ref) {
  const divRef      = useRef(null);
  const mapRef      = useRef(null);   // L.Map instance
  const LRef        = useRef(null);   // Leaflet lib
  const layersRef   = useRef([]);
  const pendingRef  = useRef(null);   // draw call that arrived before map ready
  const initedRef   = useRef(false);  // guard against double-init (StrictMode)
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (initedRef.current) return;   // ← StrictMode guard
    if (!divRef.current)  return;
    initedRef.current = true;

    ensureLeafletCSS();

    let cancelled = false;
    import("leaflet").then(mod => {
      if (cancelled) return;
      const L = mod.default;

      // Fix default icons
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      // Guard: if div already has a leaflet instance (StrictMode remount), bail
      if (divRef.current._leaflet_id) return;

      const map = L.map(divRef.current, {
        center: [28.6139, 77.209], zoom: 12,
        zoomControl: false, attributionControl: true,
      });

      L.control.zoom({ position: "bottomright" }).addTo(map);
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: "© OSM © CARTO", subdomains: "abcd", maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;
      LRef.current   = L;
      setReady(true);

      // Flush any pending draw
      if (pendingRef.current) {
        const p = pendingRef.current;
        pendingRef.current = null;
        drawRoute(map, L, p.coordinates, p.fromCoords, p.toCoords, p.color, layersRef);
      }
    });

    return () => {
      cancelled = true;
      // Don't destroy on StrictMode cleanup — only on real unmount
      // We use initedRef so the second mount doesn't re-init
    };
  }, []);

  useImperativeHandle(ref, () => ({
    draw({ coordinates, fromCoords, toCoords, color = C.cyan }) {
      if (mapRef.current && LRef.current) {
        drawRoute(mapRef.current, LRef.current, coordinates, fromCoords, toCoords, color, layersRef);
      } else {
        pendingRef.current = { coordinates, fromCoords, toCoords, color };
      }
    },
    clear() {
      pendingRef.current = null;
      if (!mapRef.current) return;
      layersRef.current.forEach(l => { try { mapRef.current.removeLayer(l); } catch(_) {} });
      layersRef.current = [];
    },
    invalidate() {
      mapRef.current?.invalidateSize({ animate: false });
    },
  }));

  return (
    <Box sx={{ flex: 1, position: "relative", overflow: "hidden", height: "100%" }}>
      <div ref={divRef} style={{ position: "absolute", inset: 0 }} />

      {!ready && (
        <Box sx={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          gap: 1.5, bgcolor: C.navy,
        }}>
          <CircularProgress size={22} thickness={4} sx={{ color: C.cyan }} />
          <Typography sx={{ fontSize: "0.68rem", color: C.textMuted, fontFamily: fonts.body }}>
            Loading map…
          </Typography>
        </Box>
      )}

      {label && ready && (
        <Box sx={{
          position: "absolute", top: 14, left: 14, zIndex: 5,
          bgcolor: "rgba(10,15,30,0.88)", backdropFilter: "blur(12px)",
          border: `1px solid ${labelColor}30`, borderRadius: "10px",
          px: 1.5, py: 0.6, display: "flex", alignItems: "center", gap: 0.8,
          boxShadow: `0 4px 20px rgba(0,0,0,0.3), 0 0 12px ${labelColor}15`,
        }}>
          <Box sx={{
            width: 7, height: 7, borderRadius: "50%", bgcolor: labelColor,
            boxShadow: `0 0 8px ${labelColor}`,
            animation: "pulse 2s ease-in-out infinite",
            "@keyframes pulse": {
              "0%, 100%": { opacity: 1, transform: "scale(1)" },
              "50%": { opacity: 0.6, transform: "scale(0.85)" },
            },
          }} />
          <Typography sx={{ fontSize: "0.7rem", color: labelColor, fontWeight: 600, fontFamily: fonts.body, letterSpacing: "0.02em" }}>
            {label}
          </Typography>
        </Box>
      )}

      {badge && ready && (
        <Box sx={{
          position: "absolute", top: 14, right: 14, zIndex: 5,
          bgcolor: "rgba(10,15,30,0.78)", backdropFilter: "blur(10px)",
          border: `1px solid ${C.navyBorder}`, borderRadius: "8px",
          px: 1.2, py: 0.4,
        }}>
          <Typography sx={{ fontSize: "0.6rem", color: C.textMuted, fontFamily: fonts.body, letterSpacing: "0.02em" }}>
            {badge}
          </Typography>
        </Box>
      )}
    </Box>
  );
});

// ── Main MapView ──────────────────────────────────────────────────────────────
const MapView = forwardRef(function MapView({ showSplit, loading }, ref) {
  const primaryRef   = useRef(null);
  const alternateRef = useRef(null);
  const prevSplitRef = useRef(false);

  // When split view toggles, invalidate both maps so Leaflet recalculates tile coverage
  useEffect(() => {
    const delays = [50, 250, 500];
    delays.forEach(ms => {
      setTimeout(() => {
        primaryRef.current?.invalidate();
        if (showSplit) alternateRef.current?.invalidate();
      }, ms);
    });
    prevSplitRef.current = showSplit;
  }, [showSplit]);

  useImperativeHandle(ref, () => ({
    drawPrimary(d)   { primaryRef.current?.draw({ ...d, color: C.cyan }); },
    drawAlternate(d) { alternateRef.current?.draw({ ...d, color: "#a78bfa" }); },
    clearPrimary()   { primaryRef.current?.clear(); },
    clearAlternate() { alternateRef.current?.clear(); },
    clearAll()       { primaryRef.current?.clear(); alternateRef.current?.clear(); },
  }));

  return (
    <Box sx={{ flex: 1, display: "flex", height: "100vh", overflow: "hidden", position: "relative" }}>

      <SingleMap ref={primaryRef} label="Optimal Route" labelColor={C.cyan} badge="OpenStreetMap · OSRM" />

      {/* VS divider — only visible in split mode */}
      {showSplit && (
        <Box sx={{
          width: 3, flexShrink: 0,
          background: `linear-gradient(180deg, ${C.cyan}40, ${C.navyBorder}, #a78bfa40)`,
          position: "relative", zIndex: 5,
          "&::after": {
            content: '"VS"', position: "absolute",
            top: "50%", left: "50%", transform: "translate(-50%,-50%)",
            bgcolor: C.navyCard, border: `1px solid ${C.navyBorder}`,
            color: C.textMuted, fontSize: "0.58rem", fontWeight: 700,
            fontFamily: fonts.display, letterSpacing: "0.12em",
            px: 0.8, py: 0.4, borderRadius: "6px", whiteSpace: "nowrap",
            boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
          },
        }} />
      )}

      {/* Alternate map — always mounted, hidden when not split */}
      <Box sx={{
        flex: showSplit ? 1 : 0,
        minWidth: showSplit ? 0 : 0,
        overflow: "hidden",
        height: "100%",
        position: "relative",
        ...(!showSplit && { maxWidth: 0 }),
      }}>
        <Box sx={{ position: "absolute", inset: 0 }}>
          <SingleMap ref={alternateRef} label="Alternate Route" labelColor="#a78bfa" badge="via custom road" />
        </Box>
      </Box>

      {loading && (
        <Box sx={{
          position: "absolute", inset: 0, zIndex: 20,
          display: "flex", alignItems: "center", justifyContent: "center",
          bgcolor: "rgba(10,15,30,0.55)", backdropFilter: "blur(6px)",
        }}>
          <Box sx={{
            textAlign: "center",
            bgcolor: "rgba(17,24,39,0.9)",
            border: `1px solid ${C.navyBorder}`,
            borderRadius: "16px",
            px: 4, py: 3,
            boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
          }}>
            <Box sx={{
              width: 48, height: 48, borderRadius: "14px",
              background: `linear-gradient(135deg, ${C.cyan}18, ${C.navyBorder})`,
              border: `1px solid ${C.cyan}25`,
              display: "flex", alignItems: "center", justifyContent: "center",
              mx: "auto", mb: 1.5,
            }}>
              <CircularProgress size={20} thickness={4} sx={{ color: C.cyan }} />
            </Box>
            <Typography sx={{ color: C.textPrimary, fontWeight: 600, fontSize: "0.85rem", fontFamily: fonts.body }}>
              Calculating Route
            </Typography>
            <Typography sx={{ color: C.textMuted, fontSize: "0.7rem", fontFamily: fonts.body, mt: 0.4 }}>
              Finding the optimal path…
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
});

export default MapView;