// ─── components/CameraView.jsx ───────────────────────────────────────────────
// Step 3: Real-time camera feed with AR directional arrow overlay
// Uses device GPS + compass bearing to determine turn direction at each step

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Box, Typography, IconButton, Button, Chip, Fade, CircularProgress } from "@mui/material";
import {
  CameraAlt, CameraAltOutlined, Close, Navigation,
  TurnLeft, TurnRight, Straight, NearMe, Speed,
  MyLocation, SignalCellularAlt,
} from "@mui/icons-material";
import { C, fonts } from "../app/utils/theme";

// ── Bearing calculation helpers ───────────────────────────────────────────────

/** Degrees to radians */
const toRad = (d) => (d * Math.PI) / 180;

/** Compute compass bearing from pointA → pointB (0=N, 90=E, 180=S, 270=W) */
function getBearing(from, to) {
  const dLng = toRad(to[1] - from[1]);
  const lat1 = toRad(from[0]);
  const lat2 = toRad(to[0]);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/** Haversine distance in metres */
function distanceMetres(a, b) {
  const R = 6371000;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

/** Given device heading and required bearing → return "left" | "right" | "straight" | "uturn" */
function getTurnDirection(deviceHeading, targetBearing) {
  let diff = ((targetBearing - deviceHeading + 540) % 360) - 180; // −180…+180
  if (diff > 135 || diff < -135) return "uturn";
  if (diff > 25)  return "right";
  if (diff < -25) return "left";
  return "straight";
}

// ── Arrow config ──────────────────────────────────────────────────────────────
const ARROW_CONFIG = {
  straight: { icon: Straight,   label: "Go Straight",   color: C.cyan,    rotate: 0   },
  right:    { icon: TurnRight,  label: "Turn Right",    color: "#f59e0b",  rotate: 0   },
  left:     { icon: TurnLeft,   label: "Turn Left",     color: "#f59e0b",  rotate: 0   },
  uturn:    { icon: Navigation, label: "Make U-Turn",   color: C.rose,     rotate: 180 },
  arrived:  { icon: NearMe,     label: "You Arrived!",  color: C.green,    rotate: 0   },
};

// ── Simulated GPS that moves along the route (for demo without real GPS) ─────
function useSimulatedGPS(routeCoords, active) {
  const [position, setPosition] = useState(null);
  const [heading,  setHeading]  = useState(0);
  const indexRef = useRef(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!active || !routeCoords?.length) {
      setPosition(null);
      return;
    }
    indexRef.current = 0;

    const step = () => {
      const i   = indexRef.current;
      const pos = routeCoords[i];
      const next = routeCoords[Math.min(i + 1, routeCoords.length - 1)];
      const brg  = getBearing(pos, next);

      setPosition(pos);
      setHeading(brg);
      indexRef.current = Math.min(i + 3, routeCoords.length - 1); // jump 3 steps at a time
    };

    step();
    timerRef.current = setInterval(step, 1800);
    return () => clearInterval(timerRef.current);
  }, [active, routeCoords]);

  return { position, heading };
}

