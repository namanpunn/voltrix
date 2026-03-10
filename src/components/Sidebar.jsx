// ─── Sidebar.jsx ─────────────────────────────────────────────────────────────
"use client";

import { useState, useEffect } from "react";
import { Box, Typography, IconButton, Button, Chip, Divider } from "@mui/material";
import {
  Navigation, ArrowBack, SwapVert, Directions,
  RouteOutlined, TrendingFlat,
} from "@mui/icons-material";
import { CircularProgress } from "@mui/material";
import Link from "next/link";
import { C, fonts, getColors } from "../app/utils/theme";
import PlaceAutocomplete from "./PlaceAutocomplete";
import RouteInfoCard from "./RouteInfoCard";
import AlternateRouteInput from "./AlternateRouteInput";
import VerdictBanner from "./VerdictBanner";

const EXAMPLE_ROUTES = [
  { from: "Connaught Place", to: "India Gate" },
  { from: "IGI Airport T3", to: "Cyber City, Gurugram" },
  { from: "Hauz Khas", to: "Lajpat Nagar" },
  { from: "Karol Bagh", to: "Chandni Chowk" },
];

const FEATURES = [
  { label: "Smart Routing", color: "#22d3ee" },
  { label: "Route Compare", color: "#a78bfa" },
  { label: "Live Rerouting", color: "#4ade80" },
];

