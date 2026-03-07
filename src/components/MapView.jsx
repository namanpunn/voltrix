// ─── components/MapView.jsx ───────────────────────────────────────────────────
"use client";

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { Box, Typography, CircularProgress, IconButton, Tooltip, Button } from "@mui/material";
import { CheckCircleOutlineRounded } from "@mui/icons-material";

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

// ── Source icon — green pin ───────────────────────────────────────────────────
function makeSourceIcon(L) {
  return L.divIcon({
    className: "",
    iconAnchor: [14, 36],
    html: `<div style="position:relative;width:28px;height:36px">
      <svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.3 21.7 0 14 0z" fill="#22c55e"/>
        <circle cx="14" cy="14" r="6" fill="#fff" opacity="0.95"/>
      </svg>
      <div style="position:absolute;bottom:-3px;left:50%;transform:translateX(-50%);width:10px;height:10px;border-radius:50%;background:#22c55e;opacity:0.2;animation:navPulse 2s ease-out infinite"></div>
    </div>`,
  });
}

// ── Destination icon — red pin ────────────────────────────────────────────────
function makeDestIcon(L) {
  return L.divIcon({
    className: "",
    iconAnchor: [14, 36],
    html: `<div style="position:relative;width:28px;height:36px">
      <svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.3 21.7 0 14 0z" fill="#ef4444"/>
        <circle cx="14" cy="14" r="6" fill="#fff" opacity="0.95"/>
      </svg>
      <div style="position:absolute;bottom:-3px;left:50%;transform:translateX(-50%);width:10px;height:10px;border-radius:50%;background:#ef4444;opacity:0.2;animation:navPulse 2s ease-out infinite"></div>
    </div>`,
  });
}

// ── Source/Dest label tooltip ──────────────────────────────────────────────────
function addLabelPopup(marker, text, type) {
  const color = type === "source" ? "#22c55e" : "#ef4444";
  const label = type === "source" ? "SOURCE" : "DESTINATION";
  marker.bindTooltip(
    `<div style="font-family:'DM Sans',sans-serif;font-size:11px;line-height:1.4;padding:2px 0">
      <div style="font-size:9px;font-weight:700;letter-spacing:0.1em;color:${color};margin-bottom:2px">${label}</div>
      <div style="font-weight:600;color:#f1f5f9">${text}</div>
    </div>`,
    {
      permanent: false, direction: "top", offset: [0, -44],
      className: "custom-tooltip",
      opacity: 1,
    }
  );
}

// ── Tooltip CSS injection ─────────────────────────────────────────────────────
function ensureTooltipCSS() {
  if (typeof window === "undefined") return;
  if (document.getElementById("custom-tooltip-css")) return;
  const style = document.createElement("style");
  style.id = "custom-tooltip-css";
  style.textContent = `
    .custom-tooltip {
      background: rgba(10,15,30,0.95) !important;
      border: 1px solid #1e2d45 !important;
      border-radius: 8px !important;
      box-shadow: 0 4px 20px rgba(0,0,0,0.5) !important;
      padding: 6px 10px !important;
      backdrop-filter: blur(12px);
    }
    .custom-tooltip::before { border-top-color: rgba(10,15,30,0.95) !important; }
  `;
  document.head.appendChild(style);
}

function drawRoute(map, L, coordinates, fromCoords, toCoords, color, layersRef, labels = {}) {
  // clear old layers
  layersRef.current.forEach(l => { try { map.removeLayer(l); } catch(_) {} });
  layersRef.current = [];
  ensureTooltipCSS();

  const glow = L.polyline(coordinates, { color, weight: 14, opacity: 0.1, lineJoin: "round" }).addTo(map);
  const line = L.polyline(coordinates, { color, weight: 4,  opacity: 0.9, lineJoin: "round" }).addTo(map);

  // Source marker with label
  const mA = L.marker(fromCoords, { icon: makeSourceIcon(L) }).addTo(map);
  if (labels.from) addLabelPopup(mA, labels.from, "source");
  // Destination marker with label
  const mB = L.marker(toCoords, { icon: makeDestIcon(L) }).addTo(map);
  if (labels.to) addLabelPopup(mB, labels.to, "destination");

  layersRef.current.push(glow, line, mA, mB);

  // invalidateSize + fitBounds — crucial for maps in conditionally rendered containers
  setTimeout(() => {
    map.invalidateSize({ animate: false });
    map.fitBounds(line.getBounds(), { padding: [60, 60] });
  }, 100);
}

// ── Traffic color helpers ─────────────────────────────────────────────────────
function getTrafficColor(speedKmh) {
  if (speedKmh > 60) return "#22c55e"; // green  — free flow
  if (speedKmh > 30) return "#f59e0b"; // amber  — moderate
  if (speedKmh > 15) return "#f97316"; // orange — slow
  return "#ef4444";                     // red    — congested
}