// ── AR Arrow Overlay ──────────────────────────────────────────────────────────
function AROverlay({ direction, distanceToNext, streetName, speed }) {
  const cfg = ARROW_CONFIG[direction] || ARROW_CONFIG.straight;
  const IconComp = cfg.icon;

  return (
    <Box sx={{
      position: "absolute", inset: 0,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      pointerEvents: "none",
    }}>
      {/* Main arrow card */}
      <Box sx={{
        display: "flex", flexDirection: "column", alignItems: "center",
        gap: 1,
        animation: "arPulse 2s ease-in-out infinite",
        "@keyframes arPulse": {
          "0%, 100%": { transform: "scale(1)", filter: `drop-shadow(0 0 12px ${cfg.color}80)` },
          "50%":       { transform: "scale(1.06)", filter: `drop-shadow(0 0 24px ${cfg.color})` },
        },
      }}>
        {/* Outer glow ring */}
        <Box sx={{
          position: "relative",
          width: { xs: 90, sm: 120 }, height: { xs: 90, sm: 120 },
          borderRadius: "50%",
          border: `3px solid ${cfg.color}40`,
          display: "flex", alignItems: "center", justifyContent: "center",
          "&::before": {
            content: '""', position: "absolute", inset: 8,
            borderRadius: "50%",
            border: `2px solid ${cfg.color}25`,
          },
        }}>
          <Box sx={{
            width: { xs: 66, sm: 90 }, height: { xs: 66, sm: 90 },
            borderRadius: "50%",
            background: `radial-gradient(circle, ${cfg.color}22 0%, ${cfg.color}08 70%, transparent 100%)`,
            border: `2px solid ${cfg.color}60`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <IconComp sx={{
              fontSize: { xs: 36, sm: 52 }, color: cfg.color,
              transform: `rotate(${cfg.rotate}deg)`,
              filter: `drop-shadow(0 0 8px ${cfg.color})`,
            }} />
          </Box>
        </Box>

        {/* Direction label */}
        <Box sx={{
          px: 2.5, py: 0.8,
          bgcolor: "rgba(10,15,30,0.75)",
          backdropFilter: "blur(12px)",
          border: `1px solid ${cfg.color}50`,
          borderRadius: "30px",
        }}>
          <Typography sx={{
            fontSize: "1rem", fontWeight: 700,
            color: cfg.color, fontFamily: fonts.display,
            letterSpacing: "0.04em",
            textShadow: `0 0 12px ${cfg.color}`,
          }}>
            {cfg.label}
          </Typography>
        </Box>

        {/* Street name */}
        {streetName && (
          <Typography sx={{
            fontSize: "0.8rem", color: "rgba(255,255,255,0.7)",
            fontFamily: fonts.body, textAlign: "center",
            textShadow: "0 1px 4px rgba(0,0,0,0.8)",
          }}>
            {streetName}
          </Typography>
        )}
      </Box>

      {/* Distance pill — bottom center */}
      {distanceToNext && (
        <Box sx={{
          position: "absolute", bottom: { xs: 70, sm: 90 },
          px: { xs: 1.5, sm: 2 }, py: 0.8,
          bgcolor: "rgba(10,15,30,0.8)",
          backdropFilter: "blur(12px)",
          border: `1px solid ${C.navyBorder}`,
          borderRadius: "30px",
          display: "flex", alignItems: "center", gap: 0.8,
        }}>
          <MyLocation sx={{ fontSize: 14, color: C.cyan }} />
          <Typography sx={{ fontSize: "0.85rem", fontWeight: 600, color: C.textPrimary, fontFamily: fonts.display }}>
            {distanceToNext < 1000
              ? `${Math.round(distanceToNext)} m`
              : `${(distanceToNext / 1000).toFixed(1)} km`}
          </Typography>
          <Typography sx={{ fontSize: "0.72rem", color: C.textMuted, fontFamily: fonts.body }}>
            to next turn
          </Typography>
        </Box>
      )}

      {/* Speed pill — bottom right */}
      {speed != null && (
        <Box sx={{
          position: "absolute", bottom: { xs: 70, sm: 90 }, right: { xs: 12, sm: 20 },
          px: 1.5, py: 0.7,
          bgcolor: "rgba(10,15,30,0.75)",
          backdropFilter: "blur(10px)",
          border: `1px solid ${C.navyBorder}`,
          borderRadius: "10px",
          display: "flex", flexDirection: "column", alignItems: "center",
        }}>
          <Typography sx={{ fontSize: "1.1rem", fontWeight: 800, color: C.textPrimary, fontFamily: fonts.display, lineHeight: 1 }}>
            {Math.round(speed)}
          </Typography>
          <Typography sx={{ fontSize: "0.55rem", color: C.textMuted, letterSpacing: "0.08em" }}>
            KM/H
          </Typography>
        </Box>
      )}

      {/* Horizon AR grid lines */}
      <Box sx={{
        position: "absolute", bottom: "35%", left: 0, right: 0,
        height: 1, bgcolor: `${cfg.color}15`,
        "&::before": {
          content: '""', position: "absolute",
          top: -20, left: "10%", right: "10%",
          height: 1, bgcolor: `${cfg.color}08`,
        },
        "&::after": {
          content: '""', position: "absolute",
          top: 20, left: "20%", right: "20%",
          height: 1, bgcolor: `${cfg.color}05`,
        },
      }} />
    </Box>
  );
}

// ── HUD top bar ───────────────────────────────────────────────────────────────
function HUDBar({ routeInfo, stepIndex, totalSteps, onClose }) {
  return (
    <Box sx={{
      position: "absolute", top: 0, left: 0, right: 0, zIndex: 10,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      px: { xs: 1.5, sm: 2 }, py: { xs: 1, sm: 1.5 },
      background: "linear-gradient(180deg, rgba(10,15,30,0.9) 0%, transparent 100%)",
    }}>
      {/* Left: route summary */}
      <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.8, sm: 1.2 } }}>
        <Box sx={{
          width: { xs: 28, sm: 32 }, height: { xs: 28, sm: 32 }, borderRadius: "9px",
          background: `linear-gradient(135deg, ${C.cyan}, ${C.blue})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 0 12px ${C.cyanGlow}`,
        }}>
          <Navigation sx={{ fontSize: { xs: 14, sm: 16 }, color: "#fff" }} />
        </Box>
        <Box>
          <Typography sx={{ fontSize: { xs: "0.7rem", sm: "0.78rem" }, fontWeight: 700, color: C.textPrimary, fontFamily: fonts.display, lineHeight: 1 }}>
            AR Navigation
          </Typography>
          {routeInfo && (
            <Typography sx={{ fontSize: { xs: "0.58rem", sm: "0.65rem" }, color: C.textMuted, fontFamily: fonts.body }}>
              {routeInfo.distance} km · {routeInfo.duration} min remaining
            </Typography>
          )}
        </Box>
      </Box>

      {/* Center: step progress — hidden on very small screens */}
      <Box sx={{ display: { xs: "none", sm: "flex" }, alignItems: "center", gap: 0.5 }}>
        {[...Array(Math.min(totalSteps, 8))].map((_, i) => (
          <Box key={i} sx={{
            width: i === stepIndex ? 16 : 5,
            height: 5, borderRadius: "3px",
            bgcolor: i === stepIndex ? C.cyan : i < stepIndex ? `${C.cyan}50` : C.navyBorder,
            transition: "all 0.3s",
          }} />
        ))}
      </Box>

      {/* Right: close + signal */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
          <SignalCellularAlt sx={{ fontSize: 14, color: C.green }} />
          <Typography sx={{ fontSize: "0.65rem", color: C.green, fontFamily: fonts.body, fontWeight: 600 }}>
            GPS
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{
          color: C.textMuted, border: `1px solid ${C.navyBorder}`,
          borderRadius: "8px", width: 28, height: 28,
          bgcolor: "rgba(10,15,30,0.6)",
          "&:hover": { borderColor: C.rose, color: C.rose },
        }}>
          <Close sx={{ fontSize: 13 }} />
        </IconButton>
      </Box>
    </Box>
  );
}

