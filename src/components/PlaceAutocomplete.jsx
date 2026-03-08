// ─── PlaceAutocomplete.jsx ────────────────────────────────────────────────────
// Reusable input with Nominatim-powered autocomplete dropdown

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Box, Typography, CircularProgress, Paper,
} from "@mui/material";
import { LocationOn, Search, History, CloseRounded } from "@mui/icons-material";
import { C, getColors, fonts } from "../app/utils/theme";
import { fetchSuggestions } from "../app/hooks/useRoute";
import { useTheme } from "../app/context/ThemeContext";
import { useLocation } from "../app/context/LocationContext";

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

// ── Recent searches helpers ───────────────────────────────────────────────────
const RECENTS_KEY = "smartroute_recent_places";
const MAX_RECENTS = 5;

function getRecents() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RECENTS_KEY) || "[]");
  } catch { return []; }
}

function saveRecent(place) {
  const recents = getRecents().filter(r => r.shortName !== place.shortName);
  recents.unshift(place);
  localStorage.setItem(RECENTS_KEY, JSON.stringify(recents.slice(0, MAX_RECENTS)));
}

function clearRecents() {
  localStorage.removeItem(RECENTS_KEY);
}

export default function PlaceAutocomplete({
  label,
  value,
  onChange,          // (text) => void  — raw text change
  onSelect,          // (suggestion) => void — when user picks one
  onEnterPress,      // () => void — when Enter pressed without dropdown selection
  dotColor = C.cyan,
  placeholder = "Search a place...",
  disabled = false,
}) {
  const { isDark } = useTheme();
  const { userCoords } = useLocation();
  const T = getColors(isDark);
  const [suggestions,   setSuggestions]   = useState([]);
  const [recents,        setRecents]       = useState([]);
  const [showRecents,    setShowRecents]   = useState(false);
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
      const results = await fetchSuggestions(q, userCoords);
      setSuggestions(results);
      setOpen(results.length > 0);
      setActiveIdx(-1);
    } catch (_) {
      setSuggestions([]);
    } finally {
      setFetching(false);
    }
  }, [userCoords]);

  const debouncedFetch = useDebouncedCallback(doFetch, 350);

  // ── Handle text input ────────────────────────────────────────────────────
  const handleChange = (e) => {
    const v = e.target.value;
    onChange(v);
    if (v.trim().length < 3) {
      setSuggestions([]);
      // Show recents when text is short
      const r = getRecents();
      if (r.length > 0) { setRecents(r); setShowRecents(true); setOpen(true); }
      else { setShowRecents(false); setOpen(false); }
    } else {
      setShowRecents(false);
      debouncedFetch(v);
    }
  };

  // ── Keyboard navigation ──────────────────────────────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      if (open && activeIdx >= 0) {
        e.preventDefault();
        handleSelect(suggestions[activeIdx]);
      } else {
        e.preventDefault();
        setOpen(false);
        onEnterPress?.();
      }
      return;
    }
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  // ── Select a suggestion ──────────────────────────────────────────────────
  const handleSelect = (s) => {
    onChange(s.shortName);
    onSelect?.(s);
    saveRecent({ shortName: s.shortName, label: s.label || s.shortName, type: s.type || "place", placeId: s.placeId || Date.now() });
    setOpen(false);
    setShowRecents(false);
    setSuggestions([]);
    setActiveIdx(-1);
  };

  // ── Select a recent ──────────────────────────────────────────────────────
  const handleSelectRecent = (r) => {
    onChange(r.shortName);
    onSelect?.({ shortName: r.shortName, label: r.label });
    setOpen(false);
    setShowRecents(false);
    setActiveIdx(-1);
  };

  const handleClearRecents = (e) => {
    e.stopPropagation();
    clearRecents();
    setRecents([]);
    setShowRecents(false);
    setOpen(false);
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
        color: T.textMuted, mb: 0.8,
        fontFamily: fonts.body,
        transition: "color 0.4s ease",
      }}>
        {label}
      </Typography>

      {/* ── Input field ── */}
      <Box sx={{
        display: "flex", alignItems: "center", gap: 1.2,
        bgcolor: T.navyCard,
        border: `1px solid ${open ? dotColor : T.navyBorder}`,
        borderRadius: "10px",
        px: 1.5, py: 1.1,
        transition: "border-color 0.2s, box-shadow 0.2s, background-color 0.4s ease",
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
          onFocus={() => {
            if (suggestions.length > 0) { setOpen(true); return; }
            // Show recents on focus if input is empty/short
            if (value.trim().length < 3) {
              const r = getRecents();
              if (r.length > 0) { setRecents(r); setShowRecents(true); setOpen(true); }
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: T.textPrimary,
            fontSize: "0.85rem",
            fontFamily: fonts.body,
            caretColor: dotColor,
            transition: "color 0.4s ease",
          }}
        />

        {fetching
          ? <CircularProgress size={13} sx={{ color: dotColor, flexShrink: 0 }} />
          : <Search sx={{ fontSize: 15, color: T.textMuted, flexShrink: 0 }} />
        }
      </Box>

      {/* ── Dropdown — API suggestions ── */}
      {open && !showRecents && suggestions.length > 0 && (
        <Paper elevation={0} sx={{
          position: "absolute",
          top: "calc(100% + 6px)",
          left: 0, right: 0,
          zIndex: 1000,
          bgcolor: T.navyCard,
          border: `1px solid ${T.navyBorder}`,
          borderRadius: "12px",
          overflow: "hidden",
          boxShadow: isDark ? "0 16px 48px rgba(0,0,0,0.6)" : "0 16px 48px rgba(0,0,0,0.12)",
          maxHeight: 260,
          overflowY: "auto",
          "&::-webkit-scrollbar": { width: 4 },
          "&::-webkit-scrollbar-track": { bgcolor: "transparent" },
          "&::-webkit-scrollbar-thumb": { bgcolor: T.navyBorder, borderRadius: 2 },
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
                bgcolor: activeIdx === i ? T.navyCardHov : "transparent",
                borderBottom: i < suggestions.length - 1
                  ? `1px solid ${T.navyBorder}`
                  : "none",
                transition: "background 0.12s",
                "&:hover": { bgcolor: T.navyCardHov },
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
                <LocationOn sx={{ fontSize: 13, color: activeIdx === i ? dotColor : T.textMuted }} />
              </Box>

              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{
                  fontSize: "0.8rem", fontWeight: 500,
                  color: activeIdx === i ? T.textPrimary : T.textSub,
                  fontFamily: fonts.body,
                  lineHeight: 1.3,
                }}>
                  {s.shortName}
                </Typography>
                <Typography sx={{
                  fontSize: "0.67rem", color: T.textMuted,
                  fontFamily: fonts.body, lineHeight: 1.4, mt: 0.2,
                }}>
                  {truncate(s.label)}
                </Typography>
              </Box>

              <Box sx={{ ml: "auto", flexShrink: 0, display: "flex", alignItems: "center", gap: 0.6 }}>
                {s.dist != null && (
                  <Typography sx={{
                    fontSize: "0.58rem", fontWeight: 600,
                    color: T.textMuted, fontFamily: fonts.body,
                  }}>
                    {s.dist < 1 ? `${Math.round(s.dist * 1000)}m` : `${s.dist.toFixed(1)}km`}
                  </Typography>
                )}
                <Typography sx={{
                  fontSize: "0.58rem", fontWeight: 600,
                  letterSpacing: "0.07em", textTransform: "uppercase",
                  color: activeIdx === i ? dotColor : T.textMuted,
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

      {/* ── Dropdown — Recent searches ── */}
      {open && showRecents && recents.length > 0 && (
        <Paper elevation={0} sx={{
          position: "absolute",
          top: "calc(100% + 6px)",
          left: 0, right: 0,
          zIndex: 1000,
          bgcolor: T.navyCard,
          border: `1px solid ${T.navyBorder}`,
          borderRadius: "12px",
          overflow: "hidden",
          boxShadow: isDark ? "0 16px 48px rgba(0,0,0,0.6)" : "0 16px 48px rgba(0,0,0,0.12)",
        }}>
          {/* Header */}
          <Box sx={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            px: 1.5, py: 0.8,
            borderBottom: `1px solid ${T.navyBorder}`,
          }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.7 }}>
              <History sx={{ fontSize: 12, color: T.textMuted }} />
              <Typography sx={{ fontSize: "0.62rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: T.textMuted, fontFamily: fonts.body }}>
                Recent Searches
              </Typography>
            </Box>
            <Box
              onMouseDown={handleClearRecents}
              sx={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 0.3, "&:hover .clear-text": { color: "#e11d48" } }}
            >
              <Typography className="clear-text" sx={{ fontSize: "0.6rem", color: T.textMuted, fontFamily: fonts.body, transition: "color 0.15s" }}>
                Clear all
              </Typography>
            </Box>
          </Box>

          {/* Recent items */}
          {recents.map((r, i) => (
            <Box
              key={r.shortName + i}
              onMouseDown={() => handleSelectRecent(r)}
              onMouseEnter={() => setActiveIdx(i)}
              sx={{
                display: "flex", alignItems: "center", gap: 1.2,
                px: 1.5, py: 1,
                cursor: "pointer",
                bgcolor: activeIdx === i ? T.navyCardHov : "transparent",
                borderBottom: i < recents.length - 1 ? `1px solid ${T.navyBorder}` : "none",
                transition: "background 0.12s",
                "&:hover": { bgcolor: T.navyCardHov },
              }}
            >
              <Box sx={{
                width: 24, height: 24, borderRadius: "6px", flexShrink: 0,
                bgcolor: "rgba(255,255,255,0.04)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <History sx={{ fontSize: 12, color: T.textMuted }} />
              </Box>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography sx={{ fontSize: "0.8rem", fontWeight: 500, color: T.textSub, fontFamily: fonts.body, lineHeight: 1.3 }}>
                  {r.shortName}
                </Typography>
              </Box>
            </Box>
          ))}
        </Paper>
      )}
    </Box>
  );
}