function drawTrafficRoute(map, L, trafficSegments, fromCoords, toCoords, layersRef, labels = {}) {
  // clear old layers
  layersRef.current.forEach(l => { try { map.removeLayer(l); } catch(_) {} });
  layersRef.current = [];
  ensureTooltipCSS();

  const allCoords = [];
  for (const seg of trafficSegments) {
    const color = getTrafficColor(seg.speed);
    const glow = L.polyline(seg.coordinates, { color, weight: 12, opacity: 0.12, lineJoin: "round", lineCap: "round" }).addTo(map);
    const line = L.polyline(seg.coordinates, { color, weight: 5, opacity: 0.9, lineJoin: "round", lineCap: "round" }).addTo(map);
    layersRef.current.push(glow, line);
    allCoords.push(...seg.coordinates);
  }

  // Source marker
  const mA = L.marker(fromCoords, { icon: makeSourceIcon(L) }).addTo(map);
  if (labels.from) addLabelPopup(mA, labels.from, "source");
  // Destination marker
  const mB = L.marker(toCoords, { icon: makeDestIcon(L) }).addTo(map);
  if (labels.to) addLabelPopup(mB, labels.to, "destination");
  layersRef.current.push(mA, mB);

  if (allCoords.length) {
    setTimeout(() => {
      map.invalidateSize({ animate: false });
      map.fitBounds(L.latLngBounds(allCoords), { padding: [60, 60] });
    }, 100);
  }
}

// ── TomTom Traffic tile layer config ──────────────────────────────────────────
// Free tier: 2,500 transactions/day — real-time traffic flow overlay
// Set NEXT_PUBLIC_TOMTOM_API_KEY in .env.local
function getTomTomTrafficUrl() {
  const key = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_TOMTOM_API_KEY : "";
  if (!key || key === "YOUR_TOMTOM_API_KEY_HERE") return null;
  return `https://api.tomtom.com/traffic/map/4/tile/flow/relative0/{z}/{x}/{y}.png?key=${key}&thickness=6&tileSize=256`;
}