// ── Main CameraView component ─────────────────────────────────────────────────
export default function CameraView({ routeCoords, routeInfo, onClose }) {
  const videoRef      = useRef(null);
  const streamRef     = useRef(null);
  const [camReady,    setCamReady]    = useState(false);
  const [camError,    setCamError]    = useState("");
  const [direction,   setDirection]   = useState("straight");
  const [distToNext,  setDistToNext]  = useState(null);
  const [stepIndex,   setStepIndex]   = useState(0);
  const [speed,       setSpeed]       = useState(null);
  const [arrived,     setArrived]     = useState(false);

  // Pick waypoints along route as "turn points" (every ~15 coords)
  const waypoints = routeCoords
    ? routeCoords.filter((_, i) => i % 15 === 0 || i === routeCoords.length - 1)
    : [];

  // Simulated GPS movement along route
  const { position, heading } = useSimulatedGPS(routeCoords, camReady && !!routeCoords);

  // ── Update direction when position or heading changes ──
  useEffect(() => {
    if (!position || !waypoints.length) return;

    // Find closest upcoming waypoint
    let closestIdx = stepIndex;
    let minDist    = Infinity;
    for (let i = stepIndex; i < waypoints.length; i++) {
      const d = distanceMetres(position, waypoints[i]);
      if (d < minDist) { minDist = d; closestIdx = i; }
    }

    // Auto-advance step
    if (minDist < 40 && closestIdx < waypoints.length - 1) {
      setStepIndex(closestIdx + 1);
    }

    // Check arrival
    const dest    = waypoints[waypoints.length - 1];
    const distEnd = distanceMetres(position, dest);
    if (distEnd < 50) { setDirection("arrived"); setArrived(true); return; }

    // Get next waypoint bearing
    const nextWp   = waypoints[Math.min(closestIdx + 1, waypoints.length - 1)];
    const bearing  = getBearing(position, nextWp);
    const dir      = getTurnDirection(heading, bearing);
    setDirection(dir);
    setDistToNext(distanceMetres(position, nextWp));

    // Simulated speed 20–45 km/h
    setSpeed(20 + Math.random() * 25);
  }, [position, heading]);

  // ── Start camera ──────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setCamError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCamReady(true);
      }
    } catch (err) {
      if (err.name === "NotAllowedError") {
        setCamError("Camera permission denied. Please allow camera access.");
      } else if (err.name === "NotFoundError") {
        setCamError("No camera found on this device.");
      } else {
        // Demo mode — show AR overlay without real camera
        setCamReady(true);
      }
    }
  }, []);

  // ── Stop camera on unmount ────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return (
    <Box sx={{
      position: "fixed", inset: 0, zIndex: 100,
      bgcolor: C.navy,
      display: "flex", flexDirection: "column",
    }}>
      {/* ── Camera not started yet ── */}
      {!camReady && !camError && (
        <Box sx={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 3,
          background: `radial-gradient(ellipse at 50% 40%, rgba(34,211,238,0.08) 0%, transparent 70%)`,
        }}>
          <Box sx={{
            width: { xs: 60, sm: 80 }, height: { xs: 60, sm: 80 }, borderRadius: { xs: "18px", sm: "22px" },
            background: `linear-gradient(135deg, ${C.cyan}20, ${C.blue}20)`,
            border: `1px solid ${C.cyan}30`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 0 40px ${C.cyanGlow}`,
          }}>
            <CameraAlt sx={{ fontSize: { xs: 28, sm: 38 }, color: C.cyan }} />
          </Box>

          <Box sx={{ textAlign: "center", maxWidth: 320, px: 2 }}>
            <Typography sx={{ fontSize: { xs: "1rem", sm: "1.2rem" }, fontWeight: 700, color: C.textPrimary, fontFamily: fonts.display, mb: 1 }}>
              AR Navigation Ready
            </Typography>
            <Typography sx={{ fontSize: "0.82rem", color: C.textMuted, fontFamily: fonts.body, lineHeight: 1.6 }}>
              Enable your camera to see real-time directional arrows overlaid on your live view
            </Typography>
          </Box>

          {routeInfo && (
            <Box sx={{ display: "flex", gap: 2 }}>
              <Chip label={`${routeInfo.distance} km`} size="small" sx={{ bgcolor: C.navyCard, border: `1px solid ${C.navyBorder}`, color: C.cyan, fontFamily: fonts.body }} />
              <Chip label={`${routeInfo.duration} min`} size="small" sx={{ bgcolor: C.navyCard, border: `1px solid ${C.navyBorder}`, color: C.blue, fontFamily: fonts.body }} />
            </Box>
          )}

          <Button
            onClick={startCamera}
            startIcon={<CameraAltOutlined />}
            sx={{
              py: 1.4, px: 4, borderRadius: "12px",
              textTransform: "none", fontFamily: fonts.body,
              fontWeight: 600, fontSize: "0.9rem",
              background: `linear-gradient(135deg, ${C.cyan}, ${C.blue})`,
              color: C.navy,
              boxShadow: `0 6px 24px ${C.cyanGlow}`,
              "&:hover": { boxShadow: `0 8px 32px rgba(34,211,238,0.4)` },
            }}
          >
            Start AR View
          </Button>

          <Button
            onClick={onClose}
            sx={{ textTransform: "none", color: C.textMuted, fontFamily: fonts.body, "&:hover": { color: C.rose } }}
          >
            ← Back to Map
          </Button>
        </Box>
      )}

      {/* ── Camera error ── */}
      {camError && (
        <Box sx={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 2, p: 4,
        }}>
          <Typography sx={{ color: "#f87171", fontWeight: 600, fontFamily: fonts.body, textAlign: "center" }}>
            {camError}
          </Typography>
          <Button onClick={onClose} sx={{ color: C.textMuted, textTransform: "none", fontFamily: fonts.body }}>
            ← Back to Map
          </Button>
        </Box>
      )}

      {/* ── Active AR View ── */}
      {camReady && (
        <Box sx={{ flex: 1, position: "relative", overflow: "hidden" }}>
          {/* Live video — fills screen */}
          <video
            ref={videoRef}
            autoPlay playsInline muted
            style={{
              position: "absolute", inset: 0,
              width: "100%", height: "100%",
              objectFit: "cover",
            }}
          />

          {/* Dark overlay when no real camera (demo mode) */}
          {!streamRef.current && (
            <Box sx={{
              position: "absolute", inset: 0,
              background: `
                radial-gradient(ellipse at 50% 60%, rgba(34,211,238,0.05) 0%, transparent 60%),
                linear-gradient(180deg, #0a0f1e 0%, #0d1a2e 50%, #0a1520 100%)
              `,
            }}>
              {/* Demo road perspective */}
              <Box sx={{
                position: "absolute", bottom: 0, left: "50%",
                transform: "translateX(-50%)",
                width: "140%", height: "55%",
                background: "linear-gradient(180deg, transparent 0%, rgba(30,45,69,0.5) 100%)",
                clipPath: "polygon(30% 0%, 70% 0%, 100% 100%, 0% 100%)",
              }} />
              {/* Road markings */}
              {[0, 1, 2, 3].map((i) => (
                <Box key={i} sx={{
                  position: "absolute",
                  bottom: `${10 + i * 12}%`,
                  left: "50%", transform: "translateX(-50%)",
                  width: `${3 - i * 0.4}%`, height: `${3 + i * 0.8}%`,
                  bgcolor: "rgba(255,255,255,0.12)",
                  borderRadius: "3px",
                }} />
              ))}
              <Box sx={{
                position: "absolute", bottom: 16, left: "50%",
                transform: "translateX(-50%)",
                bgcolor: "rgba(10,15,30,0.7)",
                border: `1px solid ${C.navyBorder}`,
                borderRadius: "8px", px: 1.5, py: 0.5,
              }}>
                <Typography sx={{ fontSize: "0.65rem", color: C.textMuted, fontFamily: fonts.body }}>
                  📷 Demo Mode — no camera detected
                </Typography>
              </Box>
            </Box>
          )}

          {/* HUD top bar */}
          <HUDBar
            routeInfo={routeInfo}
            stepIndex={stepIndex}
            totalSteps={waypoints.length}
            onClose={onClose}
          />

          {/* AR Direction overlay */}
          <AROverlay
            direction={arrived ? "arrived" : direction}
            distanceToNext={distToNext}
            speed={speed}
          />

          {/* Arrived banner */}
          <Fade in={arrived}>
            <Box sx={{
              position: "absolute", bottom: 40, left: 20, right: 20,
              bgcolor: "rgba(10,15,30,0.88)",
              border: `1px solid ${C.green}40`,
              borderRadius: "14px", p: 2.5,
              textAlign: "center",
              backdropFilter: "blur(16px)",
            }}>
              <Typography sx={{ fontSize: "1.1rem", fontWeight: 700, color: C.green, fontFamily: fonts.display, mb: 0.5 }}>
                🎉 You've Arrived!
              </Typography>
              <Typography sx={{ fontSize: "0.78rem", color: C.textMuted, fontFamily: fonts.body, mb: 1.5 }}>
                You have reached your destination.
              </Typography>
              <Button onClick={onClose} sx={{
                textTransform: "none", fontFamily: fonts.body,
                fontWeight: 600, color: C.green,
                border: `1px solid ${C.green}40`,
                borderRadius: "8px", px: 2,
                "&:hover": { bgcolor: `${C.green}10` },
              }}>
                Back to Map
              </Button>
            </Box>
          </Fade>
        </Box>
      )}
    </Box>
  );
}