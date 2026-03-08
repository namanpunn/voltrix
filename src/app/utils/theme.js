// ─── Shared design tokens ─────────────────────────────────────────────────────
// Matches the hero page dark navy / cyan aesthetic

export const C = {
  navy:        "#0a0f1e",
  navyLight:   "#0d1528",
  navyCard:    "#111827",
  navyCardHov: "#141f35",
  navyBorder:  "#1e2d45",
  cyan:        "#22d3ee",
  cyanDark:    "#06b6d4",
  cyanGlow:    "rgba(34,211,238,0.15)",
  blue:        "#3b82f6",
  blueDark:    "#2563eb",
  blueGlow:    "rgba(59,130,246,0.25)",
  rose:        "#f43f5e",
  green:       "#22c55e",
  textPrimary: "#f1f5f9",
  textSub:     "#94a3b8",
  textMuted:   "#64748b",
};

// Light mode color tokens
export const CLight = {
  navy:        "#f8fafc",
  navyLight:   "#ffffff",
  navyCard:    "#f1f5f9",
  navyCardHov: "#e2e8f0",
  navyBorder:  "#cbd5e1",
  cyan:        "#0891b2",
  cyanDark:    "#0e7490",
  cyanGlow:    "rgba(8,145,178,0.12)",
  blue:        "#2563eb",
  blueDark:    "#1d4ed8",
  blueGlow:    "rgba(37,99,235,0.2)",
  rose:        "#e11d48",
  green:       "#16a34a",
  textPrimary: "#0f172a",
  textSub:     "#475569",
  textMuted:   "#64748b",
};

// Helper: get the right palette based on isDark
export function getColors(isDark) {
  return isDark ? C : CLight;
}

export const fonts = {
  display: "'Space Grotesk', sans-serif",
  body:    "'DM Sans', sans-serif",
};

// Shared dark input MUI sx
export function darkInputSx(focusColor = C.cyan) {
  return {
    "& .MuiOutlinedInput-root": {
      borderRadius: "10px",
      fontFamily: fonts.body,
      fontSize: "0.85rem",
      color: C.textPrimary,
      bgcolor: C.navyCard,
      "& fieldset":              { borderColor: C.navyBorder },
      "&:hover fieldset":        { borderColor: "rgba(34,211,238,0.35)" },
      "&.Mui-focused fieldset":  {
        borderColor: focusColor,
        boxShadow: `0 0 0 3px rgba(34,211,238,0.08)`,
      },
    },
    "& .MuiInputLabel-root": {
      color: C.textMuted, fontSize: "0.83rem", fontFamily: fonts.body,
    },
    "& .MuiInputLabel-root.Mui-focused": { color: focusColor },
    "& input::placeholder": { color: C.textMuted, opacity: 1 },
  };
}