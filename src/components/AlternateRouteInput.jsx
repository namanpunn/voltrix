// ─── AlternateRouteInput.jsx ──────────────────────────────────────────────────
// "What if I go via X?" input component — Step 2

"use client";

import { useState } from "react";
import { Box, Typography, Button, Collapse, IconButton } from "@mui/material";
import {
  AutoAwesome, CompareArrows, Close, ArrowForward,
} from "@mui/icons-material";
import { C, getColors, fonts } from "../app/utils/theme";
import PlaceAutocomplete from "./PlaceAutocomplete";
import { useTheme } from "../app/context/ThemeContext";

const SUGGESTIONS = [
  "Qutub Minar Road",
  "Lodi Road",
  "Ring Road",
  "NH-48",
  "MG Road",
];

export default function AlternateRouteInput({ onCompare, onClear, loading, hasAlternate }) {
  const [viaText,  setViaText]  = useState("");
  const [expanded, setExpanded] = useState(false);
  const { isDark } = useTheme();
  const T = getColors(isDark);

  const handleCompare = () => {
    if (!viaText.trim()) return;
    onCompare(viaText.trim());
  };

  const handleClearAlt = () => {
    setViaText("");
    onClear?.();
  };

  return (
    <Box sx={{ mt: 1 }}>
      {/* ── Collapsed trigger ── */}
      {!expanded && !hasAlternate && (
        <Box
          onClick={() => setExpanded(true)}
          sx={{
            display: "flex", alignItems: "center", gap: 1.2,
            border: `1px dashed rgba(167,139,250,0.25)`,
            borderRadius: "10px",
            px: 1.5, py: 1.2,
            cursor: "pointer",
            transition: "all 0.2s",
            "&:hover": {
              borderColor: "rgba(167,139,250,0.5)",
              bgcolor: "rgba(167,139,250,0.05)",
            },
          }}
        >
          <Box sx={{
            width: 26, height: 26, borderRadius: "7px", flexShrink: 0,
            bgcolor: "rgba(167,139,250,0.1)",
            border: "1px solid rgba(167,139,250,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <AutoAwesome sx={{ fontSize: 13, color: "#a78bfa" }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: "0.8rem", fontWeight: 600, color: T.textSub, fontFamily: fonts.body }}>
              Compare alternate route
            </Typography>
            <Typography sx={{ fontSize: "0.68rem", color: T.textMuted }}>
              What if I go via a different road?
            </Typography>
          </Box>
          <ArrowForward sx={{ fontSize: 14, color: T.textMuted, ml: "auto" }} />
        </Box>
      )}

      {/* ── Expanded input ── */}
      <Collapse in={expanded && !hasAlternate}>
        <Box sx={{
          bgcolor: "rgba(167,139,250,0.04)",
          border: "1px solid rgba(167,139,250,0.18)",
          borderRadius: "12px",
          p: 2, mt: 0.5,
        }}>
          {/* Header */}
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CompareArrows sx={{ fontSize: 15, color: "#a78bfa" }} />
              <Typography sx={{
                fontSize: "0.72rem", fontWeight: 700,
                letterSpacing: "0.1em", textTransform: "uppercase",
                color: "#a78bfa", fontFamily: fonts.body,
              }}>
                Via Route
              </Typography>
            </Box>
            <IconButton
              size="small"
              onClick={() => { setExpanded(false); setViaText(""); }}
              sx={{ color: T.textMuted, width: 22, height: 22, "&:hover": { color: T.rose } }}
            >
              <Close sx={{ fontSize: 13 }} />
            </IconButton>
          </Box>

          {/* Autocomplete input */}
          <PlaceAutocomplete
            label="Via Road or Place"
            value={viaText}
            onChange={setViaText}
            onSelect={(s) => setViaText(s.shortName)}
            dotColor="#a78bfa"
            placeholder="e.g. Qutub Minar Road, Delhi"
            disabled={loading}
          />

          {/* Quick suggestion chips */}
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.8, mt: 1.5 }}>
            {SUGGESTIONS.map((s) => (
              <Box
                key={s}
                onClick={() => setViaText(s)}
                sx={{
                  fontSize: "0.65rem", fontWeight: 500,
                  color: viaText === s ? "#a78bfa" : T.textMuted,
                  bgcolor: viaText === s
                    ? "rgba(167,139,250,0.12)"
                    : "rgba(255,255,255,0.04)",
                  border: `1px solid ${viaText === s ? "rgba(167,139,250,0.3)" : T.navyBorder}`,
                  borderRadius: "6px",
                  px: 1, py: 0.4,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  fontFamily: fonts.body,
                  "&:hover": { borderColor: "rgba(167,139,250,0.3)", color: "#a78bfa" },
                }}
              >
                {s}
              </Box>
            ))}
          </Box>

          {/* Compare button */}
          <Button
            fullWidth
            onClick={handleCompare}
            disabled={loading || !viaText.trim()}
            sx={{
              mt: 1.5, py: 1.1,
              borderRadius: "9px",
              textTransform: "none",
              fontFamily: fonts.body,
              fontWeight: 600,
              fontSize: "0.83rem",
              background: "linear-gradient(135deg, #7c3aed, #a78bfa)",
              color: "#fff",
              boxShadow: "0 4px 16px rgba(124,58,237,0.3)",
              "&:hover": {
                background: "linear-gradient(135deg, #6d28d9, #8b5cf6)",
                boxShadow: "0 6px 24px rgba(124,58,237,0.45)",
              },
              "&:disabled": { opacity: 0.45, color: "#fff" },
              transition: "all 0.2s",
            }}
            startIcon={<CompareArrows sx={{ fontSize: "16px !important" }} />}
          >
            {loading ? "Calculating..." : "Compare in Split Screen"}
          </Button>
        </Box>
      </Collapse>

      {/* ── Active alternate indicator ── */}
      {hasAlternate && (
        <Box sx={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          bgcolor: "rgba(167,139,250,0.06)",
          border: "1px solid rgba(167,139,250,0.2)",
          borderRadius: "10px",
          px: 1.5, py: 1, mt: 0.5,
        }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "#a78bfa", boxShadow: "0 0 6px #a78bfa" }} />
            <Typography sx={{ fontSize: "0.75rem", color: "#a78bfa", fontWeight: 600, fontFamily: fonts.body }}>
              Split screen active
            </Typography>
          </Box>
          <Button
            size="small"
            onClick={handleClearAlt}
            sx={{
              textTransform: "none", fontSize: "0.7rem",
              color: T.textMuted, fontFamily: fonts.body,
              py: 0.3, px: 1, minWidth: "auto",
              "&:hover": { color: T.rose },
            }}
          >
            Exit split
          </Button>
        </Box>
      )}
    </Box>
  );
}