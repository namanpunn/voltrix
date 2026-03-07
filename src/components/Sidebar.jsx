// ─── Sidebar.jsx ─────────────────────────────────────────────────────────────
"use client";

import { Box, Typography, IconButton, Button, Chip, Fade, Divider } from "@mui/material";
import {
  Navigation, ArrowBack, SwapVert, Directions,
  RouteOutlined, Videocam,
} from "@mui/icons-material";
import {CircularProgress} from "@mui/material";
import Link from "next/link";
import { C, fonts } from "../app/utils/theme";
import PlaceAutocomplete from "./PlaceAutocomplete";
import RouteInfoCard from "./RouteInfoCard";
import AlternateRouteInput from "./AlternateRouteInput";
// import RouteInfoCard from "./RouteInfoCard";
import alternateRoute from "./AlternateRouteInput";
import TrafficPanel from "./TrafficPanel";

export default function Sidebar({
  source, setSource,
  destination, setDestination,
  onGetRoute,
  onSwap,
  onClear,
  onCompareAlternate,
  onClearAlternate,
  onStartAR,
  rerouteStatus,
  rerouteHistory,
  roadblocks,
  distFromRoute,
  onReportRoadblock,
  onRemoveRoadblock,
  onSimulateOffRoute,
  onRecalculate,
  loading, error,
  primaryRoute,
  alternateRoute,
  showSplit,
}) {
  return (
    <Box sx={{
      width: 380, minWidth: 380,
      height: "100vh",
      display: "flex", flexDirection: "column",
      bgcolor: C.navyLight,
      borderRight: `1px solid ${C.navyBorder}`,
      zIndex: 10,
      overflowY: "auto", overflowX: "hidden",
      "&::-webkit-scrollbar": { width: 4 },
      "&::-webkit-scrollbar-track": { bgcolor: "transparent" },
      "&::-webkit-scrollbar-thumb": { bgcolor: C.navyBorder, borderRadius: 2 },
    }}>

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <Box sx={{
        px: 3, py: 2.5,
        borderBottom: `1px solid ${C.navyBorder}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "linear-gradient(180deg, rgba(34,211,238,0.05) 0%, transparent 100%)",
        flexShrink: 0,
      }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{
            width: 36, height: 36, borderRadius: "10px",
            background: `linear-gradient(135deg, ${C.cyan}, ${C.blue})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 0 16px ${C.cyanGlow}`,
          }}>
            <Navigation sx={{ fontSize: 18, color: "#fff" }} />
          </Box>
          <Box>
            <Typography sx={{ fontFamily: fonts.display, fontWeight: 700, fontSize: "1rem", color: C.textPrimary, lineHeight: 1 }}>
              SmartRoute
            </Typography>
            <Typography sx={{ fontSize: "0.68rem", color: C.textMuted, mt: 0.2 }}>
              Vision Navigation System
            </Typography>
          </Box>
        </Box>
        <Link href="/" passHref>
          <IconButton size="small" sx={{
            color: C.textMuted, border: `1px solid ${C.navyBorder}`,
            borderRadius: "8px", width: 32, height: 32,
            "&:hover": { borderColor: C.cyan, color: C.cyan, bgcolor: C.cyanGlow },
          }}>
            <ArrowBack sx={{ fontSize: 16 }} />
          </IconButton>
        </Link>
      </Box>

      {/* ── Route Planner ───────────────────────────────────────────────── */}
      <Box sx={{ px: 3, pt: 3, pb: 2, flexShrink: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <RouteOutlined sx={{ fontSize: 14, color: C.cyan }} />
          <Typography sx={{
            fontSize: "0.68rem", fontWeight: 600,
            letterSpacing: "0.12em", textTransform: "uppercase",
            color: C.textMuted, fontFamily: fonts.body,
          }}>
            Route Planner
          </Typography>
        </Box>

        {/* Source */}
        <PlaceAutocomplete
          label="Source"
          value={source}
          onChange={(v) => { setSource(v); }}
          onSelect={(s) => setSource(s.shortName)}
          dotColor={C.cyan}
          placeholder="e.g. Connaught Place, Delhi"
          disabled={loading}
        />

        {/* Swap row */}
        <Box sx={{ display: "flex", alignItems: "center", my: 1.2, pl: 0.5 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.3, mr: 1 }}>
            {[0,1,2].map(i => (
              <Box key={i} sx={{ width: 1.5, height: 4, borderRadius: 1, bgcolor: C.navyBorder }} />
            ))}
          </Box>
          <Box sx={{ flex: 1 }} />
          <IconButton
            onClick={onSwap} size="small" disabled={loading}
            sx={{
              bgcolor: C.navyCard, border: `1px solid ${C.navyBorder}`,
              borderRadius: "8px", width: 28, height: 28,
              color: C.textMuted,
              "&:hover": { borderColor: C.cyan, bgcolor: C.cyanGlow, color: C.cyan },
              transition: "all 0.2s",
            }}
          >
            <SwapVert sx={{ fontSize: 14 }} />
          </IconButton>
        </Box>

        {/* Destination */}
        <PlaceAutocomplete
          label="Destination"
          value={destination}
          onChange={(v) => { setDestination(v); }}
          onSelect={(s) => setDestination(s.shortName)}
          dotColor={C.rose}
          placeholder="e.g. India Gate, Delhi"
          disabled={loading}
        />

        {/* Error — no wrapper so no reserved space */}
        {error && (
          <Typography sx={{
            mt: 1.2,
            fontSize: "0.74rem", color: "#f87171",
            bgcolor: "rgba(248,113,113,0.07)",
            border: "1px solid rgba(248,113,113,0.18)",
            px: 1.5, py: 0.8, borderRadius: "8px",
            borderLeft: "3px solid #f87171",
            fontFamily: fonts.body,
            display: "block",
          }}>
            {error}
          </Typography>
        )}

        {/* Action buttons */}
        <Box sx={{ display: "flex", gap: 1.5, mt: 2 }}>
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
              background: `linear-gradient(135deg, ${C.blue}, ${C.blueDark})`,
              boxShadow: `0 4px 20px ${C.blueGlow}`,
              "&:hover": {
                background: `linear-gradient(135deg, #60a5fa, ${C.blue})`,
                boxShadow: "0 6px 28px rgba(59,130,246,0.45)",
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
                borderColor: C.navyBorder, color: C.textMuted,
                border: `1px solid ${C.navyBorder}`,
                minWidth: "auto",
                "&:hover": { borderColor: C.rose, color: C.rose, bgcolor: "rgba(244,63,94,0.06)" },
              }}
            >
              Clear
            </Button>
          )}
        </Box>
      </Box>

      {/* Divider only when route exists */}
      {primaryRoute && <Box sx={{ height: 1, bgcolor: C.navyBorder, mx: 3, flexShrink: 0 }} />}

      {/* ── Results section — only rendered when route exists ─────────── */}
      <Box sx={{ px: 3, pt: 2.5, pb: 2 }}>
        {primaryRoute && (
          <>
            {/* Primary route card */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: C.cyan, boxShadow: `0 0 6px ${C.cyan}` }} />
              <Typography sx={{
                fontSize: "0.68rem", fontWeight: 600,
                letterSpacing: "0.12em", textTransform: "uppercase",
                color: C.textMuted, fontFamily: fonts.body,
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
                    color: C.textMuted, fontFamily: fonts.body,
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

            <Divider sx={{ borderColor: C.navyBorder, my: 2 }} />

            {/* Step 2 alternate input */}
            <AlternateRouteInput
              onCompare={onCompareAlternate}
              onClear={onClearAlternate}
              loading={loading}
              hasAlternate={!!alternateRoute}
            />
          </>
        )}

      </Box>

      {/* Empty state — outside results box so no padding leaks */}
      {!primaryRoute && !loading && (
        <Box sx={{ px: 3, pt: 2 }}>
          <Box sx={{
            border: `1px dashed ${C.navyBorder}`,
            borderRadius: "12px",
            p: 3, textAlign: "center",
          }}>
            <Box sx={{
              width: 48, height: 48, borderRadius: "14px",
              background: "rgba(34,211,238,0.07)",
              border: "1px solid rgba(34,211,238,0.12)",
              display: "flex", alignItems: "center", justifyContent: "center",
              mx: "auto", mb: 1.5,
            }}>
              <RouteOutlined sx={{ fontSize: 22, color: C.cyan }} />
            </Box>
            <Typography sx={{ fontSize: "0.82rem", color: C.textSub, fontWeight: 500, mb: 0.5 }}>
              Ready to Navigate
            </Typography>
            <Typography sx={{ fontSize: "0.72rem", color: C.textMuted, lineHeight: 1.6 }}>
              Enter source and destination to plot your optimal route
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 0.8, mt: 1.5 }}>
              {["Free Routing", "No API Key", "Autocomplete", "Split Compare"].map((f) => (
                <Chip key={f} label={f} size="small" sx={{
                  bgcolor: C.navyCard, border: `1px solid ${C.navyBorder}`,
                  color: C.textMuted, fontSize: "0.62rem", height: 20,
                  fontFamily: fonts.body,
                }} />
              ))}
            </Box>
          </Box>
        </Box>
      )}

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <Box sx={{
        px: 3, py: 1.8,
        borderTop: `1px solid ${C.navyBorder}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <Typography sx={{ fontSize: "0.62rem", color: C.textMuted }}>
          K.R. Mangalam University · Final Year Project
        </Typography>
        <Chip label="Step 4 / 5" size="small" sx={{
          bgcolor: "rgba(34,211,238,0.07)",
          border: "1px solid rgba(34,211,238,0.15)",
          color: C.cyan, fontSize: "0.6rem", height: 20,
          fontFamily: fonts.body, fontWeight: 600,
        }} />
      </Box>
    </Box>
  );
}