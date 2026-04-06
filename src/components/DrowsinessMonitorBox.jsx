"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import {
  CloseRounded,
  MinimizeRounded,
  OpenInFullRounded,
  PlayArrowRounded,
  StopRounded,
  VideocamRounded,
  WarningAmberRounded,
  VisibilityRounded,
} from "@mui/icons-material";
import { getColors, fonts } from "../app/utils/theme";

const DEFAULT_SERVICE_URL = "http://127.0.0.1:5001";
const POLL_INTERVAL_MS = 2000;

export default function DrowsinessMonitorBox({
  autoStart = false,
  isDark = true,
  forceCollapsed = false,
  onRequestFocus,
  onVisibilityChange,
}) {
  const T = useMemo(() => getColors(isDark), [isDark]);

  const [visible, setVisible] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [serviceUrl, setServiceUrl] = useState(DEFAULT_SERVICE_URL);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");

  const autoStartFiredRef = useRef(false);
  const ownedSessionRef = useRef(false);

  const expandedWidth = { xs: "min(92vw, 320px)", md: 318 };
  const compactWidth = { xs: "min(88vw, 260px)", md: 220 };

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/drowsiness/status", { cache: "no-store" });
      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Failed to fetch monitor status");
      }

      setRunning(Boolean(payload.running));
      setStatus(payload.serviceStatus || null);
      if (payload.serviceUrl) {
        setServiceUrl(payload.serviceUrl);
      }

      const nextError = payload.serviceStatus?.error || payload.lastError || "";
      setError(nextError);
    } catch (err) {
      setError(err.message || "Status endpoint failed");
      setRunning(false);
    }
  }, []);

  const startService = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/drowsiness/start", {
        method: "POST",
        cache: "no-store",
      });
      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Unable to start drowsiness service");
      }

      setRunning(Boolean(payload.running));
      setStatus(payload.serviceStatus || null);
      if (payload.serviceUrl) {
        setServiceUrl(payload.serviceUrl);
      }

      const nextError = payload.serviceStatus?.error || payload.error || "";
      setError(nextError);
      ownedSessionRef.current = true;
    } catch (err) {
      setRunning(false);
      setError(err.message || "Unable to start service");
    } finally {
      setLoading(false);
    }
  }, []);

  const stopService = useCallback(async () => {
    setLoading(true);
    try {
      await fetch("/api/drowsiness/stop", {
        method: "POST",
        cache: "no-store",
      });
    } catch {
      // Ignore stop errors and reset local state anyway.
    } finally {
      setRunning(false);
      setStatus(null);
      setLoading(false);
      ownedSessionRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (autoStart) {
      setVisible(true);
      onVisibilityChange?.(true);
    }
  }, [autoStart, onVisibilityChange]);

  useEffect(() => {
    if (forceCollapsed) {
      setCollapsed(true);
    }
  }, [forceCollapsed]);

  useEffect(() => {
    if (!visible) {
      return;
    }
    void fetchStatus();
  }, [visible, fetchStatus]);

  useEffect(() => {
    if (!visible || !autoStart || autoStartFiredRef.current) {
      return;
    }
    autoStartFiredRef.current = true;
    void startService();
  }, [visible, autoStart, startService]);

  useEffect(() => {
    if (!visible) {
      return;
    }
    const id = setInterval(() => {
      void fetchStatus();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [visible, fetchStatus]);

  useEffect(() => {
    return () => {
      if (ownedSessionRef.current) {
        fetch("/api/drowsiness/stop", {
          method: "POST",
          cache: "no-store",
          keepalive: true,
        }).catch(() => {});
      }
    };
  }, []);

  const feedUrl = `${serviceUrl}/video_feed`;
  const isDrowsy = Boolean(status?.isDrowsy);

  const handleToggleCollapsed = useCallback(() => {
    if (collapsed) {
      onRequestFocus?.();
    }
    setCollapsed((prev) => !prev);
  }, [collapsed, onRequestFocus]);

  if (!visible) {
    return (
      <IconButton
        onClick={() => {
          onRequestFocus?.();
          setVisible(true);
          onVisibilityChange?.(true);
        }}
        aria-label="Open drowsiness monitor"
        sx={{
          position: "absolute",
          right: 16,
          bottom: { xs: 110, md: 18 },
          zIndex: 1200,
          width: 46,
          height: 46,
          borderRadius: "12px",
          bgcolor: T.navyLight,
          border: `1px solid ${T.navyBorder}`,
          color: T.cyan,
          boxShadow: isDark
            ? "0 8px 24px rgba(2,6,23,0.45)"
            : "0 8px 24px rgba(15,23,42,0.15)",
          "&:hover": {
            bgcolor: isDark ? "#121c33" : "#f0f9ff",
            borderColor: T.cyan,
            transform: "translateY(-1px)",
          },
        }}
      >
        <VideocamRounded sx={{ fontSize: 22 }} />
      </IconButton>
    );
  }

  return (
    <Box
      sx={{
        position: "absolute",
        right: 16,
        bottom: { xs: 110, md: 18 },
        zIndex: 1200,
        width: collapsed ? compactWidth : expandedWidth,
        borderRadius: "14px",
        bgcolor: isDark ? "rgba(17,24,39,0.88)" : "rgba(255,255,255,0.9)",
        border: `1px solid ${T.navyBorder}`,
        backdropFilter: "blur(14px)",
        boxShadow: isDark
          ? "0 18px 44px rgba(2,6,23,0.55)"
          : "0 18px 44px rgba(15,23,42,0.18)",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          px: 1.5,
          py: 1,
          borderBottom: collapsed ? "none" : `1px solid ${T.navyBorder}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: isDark
            ? "linear-gradient(135deg, rgba(34,211,238,0.1), rgba(59,130,246,0.08))"
            : "linear-gradient(135deg, rgba(8,145,178,0.14), rgba(37,99,235,0.1))",
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <VideocamRounded sx={{ fontSize: 16, color: T.cyan }} />
          <Typography
            sx={{
              fontFamily: fonts.display,
              fontWeight: 700,
              fontSize: "0.8rem",
              color: T.textPrimary,
            }}
          >
            Driver Monitor
          </Typography>
        </Stack>

        <Stack direction="row" spacing={0.25}>
          <IconButton
            size="small"
            onClick={handleToggleCollapsed}
            sx={{ color: T.textMuted }}
          >
            {collapsed ? (
              <OpenInFullRounded sx={{ fontSize: 15 }} />
            ) : (
              <MinimizeRounded sx={{ fontSize: 15 }} />
            )}
          </IconButton>
          <IconButton
            size="small"
            onClick={() => {
              setVisible(false);
              onVisibilityChange?.(false);
              void stopService();
            }}
            sx={{ color: T.textMuted }}
          >
            <CloseRounded sx={{ fontSize: 15 }} />
          </IconButton>
        </Stack>
      </Box>

      {collapsed ? (
        <Box sx={{ px: 1.5, py: 1.1, display: "flex", alignItems: "center", gap: 1 }}>
          <Chip
            size="small"
            label={isDrowsy ? "Drowsy detected" : running ? "Monitoring" : "Idle"}
            color={isDrowsy ? "error" : running ? "success" : "default"}
            sx={{ height: 22, fontSize: "0.68rem", fontWeight: 700 }}
          />
          <Box sx={{ ml: "auto" }}>
            {running ? (
              <Button
                onClick={stopService}
                disabled={loading}
                size="small"
                startIcon={<StopRounded sx={{ fontSize: 14 }} />}
                sx={{ textTransform: "none", minWidth: 0, fontSize: "0.68rem", color: T.rose }}
              >
                Stop
              </Button>
            ) : (
              <Button
                onClick={startService}
                disabled={loading}
                size="small"
                startIcon={<PlayArrowRounded sx={{ fontSize: 14 }} />}
                sx={{ textTransform: "none", minWidth: 0, fontSize: "0.68rem", color: T.cyan }}
              >
                Start
              </Button>
            )}
          </Box>
        </Box>
      ) : (
        <Box sx={{ p: 1.5, display: "flex", flexDirection: "column", gap: 1.2 }}>
          <Box
            sx={{
              position: "relative",
              borderRadius: "10px",
              overflow: "hidden",
              border: `1px solid ${T.navyBorder}`,
              background: isDark ? "#040713" : "#e2e8f0",
              minHeight: 180,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {loading && !running ? (
              <Stack alignItems="center" spacing={1}>
                <CircularProgress size={26} sx={{ color: T.cyan }} />
                <Typography sx={{ fontSize: "0.72rem", color: T.textMuted, fontFamily: fonts.body }}>
                  Starting Python detector...
                </Typography>
              </Stack>
            ) : running ? (
              <Box
                component="img"
                src={feedUrl}
                alt="Drowsiness detection stream"
                onError={() => {
                  setError((prev) => prev || "Video stream not available yet.");
                }}
                sx={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <Stack alignItems="center" spacing={0.8}>
                <VisibilityRounded sx={{ color: T.textMuted, fontSize: 28 }} />
                <Typography sx={{ fontSize: "0.72rem", color: T.textMuted, fontFamily: fonts.body }}>
                  Camera feed will appear here
                </Typography>
              </Stack>
            )}

            <Chip
              size="small"
              label={isDrowsy ? "ALERT" : running ? "LIVE" : "OFF"}
              color={isDrowsy ? "error" : running ? "success" : "default"}
              icon={isDrowsy ? <WarningAmberRounded /> : <VideocamRounded />}
              sx={{
                position: "absolute",
                top: 8,
                left: 8,
                height: 24,
                fontWeight: 700,
                fontSize: "0.66rem",
              }}
            />
          </Box>

          <Stack direction="row" spacing={0.8} flexWrap="wrap">
            <Chip
              size="small"
              variant="outlined"
              label={`EAR: ${status?.ear != null ? status.ear : "--"}`}
              sx={{ borderColor: T.navyBorder, color: T.textSub, fontSize: "0.66rem", height: 22 }}
            />
            <Chip
              size="small"
              variant="outlined"
              label={`Faces: ${status?.faceCount ?? 0}`}
              sx={{ borderColor: T.navyBorder, color: T.textSub, fontSize: "0.66rem", height: 22 }}
            />
            <Chip
              size="small"
              variant="outlined"
              label={`Uptime: ${Math.round(status?.uptimeSec || 0)}s`}
              sx={{ borderColor: T.navyBorder, color: T.textSub, fontSize: "0.66rem", height: 22 }}
            />
          </Stack>

          {error ? (
            <Alert
              severity="error"
              sx={{
                py: 0.2,
                "& .MuiAlert-message": {
                  fontFamily: fonts.body,
                  fontSize: "0.72rem",
                },
              }}
            >
              {error}
            </Alert>
          ) : null}

          <Stack direction="row" spacing={1}>
            {running ? (
              <Button
                fullWidth
                variant="outlined"
                onClick={stopService}
                disabled={loading}
                startIcon={<StopRounded sx={{ fontSize: 15 }} />}
                sx={{
                  textTransform: "none",
                  borderColor: `${T.rose}66`,
                  color: T.rose,
                  fontFamily: fonts.body,
                  fontWeight: 600,
                  "&:hover": {
                    borderColor: T.rose,
                    background: "rgba(244,63,94,0.08)",
                  },
                }}
              >
                Stop Monitoring
              </Button>
            ) : (
              <Button
                fullWidth
                variant="contained"
                onClick={startService}
                disabled={loading}
                startIcon={<PlayArrowRounded sx={{ fontSize: 15 }} />}
                sx={{
                  textTransform: "none",
                  background: `linear-gradient(135deg, ${T.blue}, ${T.blueDark})`,
                  color: "#fff",
                  fontFamily: fonts.body,
                  fontWeight: 600,
                  boxShadow: "none",
                  "&:hover": {
                    background: `linear-gradient(135deg, ${T.cyan}, ${T.blue})`,
                  },
                }}
              >
                Start Monitoring
              </Button>
            )}
          </Stack>
        </Box>
      )}
    </Box>
  );
}
