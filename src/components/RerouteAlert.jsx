// ─── components/RerouteAlert.jsx ─────────────────────────────────────────────
// Animated banner shown during off-route / recalculating / rerouted states

"use client";

import { useEffect, useState } from "react";
import { Box, Typography, Button, LinearProgress, Chip } from "@mui/material";
import {
  WarningAmberRounded, AutorenewRounded, CheckCircleOutlined,
  BlockOutlined, RouteOutlined, CloseRounded,
} from "@mui/icons-material";
import { C, fonts } from "../app/utils/theme";

// Config per status
const STATUS_CONFIG = {
  off_route: {
    icon:    WarningAmberRounded,
    color:   "#f59e0b",
    bg:      "rgba(245,158,11,0.1)",
    border:  "rgba(245,158,11,0.25)",
    title:   "Off Route",
    msg:     "You have deviated from the planned route.",
    showRecalc: true,
  },
  recalculating: {
    icon:    AutorenewRounded,
    color:   C.cyan,
    bg:      "rgba(34,211,238,0.08)",
    border:  "rgba(34,211,238,0.2)",
    title:   "Recalculating...",
    msg:     "Finding the best route from your current position.",
    spin:    true,
    showProgress: true,
  },
  rerouted: {
    icon:    CheckCircleOutlined,
    color:   "#22c55e",
    bg:      "rgba(34,197,94,0.08)",
    border:  "rgba(34,197,94,0.2)",
    title:   "Route Updated",
    msg:     "A new route has been calculated.",
  },
  blocked: {
    icon:    BlockOutlined,
    color:   C.rose,
    bg:      "rgba(244,63,94,0.08)",
    border:  "rgba(244,63,94,0.2)",
    title:   "Roadblock Reported",
    msg:     "Recalculating to avoid the blocked road.",
    showProgress: true,
  },
};

export default function RerouteAlert({
  status,           // "idle" | "off_route" | "recalculating" | "rerouted" | "blocked"
  distFromRoute,
  lastReroute,      // most recent reroute history entry
  onRecalculate,
  onDismiss,
}) {
  const [visible,  setVisible]  = useState(false);
  const [progress, setProgress] = useState(0);

  const cfg = STATUS_CONFIG[status];

  // Animate in/out
  useEffect(() => {
    if (status && status !== "idle") {
      setVisible(true);
      setProgress(0);
    } else {
      setVisible(false);
    }
  }, [status]);

  // Progress bar animation for recalculating
  useEffect(() => {
    if (status !== "recalculating" && status !== "blocked") return;
    setProgress(0);
    const t = setInterval(() => {
      setProgress(p => {
        if (p >= 95) { clearInterval(t); return 95; }
        return p + Math.random() * 15;
      });
    }, 200);
    return () => clearInterval(t);
  }, [status]);

  useEffect(() => {
    if (status === "rerouted") {
      setProgress(100);
    }
  }, [status]);

  if (!visible || !cfg) return null;

  const IconComp = cfg.icon;

  return (
    <Box sx={{
      position: "absolute",
      top: 16, left: "50%",
      transform: "translateX(-50%)",
      zIndex: 50,
      width: "min(420px, 90vw)",
      animation: "slideDown 0.3s cubic-bezier(0.34,1.56,0.64,1)",
      "@keyframes slideDown": {
        from: { opacity: 0, transform: "translateX(-50%) translateY(-20px)" },
        to:   { opacity: 1, transform: "translateX(-50%) translateY(0)" },
      },
    }}>
      <Box sx={{
        bgcolor: cfg.bg,
        border:  `1px solid ${cfg.border}`,
        borderRadius: "14px",
        backdropFilter: "blur(16px)",
        overflow: "hidden",
        boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${cfg.border}`,
      }}>
        {/* Progress bar at top */}
        {(cfg.showProgress || status === "rerouted") && (
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 3,
              bgcolor: "rgba(255,255,255,0.05)",
              "& .MuiLinearProgress-bar": { bgcolor: cfg.color },
            }}
          />
        )}

        <Box sx={{ p: 2, display: "flex", gap: 1.5, alignItems: "flex-start" }}>
          {/* Icon */}
          <Box sx={{
            width: 36, height: 36, borderRadius: "10px", flexShrink: 0,
            bgcolor: `${cfg.color}18`,
            border: `1px solid ${cfg.color}30`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <IconComp sx={{
              fontSize: 18, color: cfg.color,
              animation: cfg.spin ? "spin 1s linear infinite" : "none",
              "@keyframes spin": { from: { transform: "rotate(0deg)" }, to: { transform: "rotate(360deg)" } },
            }} />
          </Box>

          {/* Content */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.3 }}>
              <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, color: cfg.color, fontFamily: fonts.display }}>
                {cfg.title}
              </Typography>
              {status !== "recalculating" && (
                <Button
                  size="small" onClick={onDismiss}
                  sx={{ minWidth: "auto", p: 0.3, color: C.textMuted, "&:hover": { color: C.textSub } }}
                >
                  <CloseRounded sx={{ fontSize: 15 }} />
                </Button>
              )}
            </Box>

            <Typography sx={{ fontSize: "0.74rem", color: C.textMuted, fontFamily: fonts.body, mb: 1 }}>
              {cfg.msg}
            </Typography>

            {/* Extra info chips */}
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {status === "off_route" && distFromRoute > 0 && (
                <Chip
                  label={`${distFromRoute}m off route`}
                  size="small"
                  sx={{
                    bgcolor: "rgba(245,158,11,0.1)", color: "#f59e0b",
                    border: "1px solid rgba(245,158,11,0.2)",
                    fontSize: "0.65rem", height: 20, fontFamily: fonts.body,
                  }}
                />
              )}

              {status === "rerouted" && lastReroute && (
                <>
                  <Chip
                    icon={<RouteOutlined sx={{ fontSize: "11px !important" }} />}
                    label={`${lastReroute.newDist} km`}
                    size="small"
                    sx={{
                      bgcolor: "rgba(34,197,94,0.1)", color: "#4ade80",
                      border: "1px solid rgba(34,197,94,0.2)",
                      fontSize: "0.65rem", height: 20, fontFamily: fonts.body,
                      "& .MuiChip-icon": { color: "#4ade80" },
                    }}
                  />
                  <Chip
                    label={`${lastReroute.newDuration} min`}
                    size="small"
                    sx={{
                      bgcolor: "rgba(59,130,246,0.1)", color: C.blue,
                      border: "1px solid rgba(59,130,246,0.2)",
                      fontSize: "0.65rem", height: 20, fontFamily: fonts.body,
                    }}
                  />
                </>
              )}
            </Box>

            {/* Recalculate button */}
            {cfg.showRecalc && (
              <Button
                size="small"
                onClick={onRecalculate}
                sx={{
                  mt: 1, py: 0.6, px: 1.5,
                  textTransform: "none",
                  fontFamily: fonts.body, fontWeight: 600, fontSize: "0.75rem",
                  background: `linear-gradient(135deg, ${C.blue}, ${C.blueDark})`,
                  color: "#fff", borderRadius: "8px",
                  boxShadow: `0 3px 10px ${C.blueGlow}`,
                  "&:hover": { background: `linear-gradient(135deg, #60a5fa, ${C.blue})` },
                }}
                startIcon={<AutorenewRounded sx={{ fontSize: "14px !important" }} />}
              >
                Recalculate Route
              </Button>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}