// ─── components/TrafficPanel.jsx ─────────────────────────────────────────────
// Roadblock reporting + reroute history panel in sidebar

"use client";

import { useState } from "react";
import {
  Box, Typography, Button, IconButton, Chip,
  Collapse, Divider, CircularProgress,
} from "@mui/material";
import {
  WarningAmberRounded, BlockOutlined, DeleteOutlineRounded,
  HistoryRounded, AutorenewRounded, TrendingDownRounded,
  TrendingUpRounded, AddRoadRounded, ExpandMoreRounded,
  ExpandLessRounded, PlayArrowRounded,
} from "@mui/icons-material";
import { C, fonts } from "../app/utils/theme";
import PlaceAutocomplete from "./PlaceAutocomplete";

export default function TrafficPanel({
  roadblocks,
  rerouteHistory,
  rerouteStatus,
  distFromRoute,
  onReportRoadblock,
  onRemoveRoadblock,
  onSimulateOffRoute,
  onRecalculate,
}) {
  const [blockInput,      setBlockInput]      = useState("");
  const [reporting,       setReporting]       = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(true);
  const [panelExpanded,   setPanelExpanded]   = useState(true);

  const handleReport = async () => {
    if (!blockInput.trim()) return;
    setReporting(true);
    await onReportRoadblock(blockInput.trim());
    setBlockInput("");
    setReporting(false);
  };

  const isRecalculating = rerouteStatus === "recalculating";

  return (
    <Box sx={{ mt: 1 }}>
      {/* ── Section header ── */}
      <Box
        onClick={() => setPanelExpanded(p => !p)}
        sx={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          cursor: "pointer", mb: panelExpanded ? 1.5 : 0,
          "&:hover .label": { color: C.textSub },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <WarningAmberRounded sx={{ fontSize: 14, color: "#f59e0b" }} />
          <Typography className="label" sx={{
            fontSize: "0.68rem", fontWeight: 600,
            letterSpacing: "0.12em", textTransform: "uppercase",
            color: C.textMuted, fontFamily: fonts.body,
            transition: "color 0.15s",
          }}>
            Traffic & Rerouting
          </Typography>
          {roadblocks.length > 0 && (
            <Chip
              label={roadblocks.length}
              size="small"
              sx={{
                bgcolor: "rgba(244,63,94,0.12)", color: C.rose,
                border: "1px solid rgba(244,63,94,0.2)",
                fontSize: "0.6rem", height: 16, minWidth: 16,
                fontFamily: fonts.body, fontWeight: 700,
              }}
            />
          )}
        </Box>
        {panelExpanded
          ? <ExpandLessRounded sx={{ fontSize: 16, color: C.textMuted }} />
          : <ExpandMoreRounded  sx={{ fontSize: 16, color: C.textMuted }} />
        }
      </Box>

      <Collapse in={panelExpanded}>
        {/* ── Live status bar ── */}
        <Box sx={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          bgcolor: C.navyCard,
          border: `1px solid ${C.navyBorder}`,
          borderRadius: "10px",
          px: 1.5, py: 1, mb: 1.5,
        }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box sx={{
              width: 7, height: 7, borderRadius: "50%",
              bgcolor: rerouteStatus === "off_route"    ? "#f59e0b"
                     : rerouteStatus === "recalculating"? C.cyan
                     : rerouteStatus === "rerouted"     ? "#22c55e"
                     : rerouteStatus === "blocked"      ? C.rose
                     : "#334155",
              boxShadow: rerouteStatus !== "idle"
                ? `0 0 6px ${rerouteStatus === "off_route" ? "#f59e0b" : C.cyan}`
                : "none",
              transition: "all 0.3s",
            }} />
            <Typography sx={{ fontSize: "0.73rem", fontWeight: 600, color: C.textSub, fontFamily: fonts.body }}>
              {rerouteStatus === "idle"          ? "On Route"
               : rerouteStatus === "off_route"   ? "Off Route"
               : rerouteStatus === "recalculating"? "Recalculating..."
               : rerouteStatus === "rerouted"    ? "Route Updated"
               : "Roadblock Active"}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {distFromRoute > 0 && rerouteStatus === "off_route" && (
              <Typography sx={{ fontSize: "0.65rem", color: "#f59e0b", fontFamily: fonts.body }}>
                {distFromRoute}m off
              </Typography>
            )}
            {isRecalculating && <CircularProgress size={12} sx={{ color: C.cyan }} />}
          </Box>
        </Box>

        {/* ── Demo buttons ── */}
        <Box sx={{
          bgcolor: "rgba(34,211,238,0.03)",
          border: `1px dashed rgba(34,211,238,0.12)`,
          borderRadius: "10px",
          p: 1.5, mb: 1.5,
        }}>
          <Typography sx={{
            fontSize: "0.62rem", fontWeight: 600,
            letterSpacing: "0.1em", textTransform: "uppercase",
            color: C.textMuted, mb: 1, fontFamily: fonts.body,
          }}>
            Demo / Test
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              size="small"
              onClick={onSimulateOffRoute}
              disabled={isRecalculating}
              startIcon={<PlayArrowRounded sx={{ fontSize: "13px !important" }} />}
              sx={{
                flex: 1, py: 0.7, borderRadius: "8px",
                textTransform: "none", fontFamily: fonts.body,
                fontSize: "0.72rem", fontWeight: 600,
                bgcolor: "rgba(245,158,11,0.1)",
                color: "#f59e0b",
                border: "1px solid rgba(245,158,11,0.2)",
                "&:hover": { bgcolor: "rgba(245,158,11,0.18)" },
                "&:disabled": { opacity: 0.4 },
              }}
            >
              Simulate Off-Route
            </Button>
            <Button
              size="small"
              onClick={() => onRecalculate("manual")}
              disabled={isRecalculating}
              startIcon={<AutorenewRounded sx={{
                fontSize: "13px !important",
                animation: isRecalculating ? "spin 1s linear infinite" : "none",
                "@keyframes spin": { from: { transform: "rotate(0deg)" }, to: { transform: "rotate(360deg)" } },
              }} />}
              sx={{
                flex: 1, py: 0.7, borderRadius: "8px",
                textTransform: "none", fontFamily: fonts.body,
                fontSize: "0.72rem", fontWeight: 600,
                bgcolor: "rgba(59,130,246,0.1)",
                color: C.blue,
                border: `1px solid rgba(59,130,246,0.2)`,
                "&:hover": { bgcolor: "rgba(59,130,246,0.18)" },
                "&:disabled": { opacity: 0.4 },
              }}
            >
              Force Reroute
            </Button>
          </Box>
        </Box>

        {/* ── Report Roadblock ── */}
        <Box sx={{
          bgcolor: C.navyCard,
          border: `1px solid ${C.navyBorder}`,
          borderRadius: "10px",
          p: 1.5, mb: 1.5,
        }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mb: 1.2 }}>
            <BlockOutlined sx={{ fontSize: 13, color: C.rose }} />
            <Typography sx={{
              fontSize: "0.68rem", fontWeight: 600,
              color: C.textMuted, fontFamily: fonts.body,
              textTransform: "uppercase", letterSpacing: "0.08em",
            }}>
              Report Roadblock
            </Typography>
          </Box>

          <PlaceAutocomplete
            label=""
            value={blockInput}
            onChange={setBlockInput}
            onSelect={(s) => setBlockInput(s.plainName || s.shortName)}
            dotColor={C.rose}
            placeholder="e.g. Ring Road, Delhi"
            disabled={reporting || isRecalculating}
          />

          <Button
            fullWidth
            onClick={handleReport}
            disabled={!blockInput.trim() || reporting || isRecalculating}
            startIcon={reporting
              ? <CircularProgress size={12} color="inherit" />
              : <AddRoadRounded sx={{ fontSize: "14px !important" }} />
            }
            sx={{
              mt: 1, py: 0.9, borderRadius: "8px",
              textTransform: "none", fontFamily: fonts.body,
              fontWeight: 600, fontSize: "0.78rem",
              background: reporting ? "rgba(244,63,94,0.1)"
                : `linear-gradient(135deg, rgba(244,63,94,0.15), rgba(244,63,94,0.08))`,
              color: C.rose,
              border: `1px solid rgba(244,63,94,0.25)`,
              "&:hover": { bgcolor: "rgba(244,63,94,0.15)" },
              "&:disabled": { opacity: 0.4, color: C.rose },
            }}
          >
            {reporting ? "Reporting & Rerouting..." : "Report & Reroute"}
          </Button>
        </Box>

        {/* ── Active roadblocks ── */}
        {roadblocks.length > 0 && (
          <Box sx={{ mb: 1.5 }}>
            {roadblocks.map((block) => (
              <Box
                key={block.id}
                sx={{
                  display: "flex", alignItems: "center", gap: 1,
                  bgcolor: "rgba(244,63,94,0.05)",
                  border: "1px solid rgba(244,63,94,0.15)",
                  borderRadius: "8px",
                  px: 1.2, py: 0.8, mb: 0.6,
                }}
              >
                <BlockOutlined sx={{ fontSize: 12, color: C.rose, flexShrink: 0 }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{
                    fontSize: "0.75rem", color: C.textSub, fontWeight: 500,
                    fontFamily: fonts.body,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {block.location}
                  </Typography>
                  <Typography sx={{ fontSize: "0.62rem", color: C.textMuted, fontFamily: fonts.body }}>
                    Reported at {block.timestamp}
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  onClick={() => onRemoveRoadblock(block.id)}
                  sx={{ color: C.textMuted, width: 22, height: 22, "&:hover": { color: C.rose } }}
                >
                  <DeleteOutlineRounded sx={{ fontSize: 13 }} />
                </IconButton>
              </Box>
            ))}
          </Box>
        )}

        {/* ── Reroute history ── */}
        {rerouteHistory.length > 0 && (
          <>
            <Divider sx={{ borderColor: C.navyBorder, mb: 1.5 }} />
            <Box
              onClick={() => setHistoryExpanded(p => !p)}
              sx={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                cursor: "pointer", mb: historyExpanded ? 1 : 0,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                <HistoryRounded sx={{ fontSize: 13, color: C.textMuted }} />
                <Typography sx={{
                  fontSize: "0.67rem", fontWeight: 600,
                  letterSpacing: "0.1em", textTransform: "uppercase",
                  color: C.textMuted, fontFamily: fonts.body,
                }}>
                  Reroute History ({rerouteHistory.length})
                </Typography>
              </Box>
              {historyExpanded
                ? <ExpandLessRounded sx={{ fontSize: 14, color: C.textMuted }} />
                : <ExpandMoreRounded  sx={{ fontSize: 14, color: C.textMuted }} />
              }
            </Box>

            <Collapse in={historyExpanded}>
              {rerouteHistory.map((entry, i) => {
                const distDiff = parseFloat(entry.newDist) - parseFloat(entry.oldDist);
                const timeDiff = entry.newDuration - entry.oldDuration;
                const better   = distDiff <= 0;
                return (
                  <Box
                    key={entry.id}
                    sx={{
                      bgcolor: C.navyCard,
                      border: `1px solid ${C.navyBorder}`,
                      borderRadius: "8px",
                      px: 1.2, py: 1, mb: 0.6,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
                      <Typography sx={{
                        fontSize: "0.68rem", fontWeight: 600,
                        color: better ? "#4ade80" : "#f87171",
                        fontFamily: fonts.body,
                        display: "flex", alignItems: "center", gap: 0.4,
                      }}>
                        {better
                          ? <TrendingDownRounded sx={{ fontSize: 12 }} />
                          : <TrendingUpRounded   sx={{ fontSize: 12 }} />
                        }
                        {entry.reason === "roadblock" ? "Roadblock Avoid" : "Off-Route Fix"}
                      </Typography>
                      <Typography sx={{ fontSize: "0.6rem", color: C.textMuted, fontFamily: fonts.body }}>
                        {entry.timestamp}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", gap: 0.8 }}>
                      <Chip
                        label={`${entry.newDist} km`}
                        size="small"
                        sx={{
                          bgcolor: better ? "rgba(34,197,94,0.08)" : "rgba(248,113,113,0.08)",
                          color: better ? "#4ade80" : "#f87171",
                          fontSize: "0.62rem", height: 18, fontFamily: fonts.body,
                        }}
                      />
                      <Chip
                        label={`${entry.newDuration} min`}
                        size="small"
                        sx={{
                          bgcolor: "rgba(59,130,246,0.08)", color: C.blue,
                          fontSize: "0.62rem", height: 18, fontFamily: fonts.body,
                        }}
                      />
                      <Chip
                        label={`${distDiff > 0 ? "+" : ""}${distDiff.toFixed(1)} km`}
                        size="small"
                        sx={{
                          bgcolor: "rgba(255,255,255,0.03)", color: C.textMuted,
                          fontSize: "0.62rem", height: 18, fontFamily: fonts.body,
                        }}
                      />
                    </Box>
                  </Box>
                );
              })}
            </Collapse>
          </>
        )}
      </Collapse>
    </Box>
  );
}