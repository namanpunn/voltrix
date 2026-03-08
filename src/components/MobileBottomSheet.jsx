// ─── MobileBottomSheet.jsx ────────────────────────────────────────────────────
// Draggable bottom sheet overlay for mobile navigation.
// Three snap states: "full" (90vh), "peek" (small strip), "mid" (50vh)
// Contains all sidebar content. Drag handle at top for swipe gestures.

"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Box, Typography, IconButton, Button, Chip, Divider } from "@mui/material";
import {
  Navigation, SwapVert, Directions, RouteOutlined,
  ExpandLessRounded, KeyboardArrowDown,
} from "@mui/icons-material";
import { CircularProgress } from "@mui/material";
import Link from "next/link";
import { C, fonts, getColors } from "../app/utils/theme";
import PlaceAutocomplete from "./PlaceAutocomplete";
import RouteInfoCard from "./RouteInfoCard";
import AlternateRouteInput from "./AlternateRouteInput";

// ── Snap positions (from bottom of screen) ────────────────────────────────────
const SNAP_FULL = 0.88;  // 88% of viewport height
const SNAP_MID  = 0.50;  // 50%
const SNAP_PEEK = 0.10;  // 10% — just the handle + summary

export default function MobileBottomSheet({
  source, setSource,
  destination, setDestination,
  onGetRoute,
  onSwap,
  onClear,
  onCompareAlternate,
  onClearAlternate,
  loading, error,
  primaryRoute,
  alternateRoute,
  showSplit,
  isDark = true,
  sheetSnap,        // controlled snap: "full" | "peek" | "mid"
  onSnapChange,     // (snap) => void
}) {
  const T = getColors(isDark);
  const sheetRef   = useRef(null);
  const dragRef    = useRef({ startY: 0, startH: 0, dragging: false });

  // ── Height from snap name ────────────────────────────────────────────────
  const snapToHeight = useCallback((snap) => {
    const vh = window.innerHeight;
    if (snap === "full") return vh * SNAP_FULL;
    if (snap === "mid")  return vh * SNAP_MID;
    return vh * SNAP_PEEK;
  }, []);

  const [height, setHeight] = useState(() =>
    typeof window !== "undefined" ? window.innerHeight * SNAP_FULL : 500
  );

  // Sync controlled snap → height
  useEffect(() => {
    setHeight(snapToHeight(sheetSnap));
  }, [sheetSnap, snapToHeight]);

  // ── Drag handling ────────────────────────────────────────────────────────
  const onDragStart = useCallback((clientY) => {
    dragRef.current = { startY: clientY, startH: height, dragging: true };
  }, [height]);

  const onDragMove = useCallback((clientY) => {
    if (!dragRef.current.dragging) return;
    const delta = dragRef.current.startY - clientY;
    const newH = Math.max(60, Math.min(window.innerHeight * 0.92, dragRef.current.startH + delta));
    setHeight(newH);
  }, []);

  const onDragEnd = useCallback(() => {
    if (!dragRef.current.dragging) return;
    dragRef.current.dragging = false;
    const vh = window.innerHeight;
    const ratio = height / vh;
    // Snap to closest
    let snap = "peek";
    if (ratio > 0.65) snap = "full";
    else if (ratio > 0.28) snap = "mid";
    setHeight(snapToHeight(snap));
    onSnapChange?.(snap);
  }, [height, snapToHeight, onSnapChange]);

  // Mouse events
  useEffect(() => {
    const handleMouseMove = (e) => onDragMove(e.clientY);
    const handleMouseUp   = () => onDragEnd();
    if (dragRef.current.dragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [onDragMove, onDragEnd]);

  // Touch events on handle
  const handleTouchStart = (e) => onDragStart(e.touches[0].clientY);
  const handleTouchMove  = (e) => { e.preventDefault(); onDragMove(e.touches[0].clientY); };
  const handleTouchEnd   = () => onDragEnd();
  const handleMouseDown  = (e) => { e.preventDefault(); onDragStart(e.clientY); };

  const isPeek = sheetSnap === "peek";
  const isFull = sheetSnap === "full";

  return (
    <Box
      ref={sheetRef}
      sx={{
        position: "fixed",
        bottom: 0, left: 0, right: 0,
        zIndex: 1200,
        height: `${height}px`,
        transition: dragRef.current.dragging ? "none" : "height 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
        display: "flex", flexDirection: "column",
        bgcolor: T.navyLight,
        borderTopLeftRadius: "20px",
        borderTopRightRadius: "20px",
        boxShadow: "0 -8px 40px rgba(0,0,0,0.5)",
        overflow: "hidden",
        willChange: "height",
      }}
    >
      {/* ── Drag handle ─────────────────────────────────────────────────── */}
      <Box
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        sx={{
          flexShrink: 0,
          display: "flex", flexDirection: "column", alignItems: "center",
          pt: 1, pb: 0.5,
          cursor: "grab",
          userSelect: "none",
          touchAction: "none",
          "&:active": { cursor: "grabbing" },
        }}
      >
        <Box sx={{
          width: 40, height: 4, borderRadius: 2,
          bgcolor: T.navyBorder,
          mb: 0.5,
        }} />
      </Box>

      {/* ── Peek summary (visible when minimized) ──────────────────────── */}
      {isPeek && primaryRoute && (
        <Box
          onClick={() => onSnapChange?.("mid")}
          sx={{
            px: 2.5, pb: 1.5,
            display: "flex", alignItems: "center", gap: 1.5,
            cursor: "pointer",
          }}
        >
          <Box sx={{
            width: 32, height: 32, borderRadius: "9px",
            background: `linear-gradient(135deg, ${T.cyan}, ${T.blue || C.blue})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <Navigation sx={{ fontSize: 15, color: "#fff" }} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: T.textPrimary, fontFamily: fonts.body, lineHeight: 1.2 }}>
              {primaryRoute.distance} km · {primaryRoute.duration} min
            </Typography>
            <Typography sx={{
              fontSize: "0.65rem", color: T.textMuted, fontFamily: fonts.body,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {source} → {destination}
            </Typography>
          </Box>
          <ExpandLessRounded sx={{ fontSize: 20, color: T.textMuted }} />
        </Box>
      )}

      {isPeek && !primaryRoute && (
        <Box
          onClick={() => onSnapChange?.("full")}
          sx={{
            px: 2.5, pb: 1.5,
            display: "flex", alignItems: "center", gap: 1.5,
            cursor: "pointer",
          }}
        >
          <Box sx={{
            width: 32, height: 32, borderRadius: "9px",
            background: `linear-gradient(135deg, ${T.cyan}, ${T.blue || C.blue})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <RouteOutlined sx={{ fontSize: 15, color: "#fff" }} />
          </Box>
          <Typography sx={{ fontSize: "0.78rem", fontWeight: 500, color: T.textSub, fontFamily: fonts.body }}>
            Tap to plan your route
          </Typography>
          <ExpandLessRounded sx={{ fontSize: 20, color: T.textMuted, ml: "auto" }} />
        </Box>
      )}

      {/* ── Full sheet content (hidden when peek) ──────────────────────── */}
      {!isPeek && (
        <Box sx={{
          flex: 1, minHeight: 0,
          overflowY: "auto", overflowX: "hidden",
          "&::-webkit-scrollbar": { width: 4 },
          "&::-webkit-scrollbar-track": { bgcolor: "transparent" },
          "&::-webkit-scrollbar-thumb": { bgcolor: T.navyBorder, borderRadius: 2 },
        }}>
          {/* ── Top bar ─────────────────────────────────────────────────── */}
          <Box sx={{
            px: 2.5, py: 1.5,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexShrink: 0,
          }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box sx={{
                width: 32, height: 32, borderRadius: "9px",
                background: `linear-gradient(135deg, ${T.cyan}, ${T.blue || C.blue})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: `0 0 12px ${T.cyanGlow}`,
              }}>
                <Navigation sx={{ fontSize: 15, color: "#fff" }} />
              </Box>
              <Box>
                <Typography sx={{ fontFamily: fonts.display, fontWeight: 700, fontSize: "0.9rem", color: T.textPrimary, lineHeight: 1 }}>
                  SmartRoute
                </Typography>
                <Typography sx={{ fontSize: "0.62rem", color: T.textMuted, mt: 0.1 }}>
                  Vision Navigation
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: "flex", gap: 0.5 }}>
              <Link href="/" passHref>
                <Chip label="← Home" size="small" clickable sx={{
                  bgcolor: T.navyCard, border: `1px solid ${T.navyBorder}`,
                  color: T.textMuted, fontSize: "0.62rem", height: 26,
                  fontFamily: fonts.body,
                  "&:hover": { borderColor: T.cyan, color: T.cyan },
                }} />
              </Link>
              {sheetSnap === "full" && (
                <IconButton size="small" onClick={() => onSnapChange?.("peek")} sx={{
                  color: T.textMuted, width: 26, height: 26,
                  "&:hover": { color: T.cyan },
                }}>
                  <KeyboardArrowDown sx={{ fontSize: 18 }} />
                </IconButton>
              )}
            </Box>
          </Box>

          {/* ── Route Planner ───────────────────────────────────────────── */}
          <Box sx={{ px: 2.5, pb: 1.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <RouteOutlined sx={{ fontSize: 14, color: T.cyan }} />
              <Typography sx={{
                fontSize: "0.68rem", fontWeight: 600,
                letterSpacing: "0.12em", textTransform: "uppercase",
                color: T.textMuted, fontFamily: fonts.body,
              }}>
                Route Planner
              </Typography>
            </Box>

            {/* Source */}
            <PlaceAutocomplete
              label="Source"
              value={source}
              onChange={(v) => setSource(v)}
              onSelect={(s) => setSource(s.shortName)}
              onEnterPress={onGetRoute}
              dotColor={T.cyan}
              placeholder="e.g. Connaught Place, Delhi"
              disabled={loading}
            />

            {/* Swap row */}
            <Box sx={{ display: "flex", alignItems: "center", my: 1, pl: 0.5 }}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.3, mr: 1 }}>
                {[0,1,2].map(i => (
                  <Box key={i} sx={{ width: 1.5, height: 4, borderRadius: 1, bgcolor: T.navyBorder }} />
                ))}
              </Box>
              <Box sx={{ flex: 1 }} />
              <IconButton
                onClick={onSwap} size="small" disabled={loading}
                sx={{
                  bgcolor: T.navyCard, border: `1px solid ${T.navyBorder}`,
                  borderRadius: "8px", width: 28, height: 28,
                  color: T.textMuted,
                  "&:hover": { borderColor: T.cyan, bgcolor: T.cyanGlow, color: T.cyan },
                }}
              >
                <SwapVert sx={{ fontSize: 14 }} />
              </IconButton>
            </Box>

            {/* Destination */}
            <PlaceAutocomplete
              label="Destination"
              value={destination}
              onChange={(v) => setDestination(v)}
              onSelect={(s) => setDestination(s.shortName)}
              onEnterPress={onGetRoute}
              dotColor={T.rose}
              placeholder="e.g. India Gate, Delhi"
              disabled={loading}
            />

            {/* Error */}
            {error && (
              <Typography sx={{
                mt: 1,
                fontSize: "0.74rem", color: "#f87171",
                bgcolor: "rgba(248,113,113,0.07)",
                border: "1px solid rgba(248,113,113,0.18)",
                px: 1.5, py: 0.8, borderRadius: "8px",
                borderLeft: "3px solid #f87171",
                fontFamily: fonts.body,
              }}>
                {error}
              </Typography>
            )}

            {/* Action buttons */}
            <Box sx={{ display: "flex", gap: 1.5, mt: 1.5 }}>
              <Button
                fullWidth onClick={onGetRoute}
                disabled={loading || !source.trim() || !destination.trim()}
                startIcon={loading
                  ? <CircularProgress size={14} color="inherit" />
                  : <Directions sx={{ fontSize: "16px !important" }} />
                }
                sx={{
                  py: 1.2, borderRadius: "10px",
                  textTransform: "none", fontFamily: fonts.body,
                  fontWeight: 600, fontSize: "0.85rem",
                  background: `linear-gradient(135deg, ${T.blue || C.blue}, ${T.blueDark || C.blueDark})`,
                  boxShadow: `0 4px 20px ${T.blueGlow || C.blueGlow}`,
                  "&:hover": {
                    background: `linear-gradient(135deg, #60a5fa, ${C.blue})`,
                  },
                  "&:disabled": { opacity: 0.45 },
                  color: "#fff",
                }}
              >
                {loading ? "Calculating..." : "Get Route"}
              </Button>

              {primaryRoute && (
                <Button
                  onClick={onClear}
                  sx={{
                    py: 1.2, px: 2, borderRadius: "10px",
                    textTransform: "none", fontFamily: fonts.body,
                    fontWeight: 500, fontSize: "0.82rem",
                    color: T.textMuted,
                    border: `1px solid ${T.navyBorder}`,
                    minWidth: "auto",
                    "&:hover": { borderColor: T.rose, color: T.rose },
                  }}
                >
                  Clear
                </Button>
              )}
            </Box>
          </Box>

          {/* ── Divider ──────────────────────────────────────────────────── */}
          {primaryRoute && <Divider sx={{ borderColor: T.navyBorder, mx: 2.5 }} />}

          {/* ── Results ──────────────────────────────────────────────────── */}
          {primaryRoute && (
            <Box sx={{ px: 2.5, pt: 2, pb: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: T.cyan, boxShadow: `0 0 6px ${T.cyan}` }} />
                <Typography sx={{
                  fontSize: "0.68rem", fontWeight: 600,
                  letterSpacing: "0.12em", textTransform: "uppercase",
                  color: T.textMuted, fontFamily: fonts.body,
                }}>
                  Optimal Route
                </Typography>
              </Box>

              <RouteInfoCard route={primaryRoute} variant="primary" />

              {/* Alternate route card */}
              {alternateRoute && (
                <>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5, mt: 2 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#a78bfa", boxShadow: "0 0 6px #a78bfa" }} />
                    <Typography sx={{
                      fontSize: "0.68rem", fontWeight: 600,
                      letterSpacing: "0.12em", textTransform: "uppercase",
                      color: T.textMuted, fontFamily: fonts.body,
                    }}>
                      Alternate Route
                    </Typography>
                  </Box>
                  <RouteInfoCard
                    route={{ ...alternateRoute, fromText: primaryRoute.fromText, toText: primaryRoute.toText }}
                    compareRoute={primaryRoute}
                    variant="alternate"
                  />
                </>
              )}

              <Divider sx={{ borderColor: T.navyBorder, my: 2 }} />

              <AlternateRouteInput
                onCompare={onCompareAlternate}
                onClear={onClearAlternate}
                loading={loading}
                hasAlternate={!!alternateRoute}
              />
            </Box>
          )}

          {/* Empty state */}
          {!primaryRoute && !loading && (
            <Box sx={{ px: 2.5, pt: 1, pb: 2 }}>
              <Box sx={{
                border: `1px dashed ${T.navyBorder}`,
                borderRadius: "12px",
                p: 2.5, textAlign: "center",
              }}>
                <Box sx={{
                  width: 44, height: 44, borderRadius: "12px",
                  background: "rgba(34,211,238,0.07)",
                  border: "1px solid rgba(34,211,238,0.12)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  mx: "auto", mb: 1.2,
                }}>
                  <RouteOutlined sx={{ fontSize: 20, color: T.cyan }} />
                </Box>
                <Typography sx={{ fontSize: "0.8rem", color: T.textSub, fontWeight: 500, mb: 0.5 }}>
                  Ready to Navigate
                </Typography>
                <Typography sx={{ fontSize: "0.7rem", color: T.textMuted, lineHeight: 1.6 }}>
                  Enter source and destination above
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 0.6, mt: 1.2 }}>
                  {["Free Routing", "No API Key", "Autocomplete"].map((f) => (
                    <Chip key={f} label={f} size="small" sx={{
                      bgcolor: T.navyCard, border: `1px solid ${T.navyBorder}`,
                      color: T.textMuted, fontSize: "0.6rem", height: 20,
                      fontFamily: fonts.body,
                    }} />
                  ))}
                </Box>
              </Box>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
