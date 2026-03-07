// ─── PlaceAutocomplete.jsx ────────────────────────────────────────────────────
// Reusable input with Nominatim-powered autocomplete dropdown

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Box, Typography, CircularProgress, Paper,
} from "@mui/material";
import { LocationOn, Search } from "@mui/icons-material";
import { C, darkInputSx, fonts } from "../app/utils/theme";
import { fetchSuggestions } from "../app/hooks/useRoute";

// Debounce helper
function useDebouncedCallback(fn, delay) {
  const timer = useRef(null);
  return useCallback((...args) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => fn(...args), delay);
  }, [fn, delay]);
}

// Place type → short readable label
function placeTypeLabel(type) {
  const map = {
    city: "City", town: "Town", village: "Village",
    road: "Road", residential: "Road", suburb: "Area",
    neighbourhood: "Area", amenity: "Place", landmark: "Landmark",
  };
  return map[type] || "Place";
}

export default function PlaceAutocomplete({
  label,
  value,
  onChange,          // (text) => void  — raw text change
  onSelect,          // (suggestion) => void — when user picks one
  dotColor = C.cyan,
  placeholder = "Search a place...",
  disabled = false,
}) {
  const [suggestions,   setSuggestions]   = useState([]);
  const [open,          setOpen]          = useState(false);
  const [fetching,      setFetching]      = useState(false);
  const [activeIdx,     setActiveIdx]     = useState(-1);
  const containerRef = useRef(null);
  const inputRef     = useRef(null);

  // ── Fetch suggestions debounced ─────────────────────────────────────────
  const doFetch = useCallback(async (q) => {
    if (q.trim().length < 3) { setSuggestions([]); setOpen(false); return; }
    setFetching(true);
    try {
      const results = await fetchSuggestions(q);
      setSuggestions(results);
      setOpen(results.length > 0);
      setActiveIdx(-1);
    } catch (_) {
      setSuggestions([]);
    } finally {
      setFetching(false);
    }
  }, []);

  const debouncedFetch = useDebouncedCallback(doFetch, 350);

  // ── Handle text input ────────────────────────────────────────────────────
  const handleChange = (e) => {
    const v = e.target.value;
    onChange(v);
    debouncedFetch(v);
  };

  // ── Keyboard navigation ──────────────────────────────────────────────────
  const handleKeyDown = (e) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeIdx]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  // ── Select a suggestion ──────────────────────────────────────────────────
  const handleSelect = (s) => {
    onChange(s.shortName);
    onSelect?.(s);
    setOpen(false);
    setSuggestions([]);
    setActiveIdx(-1);
  };

  // ── Close on outside click ───────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Truncate long suggestion labels
  const truncate = (str, n = 55) => str.length > n ? str.slice(0, n) + "…" : str;

  return (
    <Box ref={containerRef} sx={{ position: "relative", width: "100%" }}>
      {/* ── Label ── */}
      <Typography sx={{
        fontSize: "0.68rem", fontWeight: 600,
        letterSpacing: "0.08em", textTransform: "uppercase",
        color: C.textMuted, mb: 0.8,
        fontFamily: fonts.body,
      }}>
        {label}
      </Typography>

      {/* ── Input field ── */}
      <Box sx={{
        display: "flex", alignItems: "center", gap: 1.2,
        bgcolor: C.navyCard,
        border: `1px solid ${open ? dotColor : C.navyBorder}`,
        borderRadius: "10px",
        px: 1.5, py: 1.1,
        transition: "border-color 0.2s, box-shadow 0.2s",
        boxShadow: open ? `0 0 0 3px rgba(34,211,238,0.08)` : "none",
        "&:hover": { borderColor: "rgba(34,211,238,0.35)" },
        cursor: disabled ? "not-allowed" : "text",
        opacity: disabled ? 0.5 : 1,
      }}
        onClick={() => !disabled && inputRef.current?.focus()}
      >
        {/* Dot indicator */}
        <Box sx={{
          width: 9, height: 9, borderRadius: "50%", flexShrink: 0,
          bgcolor: dotColor,
          boxShadow: `0 0 7px ${dotColor}`,
        }} />

        <input
          ref={inputRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: C.textPrimary,
            fontSize: "0.85rem",
            fontFamily: fonts.body,
            caretColor: dotColor,
          }}
        />

        {fetching
          ? <CircularProgress size={13} sx={{ color: dotColor, flexShrink: 0 }} />
          : <Search sx={{ fontSize: 15, color: C.textMuted, flexShrink: 0 }} />
        }
      </Box>

      {/* ── Dropdown ── */}
      {open && suggestions.length > 0 && (
        <Paper elevation={0} sx={{
          position: "absolute",
          top: "calc(100% + 6px)",
          left: 0, right: 0,
          zIndex: 1000,
          bgcolor: C.navyCard,
          border: `1px solid ${C.navyBorder}`,
          borderRadius: "12px",
          overflow: "hidden",
          boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
          maxHeight: 260,
          overflowY: "auto",
          "&::-webkit-scrollbar": { width: 4 },
          "&::-webkit-scrollbar-track": { bgcolor: "transparent" },
          "&::-webkit-scrollbar-thumb": { bgcolor: C.navyBorder, borderRadius: 2 },
        }}>
          {suggestions.map((s, i) => (
            <Box
              key={s.placeId}
              onMouseDown={() => handleSelect(s)}
              onMouseEnter={() => setActiveIdx(i)}
              sx={{
                display: "flex", alignItems: "flex-start", gap: 1.2,
                px: 1.5, py: 1.1,
                cursor: "pointer",
                bgcolor: activeIdx === i ? C.navyCardHov : "transparent",
                borderBottom: i < suggestions.length - 1
                  ? `1px solid ${C.navyBorder}`
                  : "none",
                transition: "background 0.12s",
                "&:hover": { bgcolor: C.navyCardHov },
              }}
            >
              <Box sx={{
                width: 26, height: 26, borderRadius: "7px", flexShrink: 0,
                bgcolor: activeIdx === i
                  ? `rgba(34,211,238,0.12)`
                  : "rgba(255,255,255,0.04)",
                display: "flex", alignItems: "center", justifyContent: "center",
                mt: 0.1,
              }}>
                <LocationOn sx={{ fontSize: 13, color: activeIdx === i ? dotColor : C.textMuted }} />
              </Box>

              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{
                  fontSize: "0.8rem", fontWeight: 500,
                  color: activeIdx === i ? C.textPrimary : C.textSub,
                  fontFamily: fonts.body,
                  lineHeight: 1.3,
                }}>
                  {s.shortName}
                </Typography>
                <Typography sx={{
                  fontSize: "0.67rem", color: C.textMuted,
                  fontFamily: fonts.body, lineHeight: 1.4, mt: 0.2,
                }}>
                  {truncate(s.label)}
                </Typography>
              </Box>

              <Box sx={{ ml: "auto", flexShrink: 0 }}>
                <Typography sx={{
                  fontSize: "0.58rem", fontWeight: 600,
                  letterSpacing: "0.07em", textTransform: "uppercase",
                  color: activeIdx === i ? dotColor : C.textMuted,
                  bgcolor: activeIdx === i
                    ? `rgba(34,211,238,0.1)`
                    : "rgba(255,255,255,0.04)",
                  px: 0.8, py: 0.3, borderRadius: "5px",
                }}>
                  {placeTypeLabel(s.type)}
                </Typography>
              </Box>
            </Box>
          ))}
        </Paper>
      )}
    </Box>
  );
}