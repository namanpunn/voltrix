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
  VisibilityRounded,
  VolumeOffRounded,
  VolumeUpRounded,
  WarningAmberRounded,
} from "@mui/icons-material";
import { getColors, fonts } from "../app/utils/theme";

const MEDIAPIPE_WASM_PATH =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.34/wasm";
const MEDIAPIPE_MODEL_PATH =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

const DEFAULT_EAR_THRESHOLD = 0.23;
const EYES_CLOSED_ALERT_DELAY_MS = 2000;
const CALIBRATION_FRAMES = 28;
const UI_UPDATE_INTERVAL_MS = 120;
const ALERT_BEEP_COOLDOWN_MS = 1800;
const ALERT_AUDIO_PATH = "/music.wav";

const LEFT_EYE_IDX = [33, 160, 158, 133, 153, 144];
const RIGHT_EYE_IDX = [362, 385, 387, 263, 373, 380];

function dist2D(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

function eyeAspectRatio(landmarks, idx) {
  if (!landmarks || landmarks.length < 388) {
    return null;
  }

  const p1 = landmarks[idx[0]];
  const p2 = landmarks[idx[1]];
  const p3 = landmarks[idx[2]];
  const p4 = landmarks[idx[3]];
  const p5 = landmarks[idx[4]];
  const p6 = landmarks[idx[5]];

  if (!p1 || !p2 || !p3 || !p4 || !p5 || !p6) {
    return null;
  }

  const a = dist2D(p2, p6);
  const b = dist2D(p3, p5);
  const c = dist2D(p1, p4);

  if (!Number.isFinite(c) || c <= 0) {
    return null;
  }

  return (a + b) / (2 * c);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function formatCamError(error) {
  if (!error) {
    return "Camera access failed.";
  }
  if (error.name === "NotAllowedError") {
    return "Camera permission denied. Please allow camera access.";
  }
  if (error.name === "NotFoundError") {
    return "No camera device found.";
  }
  if (error.name === "NotReadableError") {
    return "Camera is in use by another app. Close it and retry.";
  }
  return error.message || "Unable to start camera.";
}

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
  const [softAlertEnabled, setSoftAlertEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");

  const autoStartFiredRef = useRef(false);
  const streamRef = useRef(null);
  const videoRef = useRef(null);
  const rafRef = useRef(null);
  const detectorRef = useRef(null);
  const startAtRef = useRef(0);
  const frameCountRef = useRef(0);
  const closeCounterRef = useRef(0);
  const closedSinceAtRef = useRef(null);
  const calibrationEarsRef = useRef([]);
  const thresholdRef = useRef(DEFAULT_EAR_THRESHOLD);
  const lastUiUpdateAtRef = useRef(0);
  const isRunningRef = useRef(false);
  const alertBeepAtRef = useRef(0);
  const alertAudioRef = useRef(null);
  const softAlertEnabledRef = useRef(true);

  const expandedWidth = { xs: "min(92vw, 320px)", md: 318 };
  const compactWidth = { xs: "min(88vw, 260px)", md: 220 };

  const playSoftAlert = useCallback(async () => {
    const audio = alertAudioRef.current;
    if (!audio) {
      return;
    }

    try {
      audio.currentTime = 0;
      await audio.play();
    } catch {
      // Ignore autoplay/policy errors.
    }
  }, []);

  const attachStreamToVideo = useCallback(async () => {
    const stream = streamRef.current;
    const video = videoRef.current;
    if (!stream || !video) {
      return;
    }

    if (video.srcObject !== stream) {
      video.srcObject = stream;
    }

    if (video.paused || video.readyState < 2) {
      try {
        await video.play();
      } catch {
        // Ignore autoplay race errors; user can retry.
      }
    }
  }, []);

  const stopMonitoring = useCallback(() => {
    isRunningRef.current = false;

    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setRunning(false);
    setLoading(false);
    setStatus(null);

    closeCounterRef.current = 0;
    closedSinceAtRef.current = null;
    frameCountRef.current = 0;
    calibrationEarsRef.current = [];
    thresholdRef.current = DEFAULT_EAR_THRESHOLD;
    lastUiUpdateAtRef.current = 0;
  }, []);

  const runDetectionFrame = useCallback(
    (timeMs) => {
      if (!isRunningRef.current || !detectorRef.current) {
        return;
      }

      const video = videoRef.current;
      if (!video || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(runDetectionFrame);
        return;
      }

      let faceCount = 0;
      let currentEar = 0;
      let isDrowsy = false;
      let closedDurationMs = 0;

      try {
        const result = detectorRef.current.detectForVideo(video, timeMs);
        const faces = result?.faceLandmarks || [];
        faceCount = faces.length;

        if (faceCount > 0) {
          const landmarks = faces[0];
          const leftEar = eyeAspectRatio(landmarks, LEFT_EYE_IDX);
          const rightEar = eyeAspectRatio(landmarks, RIGHT_EYE_IDX);

          const ear =
            Number.isFinite(leftEar) && Number.isFinite(rightEar)
              ? (leftEar + rightEar) / 2
              : null;

          if (Number.isFinite(ear)) {
            currentEar = ear;

            if (calibrationEarsRef.current.length < CALIBRATION_FRAMES) {
              calibrationEarsRef.current.push(ear);

              if (calibrationEarsRef.current.length === CALIBRATION_FRAMES) {
                const baseline =
                  calibrationEarsRef.current.reduce((sum, value) => sum + value, 0) /
                  CALIBRATION_FRAMES;
                thresholdRef.current = clamp(baseline * 0.72, 0.18, 0.29);
              }
            }

            if (ear < thresholdRef.current) {
              closeCounterRef.current += 1;
              if (closedSinceAtRef.current == null) {
                closedSinceAtRef.current = timeMs;
              }
              closedDurationMs = Math.max(0, timeMs - closedSinceAtRef.current);
            } else {
              closeCounterRef.current = 0;
              closedSinceAtRef.current = null;
              closedDurationMs = 0;
            }

            isDrowsy = closedDurationMs >= EYES_CLOSED_ALERT_DELAY_MS;
          } else {
            closeCounterRef.current = 0;
            closedSinceAtRef.current = null;
          }
        } else {
          closeCounterRef.current = 0;
          closedSinceAtRef.current = null;
        }
      } catch (detErr) {
        setError(detErr.message || "Face landmark detection failed.");
      }

      frameCountRef.current += 1;

      if (isDrowsy && softAlertEnabledRef.current) {
        const now = Date.now();
        if (now - alertBeepAtRef.current > ALERT_BEEP_COOLDOWN_MS) {
          alertBeepAtRef.current = now;
          void playSoftAlert();
        }
      }

      if (timeMs - lastUiUpdateAtRef.current >= UI_UPDATE_INTERVAL_MS) {
        lastUiUpdateAtRef.current = timeMs;
        const uptimeSec = startAtRef.current
          ? (Date.now() - startAtRef.current) / 1000
          : 0;

        setStatus({
          ready: frameCountRef.current > 0,
          running: true,
          isDrowsy,
          ear: currentEar,
          counter: closeCounterRef.current,
          eyesClosedMs: Math.round(closedDurationMs),
          faceCount,
          frameCount: frameCountRef.current,
          error: "",
          uptimeSec,
          threshold: thresholdRef.current,
          alertAfterMs: EYES_CLOSED_ALERT_DELAY_MS,
          calibrationProgress: clamp(
            calibrationEarsRef.current.length / CALIBRATION_FRAMES,
            0,
            1
          ),
        });
      }

      rafRef.current = requestAnimationFrame(runDetectionFrame);
    },
    [playSoftAlert]
  );

  const initDetector = useCallback(async () => {
    if (detectorRef.current) {
      return detectorRef.current;
    }

    const { FaceLandmarker, FilesetResolver } = await import(
      "@mediapipe/tasks-vision"
    );
    const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_PATH);

    const baseConfig = {
      outputFaceBlendshapes: false,
      outputFacialTransformationMatrixes: false,
      runningMode: "VIDEO",
      numFaces: 1,
    };

    try {
      detectorRef.current = await FaceLandmarker.createFromOptions(vision, {
        ...baseConfig,
        baseOptions: {
          modelAssetPath: MEDIAPIPE_MODEL_PATH,
          delegate: "GPU",
        },
      });
    } catch {
      detectorRef.current = await FaceLandmarker.createFromOptions(vision, {
        ...baseConfig,
        baseOptions: {
          modelAssetPath: MEDIAPIPE_MODEL_PATH,
          delegate: "CPU",
        },
      });
    }

    return detectorRef.current;
  }, []);

  const startMonitoring = useCallback(async () => {
    if (isRunningRef.current) {
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("This browser does not support camera access.");
      return;
    }

    setLoading(true);
    setError("");
    setStatus(null);

    try {
      await initDetector();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 960 },
          height: { ideal: 540 },
          frameRate: { ideal: 24, max: 30 },
        },
        audio: false,
      });

      streamRef.current = stream;

      isRunningRef.current = true;
      setRunning(true);
      startAtRef.current = Date.now();
      frameCountRef.current = 0;
      closeCounterRef.current = 0;
      closedSinceAtRef.current = null;
      calibrationEarsRef.current = [];
      thresholdRef.current = DEFAULT_EAR_THRESHOLD;
      alertBeepAtRef.current = 0;
      lastUiUpdateAtRef.current = 0;

      rafRef.current = requestAnimationFrame(runDetectionFrame);
    } catch (err) {
      setError(formatCamError(err));
      stopMonitoring();
    } finally {
      setLoading(false);
    }
  }, [initDetector, runDetectionFrame, stopMonitoring]);

  useEffect(() => {
    if (autoStart) {
      setVisible(true);
      onVisibilityChange?.(true);
    }
  }, [autoStart, onVisibilityChange]);

  useEffect(() => {
    softAlertEnabledRef.current = softAlertEnabled;
  }, [softAlertEnabled]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const audio = new Audio(ALERT_AUDIO_PATH);
    audio.preload = "auto";
    audio.volume = 0.9;
    alertAudioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = "";
      alertAudioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!running || collapsed || !visible) {
      return;
    }
    void attachStreamToVideo();
  }, [running, collapsed, visible, attachStreamToVideo]);

  useEffect(() => {
    if (forceCollapsed) {
      setCollapsed(true);
    }
  }, [forceCollapsed]);

  useEffect(() => {
    if (!visible || !autoStart || autoStartFiredRef.current || running) {
      return;
    }
    autoStartFiredRef.current = true;
    void startMonitoring();
  }, [visible, autoStart, running, startMonitoring]);

  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);

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
            onClick={() => setSoftAlertEnabled((prev) => !prev)}
            sx={{ color: T.textMuted }}
          >
            {softAlertEnabled ? (
              <VolumeUpRounded sx={{ fontSize: 15 }} />
            ) : (
              <VolumeOffRounded sx={{ fontSize: 15 }} />
            )}
          </IconButton>

          <IconButton size="small" onClick={handleToggleCollapsed} sx={{ color: T.textMuted }}>
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
              stopMonitoring();
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
                onClick={stopMonitoring}
                disabled={loading}
                size="small"
                startIcon={<StopRounded sx={{ fontSize: 14 }} />}
                sx={{ textTransform: "none", minWidth: 0, fontSize: "0.68rem", color: T.rose }}
              >
                Stop
              </Button>
            ) : (
              <Button
                onClick={startMonitoring}
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
                  Initializing vision model...
                </Typography>
              </Stack>
            ) : running ? (
              <Box
                component="video"
                ref={videoRef}
                muted
                autoPlay
                playsInline
                aria-label="Driver webcam feed"
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
              label={`EAR: ${status?.ear ? status.ear.toFixed(3) : "--"}`}
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
            <Chip
              size="small"
              variant="outlined"
              label={`Calib: ${Math.round((status?.calibrationProgress || 0) * 100)}%`}
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
                onClick={stopMonitoring}
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
                onClick={startMonitoring}
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