function SidebarPlaceholder({ T }) {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx(i => (i + 1) % EXAMPLE_ROUTES.length);
        setVisible(true);
      }, 400);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const route = EXAMPLE_ROUTES[idx];

  return (
    <Box sx={{ px: 2.5, pt: 2, pb: 2.5, display: "flex", flexDirection: "column", gap: 1.5 }}>

      {/* ── Main card ──────────────────────────────────────────────── */}
      <Box sx={{
        border: `1px solid ${T.navyBorder}`,
        borderRadius: "14px",
        p: 2.5,
        textAlign: "center",
        background: `linear-gradient(160deg, rgba(34,211,238,0.04) 0%, rgba(99,102,241,0.04) 100%)`,
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0, left: 0, right: 0,
          height: "1px",
          background: "linear-gradient(90deg, transparent, rgba(34,211,238,0.4), transparent)",
        },
      }}>
        {/* Icon */}
        <Box sx={{
          width: 52, height: 52, borderRadius: "16px",
          background: "linear-gradient(135deg, rgba(34,211,238,0.15), rgba(99,102,241,0.15))",
          border: "1px solid rgba(34,211,238,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          mx: "auto", mb: 1.8,
          boxShadow: "0 0 24px rgba(34,211,238,0.12)",
        }}>
          <RouteOutlined sx={{ fontSize: 24, color: T.cyan }} />
        </Box>

        <Typography sx={{
          fontSize: "0.92rem", color: T.textPrimary,
          fontWeight: 700, mb: 0.5, fontFamily: fonts.display,
          letterSpacing: "-0.01em",
        }}>
          Ready to Navigate
        </Typography>
        <Typography sx={{ fontSize: "0.72rem", color: T.textMuted, lineHeight: 1.7, mb: 2 }}>
          Enter a source and destination above to calculate your optimal route with real-time comparison.
        </Typography>

        {/* Animated example route */}
        <Box sx={{
          bgcolor: "rgba(34,211,238,0.05)",
          border: "1px solid rgba(34,211,238,0.12)",
          borderRadius: "10px",
          px: 1.5, py: 1,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 1,
          transition: "opacity 0.4s ease",
          opacity: visible ? 1 : 0,
          minHeight: 36,
        }}>
          <Typography sx={{ fontSize: "0.68rem", color: T.cyan, fontWeight: 600, fontFamily: fonts.body }}>
            {route.from}
          </Typography>
          <TrendingFlat sx={{ fontSize: 14, color: "rgba(34,211,238,0.5)" }} />
          <Typography sx={{ fontSize: "0.68rem", color: T.textSub, fontWeight: 500, fontFamily: fonts.body }}>
            {route.to}
          </Typography>
        </Box>
        <Typography sx={{ fontSize: "0.6rem", color: T.textMuted, mt: 0.8, opacity: 0.6 }}>
          example route
        </Typography>
      </Box>

      {/* ── Feature pills ───────────────────────────────────────────── */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.8 }}>
        {FEATURES.map(({ label, color }) => (
          <Box key={label} sx={{
            display: "flex", alignItems: "center", gap: 0.6,
            px: 1.2, py: 0.5,
            borderRadius: "8px",
            bgcolor: `${color}0d`,
            border: `1px solid ${color}22`,
          }}>
            <Box sx={{ width: 5, height: 5, borderRadius: "50%", bgcolor: color, boxShadow: `0 0 6px ${color}` }} />
            <Typography sx={{ fontSize: "0.62rem", color, fontWeight: 600, fontFamily: fonts.body, letterSpacing: "0.04em" }}>
              {label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export default function Sidebar({
  source, setSource,
  destination, setDestination,
  onGetRoute,
  onSwap,
  onClear,
  onCompareAlternate,
  onClearAlternate,
  onChoosePrimary,
  onChooseAlternate,
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
  isDark = true,
}) {
  const T = getColors(isDark);
  return (
    <Box sx={{
      width: 380, minWidth: 380,
      height: "100vh",
      display: "flex", flexDirection: "column",
      bgcolor: T.navyLight,
      borderRight: `1px solid ${T.navyBorder}`,
      zIndex: 10,
      overflow: "hidden",
      transition: "background-color 0.4s ease, border-color 0.4s ease",
    }}>

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <Box sx={{
        px: 2.5, py: 2,
        borderBottom: `1px solid ${T.navyBorder}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: `linear-gradient(180deg, ${T.navyLight} 0%, ${T.navyLight} 100%)`,
        flexShrink: 0,
        transition: "background 0.4s ease, border-color 0.4s ease",
      }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{
            width: 36, height: 36, borderRadius: "10px",
            background: `linear-gradient(135deg, ${T.cyan}, ${T.blue || C.blue})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 0 16px ${T.cyanGlow}`,
          }}>
            <Navigation sx={{ fontSize: 18, color: "#fff" }} />
          </Box>
          <Box>
            <Typography sx={{ fontFamily: fonts.display, fontWeight: 700, fontSize: "1rem", color: T.textPrimary, lineHeight: 1, transition: "color 0.4s ease" }}>
              SmartRoute
            </Typography>
            <Typography sx={{ fontSize: "0.68rem", color: T.textMuted, mt: 0.2, transition: "color 0.4s ease" }}>
              Vision Navigation System
            </Typography>
          </Box>
        </Box>
        <Link href="/" passHref>
          <IconButton size="small" sx={{
            color: T.textMuted, border: `1px solid ${T.navyBorder}`,
            borderRadius: "8px", width: 32, height: 32,
            "&:hover": { borderColor: T.cyan, color: T.cyan, bgcolor: T.cyanGlow },
          }}>
            <ArrowBack sx={{ fontSize: 16 }} />
          </IconButton>
        </Link>
      </Box>

      {/* ── Scrollable content area ─────────────────────────────────── */}
      <Box sx={{
        flex: 1, minHeight: 0,
        overflowY: "auto", overflowX: "hidden",
        "&::-webkit-scrollbar": { width: 4 },
        "&::-webkit-scrollbar-track": { bgcolor: "transparent" },
        "&::-webkit-scrollbar-thumb": { bgcolor: T.navyBorder, borderRadius: 2 },
      }}>

      {/* ── Route Planner ───────────────────────────────────────────────── */}
      <Box sx={{ px: 2.5, pt: 2.5, pb: 1.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
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
          onChange={(v) => { setSource(v); }}
          onSelect={(s) => setSource(s.shortName)}
          onEnterPress={onGetRoute}
          dotColor={T.cyan}
          placeholder="e.g. Connaught Place, Delhi"
          disabled={loading}
        />

        {/* Swap row */}
        <Box sx={{ display: "flex", alignItems: "center", my: 1.2, pl: 0.5 }}>
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
          onEnterPress={onGetRoute}
          dotColor={T.rose}
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
              background: `linear-gradient(135deg, ${T.blue || C.blue}, ${T.blueDark || C.blueDark})`,
              boxShadow: `0 4px 20px ${T.blueGlow || C.blueGlow}`,
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
                borderColor: C.navyBorder, color: T.textMuted,
                border: `1px solid ${T.navyBorder}`,
                minWidth: "auto",
                "&:hover": { borderColor: T.rose, color: T.rose, bgcolor: "rgba(244,63,94,0.06)" },
              }}
            >
              Clear
            </Button>
          )}
        </Box>
      </Box>

      {/* Divider only when route exists */}
      {primaryRoute && <Divider sx={{ borderColor: T.navyBorder, mx: 2.5 }} />}

      {/* ── Results section — only rendered when route exists ─────────── */}
      {primaryRoute && (
      <Box sx={{ px: 2.5, pt: 2, pb: 2 }}>
          <>
            {/* Primary route card */}
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

                  {/* ── Verdict + action buttons ─────────────────────────────── */}
                  <VerdictBanner
                    primaryRoute={primaryRoute}
                    alternateRoute={alternateRoute}
                    onChoosePrimary={onChoosePrimary}
                    onChooseAlternate={onChooseAlternate}
                    isDark={isDark}
                    T={T}
                  />
              </>
            )}

            <Divider sx={{ borderColor: T.navyBorder, my: 2 }} />

            {/* Step 2 alternate input */}
            <AlternateRouteInput
              onCompare={onCompareAlternate}
              onClear={onClearAlternate}
              loading={loading}
              hasAlternate={!!alternateRoute}
            />
          </>
      </Box>
      )}

      {!primaryRoute && !loading && (
        <SidebarPlaceholder T={T} />
      )}

      </Box>{/* end scrollable content */}

    </Box>
  );
}