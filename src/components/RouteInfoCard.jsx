// ─── RouteInfoCard.jsx ────────────────────────────────────────────────────────
"use client";

import { Box, Typography, Paper, Divider, Chip } from "@mui/material";
import {
  StraightenOutlined, AccessTime,
  TrendingUp, TrendingDown, TrendingFlat,
} from "@mui/icons-material";
import { C, getColors, fonts } from "../app/utils/theme";
import { useTheme } from "../app/context/ThemeContext";

// Metric tile
function MetricTile({ icon, value, unit, label, color, T }) {
  return (
    <Box sx={{
      flex: 1,
      bgcolor: `rgba(${color === T.cyan ? "34,211,238" : "59,130,246"},0.06)`,
      border: `1px solid rgba(${color === T.cyan ? "34,211,238" : "59,130,246"},0.14)`,
      borderRadius: "10px",
      p: { xs: 1, sm: 1.5 },
      display: "flex", flexDirection: "column", alignItems: "center", gap: 0.3,
      transition: "background-color 0.4s ease, border-color 0.4s ease",
      minWidth: 0,
    }}>
      {icon}
      <Typography sx={{
        fontSize: { xs: "0.9rem", sm: "1.05rem" }, fontWeight: 700,
        color, fontFamily: fonts.display, lineHeight: 1,
      }}>
        {value}
      </Typography>
      <Typography sx={{ fontSize: "0.6rem", color: T.textMuted, letterSpacing: "0.06em" }}>
        {unit}
      </Typography>
      <Typography sx={{ fontSize: "0.65rem", color: T.textMuted }}>
        {label}
      </Typography>
    </Box>
  );
}

// Comparison badge for split screen
function DiffBadge({ primaryVal, altVal, lowerIsBetter = true, T }) {
  const pVal = parseFloat(primaryVal) || 0;
  const aVal = parseFloat(altVal) || 0;
  const diff = aVal - pVal;
  const pct  = pVal !== 0 ? Math.abs((diff / pVal) * 100).toFixed(0) : "0";
  if (Math.abs(diff) < 0.01) return (
    <Chip icon={<TrendingFlat sx={{ fontSize: "12px !important" }} />}
      label="Same" size="small"
      sx={{ bgcolor: "rgba(100,116,139,0.15)", color: T.textMuted, fontSize: "0.65rem", height: 20 }} />
  );
  const better = lowerIsBetter ? diff < 0 : diff > 0;
  return (
    <Chip
      icon={better
        ? <TrendingDown sx={{ fontSize: "12px !important" }} />
        : <TrendingUp  sx={{ fontSize: "12px !important" }} />}
      label={`${better ? "-" : "+"}${pct}%`}
      size="small"
      sx={{
        bgcolor: better ? "rgba(34,197,94,0.12)" : "rgba(244,63,94,0.12)",
        color:   better ? "#4ade80" : "#f87171",
        border:  `1px solid ${better ? "rgba(34,197,94,0.2)" : "rgba(244,63,94,0.2)"}`,
        fontSize: "0.65rem", height: 20,
        fontWeight: 700,
        "& .MuiChip-icon": { color: "inherit" },
      }}
    />
  );
}

export default function RouteInfoCard({ route, compareRoute = null, variant = "primary" }) {
  if (!route) return null;
  const { isDark } = useTheme();
  const T = getColors(isDark);

  const isAlt    = variant === "alternate";
  const accentClr = isAlt ? "#a78bfa" : T.cyan;

  return (
    <Paper elevation={0} sx={{
      bgcolor: T.navyCard,
      border: `1px solid ${isAlt ? "rgba(167,139,250,0.2)" : T.navyBorder}`,
      borderRadius: "12px",
      p: 2, mb: 1.5,
      position: "relative",
      overflow: "hidden",
      transition: "background-color 0.4s ease, border-color 0.4s ease",
      "&::before": {
        content: '""',
        position: "absolute",
        top: 0, left: 0, right: 0,
        height: "2px",
        background: isAlt
          ? "linear-gradient(90deg, #a78bfa, #7c3aed)"
          : `linear-gradient(90deg, ${T.cyan}, ${T.blue})`,
      },
    }}>
      {/* Route path */}
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mb: 1.5 }}>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", pt: 0.4 }}>
          <Box sx={{ width: 9, height: 9, borderRadius: "50%", bgcolor: accentClr, boxShadow: `0 0 7px ${accentClr}` }} />
          <Box sx={{ width: 1.5, height: 24, bgcolor: T.navyBorder, my: 0.3 }} />
          {isAlt && route.viaText && (
            <>
              <Box sx={{ width: 7, height: 7, borderRadius: "2px", bgcolor: "#a78bfa", transform: "rotate(45deg)", my: 0.2 }} />
              <Box sx={{ width: 1.5, height: 24, bgcolor: T.navyBorder, my: 0.3 }} />
            </>
          )}
          <Box sx={{ width: 9, height: 9, borderRadius: "50%", bgcolor: C.rose, boxShadow: `0 0 7px ${C.rose}` }} />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{
            fontSize: "0.8rem", color: T.textSub, fontWeight: 500,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {route.fromText}
          </Typography>

          {isAlt && route.viaText && (
            <Box sx={{
              my: 0.6, px: 1, py: 0.3,
              bgcolor: "rgba(167,139,250,0.08)",
              border: "1px solid rgba(167,139,250,0.18)",
              borderRadius: "6px", display: "inline-flex", alignItems: "center", gap: 0.5,
            }}>
              <Typography sx={{ fontSize: "0.68rem", color: "#a78bfa", fontWeight: 600 }}>
                via
              </Typography>
              <Typography sx={{ fontSize: "0.72rem", color: T.textSub }}>
                {route.viaText}
              </Typography>
            </Box>
          )}

          <Typography sx={{
            fontSize: "0.8rem", color: T.textSub, fontWeight: 500,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            mt: isAlt && route.viaText ? 0.6 : 2,
          }}>
            {route.toText}
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: T.navyBorder, mb: 1.5 }} />

      {/* Metrics */}
      <Box sx={{ display: "flex", gap: 1.5, mb: compareRoute ? 1.5 : 0 }}>
        <MetricTile
          icon={<StraightenOutlined sx={{ fontSize: 15, color: accentClr }} />}
          value={route.distance}
          unit="KM"
          label="Distance"
          color={accentClr}
          T={T}
        />
        <MetricTile
          icon={<AccessTime sx={{ fontSize: 15, color: T.blue }} />}
          value={route.duration}
          unit="MIN"
          label="Duration"
          color={T.blue}
          T={T}
        />
      </Box>

      {/* Comparison badges (only on alternate card) */}
      {compareRoute && isAlt && (
        <Box sx={{
          display: "flex", gap: 1, alignItems: "center",
          bgcolor: "rgba(255,255,255,0.02)",
          border: `1px solid ${T.navyBorder}`,
          borderRadius: "8px",
          px: 1.2, py: 0.8,
        }}>
          <Typography sx={{ fontSize: "0.65rem", color: T.textMuted, mr: 0.5 }}>
            vs primary:
          </Typography>
          <DiffBadge primaryVal={compareRoute.distance} altVal={route.distance} lowerIsBetter T={T} />
          <DiffBadge primaryVal={compareRoute.duration} altVal={route.duration} lowerIsBetter T={T} />
        </Box>
      )}
    </Paper>
  );
}