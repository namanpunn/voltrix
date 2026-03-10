// ─── VerdictBanner.jsx ────────────────────────────────────────────────────────
// Shows a clear verdict after both primary and alternate routes are calculated.
// "Taking via X saves Y minutes" OR "Current route is Y minutes faster"
// Placed in Sidebar / MobileBottomSheet — never hidden by the map.
"use client";

import { Box, Typography, Button } from "@mui/material";
import {
  CheckCircleRounded,
  LightbulbRounded,
  ArrowForwardRounded,
} from "@mui/icons-material";
import { fonts } from "../app/utils/theme";

export default function VerdictBanner({
  primaryRoute,
  alternateRoute,
  onChoosePrimary,
  onChooseAlternate,
  isDark = true,
  T,
}) {
  if (!primaryRoute || !alternateRoute) return null;

  // ── Compute time difference ────────────────────────────────────────────────
  const diffSec   = primaryRoute.rawDuration - alternateRoute.rawDuration;
  const diffMin   = Math.round(Math.abs(diffSec) / 60);
  const altFaster = diffSec > 30;   // alternate saves >30 s
  const sametime  = Math.abs(diffSec) <= 30;
  const viaText   = alternateRoute.viaText || "alternate route";

  // ── Color palette ──────────────────────────────────────────────────────────
  const accent = altFaster ? "#4ade80" : sametime ? "#f59e0b" : "#22d3ee";
  const bg     = altFaster
    ? "rgba(34,197,94,0.07)"
    : sametime
    ? "rgba(245,158,11,0.07)"
    : "rgba(34,211,238,0.07)";
  const border = altFaster
    ? "rgba(34,197,94,0.22)"
    : sametime
    ? "rgba(245,158,11,0.22)"
    : "rgba(34,211,238,0.22)";

  // ── Human-readable verdict sentence ───────────────────────────────────────
  const verdict = sametime
    ? "Both routes take about the same time."
    : altFaster
    ? `Taking via ${viaText} saves ${diffMin} minute${diffMin !== 1 ? "s" : ""}.`
    : `Your current route is ${diffMin} minute${diffMin !== 1 ? "s" : ""} faster.`;

  return (
    <Box
      sx={{
        bgcolor: bg,
        border: `1px solid ${border}`,
        borderRadius: "14px",
        p: 1.8,
        mb: 1.5,
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0, left: 0, right: 0,
          height: "2px",
          background: `linear-gradient(90deg, ${accent}00, ${accent}, ${accent}00)`,
        },
      }}
    >
      {/* ── Verdict header ───────────────────────────────────────────────── */}
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, mb: 1.4 }}>
        <LightbulbRounded sx={{ fontSize: 15, color: accent, mt: 0.25, flexShrink: 0 }} />
        <Box>
          <Typography sx={{
            fontSize: "0.62rem", fontWeight: 700,
            letterSpacing: "0.12em", textTransform: "uppercase",
            color: accent, fontFamily: fonts.body, mb: 0.3,
          }}>
            Route Verdict
          </Typography>
          <Typography sx={{
            fontSize: "0.9rem", fontWeight: 700,
            color: isDark ? "#f1f5f9" : "#0f172a",
            fontFamily: fonts.body, lineHeight: 1.4,
          }}>
            {verdict}
          </Typography>
        </Box>
      </Box>

      {/* ── Time comparison strip ─────────────────────────────────────────── */}
      {!sametime && (
        <Box sx={{
          display: "flex", alignItems: "center",
          bgcolor: isDark ? "rgba(0,0,0,0.22)" : "rgba(0,0,0,0.05)",
          borderRadius: "10px", px: 1.5, py: 1, mb: 1.4,
          gap: 1,
        }}>
          {/* Current road */}
          <Box sx={{ flex: 1, textAlign: "center" }}>
            <Typography sx={{
              fontSize: "0.6rem", color: isDark ? "#64748b" : "#94a3b8",
              fontFamily: fonts.body, mb: 0.3,
            }}>
              Current road
            </Typography>
            <Typography sx={{
              fontSize: "1.15rem", fontWeight: 700, lineHeight: 1,
              color: !altFaster ? "#22d3ee" : isDark ? "#94a3b8" : "#64748b",
              fontFamily: fonts.body,
            }}>
              {primaryRoute.duration}
              <Box component="span" sx={{ fontSize: "0.62rem", fontWeight: 500, ml: 0.3 }}>min</Box>
            </Typography>
          </Box>

          <ArrowForwardRounded sx={{ fontSize: 13, color: isDark ? "#334155" : "#cbd5e1", flexShrink: 0 }} />

          {/* Alternate road */}
          <Box sx={{ flex: 1, textAlign: "center" }}>
            <Typography sx={{
              fontSize: "0.6rem", color: isDark ? "#64748b" : "#94a3b8",
              fontFamily: fonts.body, mb: 0.3,
            }}>
              Alternate road
            </Typography>
            <Typography sx={{
              fontSize: "1.15rem", fontWeight: 700, lineHeight: 1,
              color: altFaster ? "#4ade80" : isDark ? "#94a3b8" : "#64748b",
              fontFamily: fonts.body,
            }}>
              {alternateRoute.duration}
              <Box component="span" sx={{ fontSize: "0.62rem", fontWeight: 500, ml: 0.3 }}>min</Box>
            </Typography>
          </Box>
        </Box>
      )}

      {/* ── Action buttons ────────────────────────────────────────────────── */}
      <Box sx={{ display: "flex", gap: 1 }}>
        {altFaster ? (
          <>
            {/* Alternate is faster → primary CTA = use alternate */}
            <Button
              fullWidth
              onClick={onChooseAlternate}
              startIcon={<CheckCircleRounded sx={{ fontSize: "14px !important" }} />}
              sx={{
                py: 0.9, borderRadius: "9px",
                textTransform: "none", fontFamily: fonts.body,
                fontWeight: 600, fontSize: "0.76rem",
                background: "linear-gradient(135deg, #16a34a, #4ade80)",
                color: "#fff",
                boxShadow: "0 4px 14px rgba(34,197,94,0.3)",
                "&:hover": {
                  background: "linear-gradient(135deg, #15803d, #22c55e)",
                  boxShadow: "0 6px 20px rgba(34,197,94,0.45)",
                  transform: "translateY(-1px)",
                },
                transition: "all 0.2s",
              }}
            >
              Use Alternate Route
            </Button>
            <Button
              onClick={onChoosePrimary}
              sx={{
                py: 0.9, px: 1.5, borderRadius: "9px",
                textTransform: "none", fontFamily: fonts.body,
                fontWeight: 500, fontSize: "0.72rem",
                border: `1px solid ${isDark ? "#1e2d45" : "#cbd5e1"}`,
                color: isDark ? "#64748b" : "#475569",
                whiteSpace: "nowrap",
                "&:hover": { borderColor: "#94a3b8", color: isDark ? "#94a3b8" : "#334155" },
                transition: "all 0.2s",
              }}
            >
              Keep Current
            </Button>
          </>
        ) : sametime ? (
          <Button
            fullWidth
            onClick={onChoosePrimary}
            sx={{
              py: 0.9, borderRadius: "9px",
              textTransform: "none", fontFamily: fonts.body,
              fontWeight: 600, fontSize: "0.76rem",
              border: `1px solid rgba(245,158,11,0.3)`,
              color: "#f59e0b",
              "&:hover": { bgcolor: "rgba(245,158,11,0.08)", borderColor: "rgba(245,158,11,0.5)" },
              transition: "all 0.2s",
            }}
          >
            Keep Current Route
          </Button>
        ) : (
          <>
            {/* Primary is faster → primary CTA = keep current */}
            <Button
              fullWidth
              onClick={onChoosePrimary}
              startIcon={<CheckCircleRounded sx={{ fontSize: "14px !important" }} />}
              sx={{
                py: 0.9, borderRadius: "9px",
                textTransform: "none", fontFamily: fonts.body,
                fontWeight: 600, fontSize: "0.76rem",
                background: "linear-gradient(135deg, #0e7490, #22d3ee)",
                color: "#fff",
                boxShadow: "0 4px 14px rgba(34,211,238,0.25)",
                "&:hover": {
                  background: "linear-gradient(135deg, #0891b2, #06b6d4)",
                  boxShadow: "0 6px 20px rgba(34,211,238,0.4)",
                  transform: "translateY(-1px)",
                },
                transition: "all 0.2s",
              }}
            >
              Keep Current Route
            </Button>
            <Button
              onClick={onChooseAlternate}
              sx={{
                py: 0.9, px: 1.5, borderRadius: "9px",
                textTransform: "none", fontFamily: fonts.body,
                fontWeight: 500, fontSize: "0.72rem",
                border: `1px solid ${isDark ? "#1e2d45" : "#cbd5e1"}`,
                color: isDark ? "#64748b" : "#475569",
                whiteSpace: "nowrap",
                "&:hover": { borderColor: "#a78bfa", color: "#a78bfa" },
                transition: "all 0.2s",
              }}
            >
              Try Alternate
            </Button>
          </>
        )}
      </Box>
    </Box>
  );
}