// ── SingleMap ─────────────────────────────────────────────────────────────────
const SingleMap = forwardRef(function SingleMap({ label, labelColor = C.cyan, badge, showTraffic = false }, ref) {
  const divRef        = useRef(null);
  const mapRef        = useRef(null);   // L.Map instance
  const LRef          = useRef(null);   // Leaflet lib
  const layersRef     = useRef([]);
  const pendingRef    = useRef(null);   // draw call that arrived before map ready
  const initedRef     = useRef(false);  // guard against double-init (StrictMode)
  const trafficTileRef = useRef(null);  // TomTom traffic tile layer
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
        if (p.isTraffic) {
          drawTrafficRoute(map, L, p.trafficSegments, p.fromCoords, p.toCoords, layersRef, p.labels || {});
        } else {
          drawRoute(map, L, p.coordinates, p.fromCoords, p.toCoords, p.color, layersRef, p.labels || {});
        }
      }
    });

    return () => {
      cancelled = true;
      // Don't destroy on StrictMode cleanup — only on real unmount
      // We use initedRef so the second mount doesn't re-init
    };
  }, []);

  // ── Toggle TomTom real-time traffic tile layer ───────────────────────────
  useEffect(() => {
    if (!mapRef.current || !LRef.current) return;
    const map = mapRef.current;
    const L = LRef.current;

    if (showTraffic) {
      const url = getTomTomTrafficUrl();
      if (url && !trafficTileRef.current) {
        trafficTileRef.current = L.tileLayer(url, {
          maxZoom: 19, opacity: 0.75, zIndex: 400,
          attribution: "© TomTom Traffic",
        });
      }
      if (trafficTileRef.current && !map.hasLayer(trafficTileRef.current)) {
        trafficTileRef.current.addTo(map);
      }
    } else {
      if (trafficTileRef.current && map.hasLayer(trafficTileRef.current)) {
        map.removeLayer(trafficTileRef.current);
      }
    }
  }, [showTraffic, ready]);

  useImperativeHandle(ref, () => ({
    draw({ coordinates, fromCoords, toCoords, color = C.cyan, labels = {} }) {
      if (mapRef.current && LRef.current) {
        drawRoute(mapRef.current, LRef.current, coordinates, fromCoords, toCoords, color, layersRef, labels);
      } else {
        pendingRef.current = { coordinates, fromCoords, toCoords, color, labels };
      }
    },
    drawTraffic({ trafficSegments, fromCoords, toCoords, labels = {} }) {
      if (mapRef.current && LRef.current) {
        drawTrafficRoute(mapRef.current, LRef.current, trafficSegments, fromCoords, toCoords, layersRef, labels);
      } else {
        pendingRef.current = { trafficSegments, fromCoords, toCoords, isTraffic: true, labels };
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

// ── Traffic Legend ─────────────────────────────────────────────────────────────
function TrafficLegend() {
  const items = [
    { color: "#22c55e", label: "> 60 km/h" },
    { color: "#f59e0b", label: "30–60 km/h" },
    { color: "#f97316", label: "15–30 km/h" },
    { color: "#ef4444", label: "< 15 km/h" },
  ];
  return (
    <Box sx={{
      position: "absolute", bottom: 24, left: 14, zIndex: 10,
      bgcolor: "rgba(10,15,30,0.92)", backdropFilter: "blur(12px)",
      border: `1px solid ${C.navyBorder}`, borderRadius: "10px",
      px: 1.5, py: 1.2,
      boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
    }}>
      <Typography sx={{ fontSize: "0.6rem", color: C.textMuted, fontFamily: fonts.body, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", mb: 0.6 }}>
        Traffic Speed
      </Typography>
      {items.map(({ color, label }) => (
        <Box key={color} sx={{ display: "flex", alignItems: "center", gap: 0.8, mb: 0.3 }}>
          <Box sx={{ width: 18, height: 4, borderRadius: 2, bgcolor: color }} />
          <Typography sx={{ fontSize: "0.6rem", color: C.textPrimary, fontFamily: fonts.body }}>{label}</Typography>
        </Box>
      ))}
    </Box>
  );
}

// ── Main MapView ──────────────────────────────────────────────────────────────
const MapView = forwardRef(function MapView({ showSplit, loading, showTraffic = false, onChoosePrimary, onChooseAlternate }, ref) {
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
    drawPrimary(d)        { primaryRef.current?.draw({ ...d, color: C.cyan }); },
    drawPrimaryTraffic(d) { primaryRef.current?.drawTraffic(d); },
    drawAlternate(d)      { alternateRef.current?.draw({ ...d, color: "#a78bfa" }); },
    clearPrimary()        { primaryRef.current?.clear(); },
    clearAlternate()      { alternateRef.current?.clear(); },
    clearAll()            { primaryRef.current?.clear(); alternateRef.current?.clear(); },
    getMap()              { return primaryRef.current; },
  }));

  return (
    <Box sx={{ flex: 1, display: "flex", height: "100vh", overflow: "hidden", position: "relative" }}>

      {/* Primary map panel */}
      <Box sx={{ flex: 1, position: "relative", display: "flex", flexDirection: "column" }}>
        <Box sx={{ flex: 1, position: "relative" }}>
          <SingleMap ref={primaryRef} label={showTraffic ? "Live Traffic" : "Optimal Route"} labelColor={showTraffic ? "#22c55e" : C.cyan} badge="OpenStreetMap · OSRM" showTraffic={showTraffic} />
        </Box>

        {/* Choose primary route button */}
        {showSplit && onChoosePrimary && (
          <Button
            onClick={onChoosePrimary}
            startIcon={<CheckCircleOutlineRounded sx={{ fontSize: 16 }} />}
            sx={{
              position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)",
              zIndex: 1000,
              bgcolor: "rgba(10,15,30,0.92)", backdropFilter: "blur(12px)",
              border: `1.5px solid ${C.cyan}50`,
              color: C.cyan, fontFamily: fonts.body, fontWeight: 600,
              fontSize: "0.72rem", textTransform: "none",
              borderRadius: "10px", px: 2.5, py: 0.8,
              boxShadow: `0 4px 20px rgba(0,0,0,0.4), 0 0 12px ${C.cyan}15`,
              transition: "all 0.2s ease",
              "&:hover": {
                bgcolor: `${C.cyan}20`,
                borderColor: C.cyan,
                boxShadow: `0 0 20px ${C.cyan}30`,
                transform: "translateX(-50%) scale(1.03)",
              },
            }}
          >
            Choose this route
          </Button>
        )}
      </Box>

      {/* Traffic legend — shown when traffic mode active */}
      {showTraffic && <TrafficLegend />}

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
        display: "flex", flexDirection: "column",
        ...(!showSplit && { maxWidth: 0 }),
      }}>
        <Box sx={{ flex: 1, position: "relative" }}>
          <Box sx={{ position: "absolute", inset: 0 }}>
            <SingleMap ref={alternateRef} label="Alternate Route" labelColor="#a78bfa" badge="via custom road" showTraffic={showTraffic} />
          </Box>
        </Box>

        {/* Choose alternate route button */}
        {showSplit && onChooseAlternate && (
          <Button
            onClick={onChooseAlternate}
            startIcon={<CheckCircleOutlineRounded sx={{ fontSize: 16 }} />}
            sx={{
              position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)",
              zIndex: 1000,
              bgcolor: "rgba(10,15,30,0.92)", backdropFilter: "blur(12px)",
              border: "1.5px solid rgba(167,139,250,0.35)",
              color: "#a78bfa", fontFamily: fonts.body, fontWeight: 600,
              fontSize: "0.72rem", textTransform: "none",
              borderRadius: "10px", px: 2.5, py: 0.8,
              boxShadow: "0 4px 20px rgba(0,0,0,0.4), 0 0 12px rgba(167,139,250,0.15)",
              transition: "all 0.2s ease",
              "&:hover": {
                bgcolor: "rgba(167,139,250,0.15)",
                borderColor: "#a78bfa",
                boxShadow: "0 0 20px rgba(167,139,250,0.3)",
                transform: "translateX(-50%) scale(1.03)",
              },
            }}
          >
            Choose this route
          </Button>
        )}
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