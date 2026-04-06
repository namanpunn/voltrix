import os
import sys
import time
import threading
from pathlib import Path

from flask import Flask, Response, jsonify
from flask_cors import CORS

IMPORT_ERRORS = []

try:
    import cv2
except Exception as exc:  # pragma: no cover - runtime dependency check
    cv2 = None
    IMPORT_ERRORS.append(f"opencv-python import failed: {exc}")

try:
    import dlib
except Exception as exc:  # pragma: no cover - runtime dependency check
    dlib = None
    IMPORT_ERRORS.append(f"dlib import failed: {exc}")

try:
    import imutils
    from imutils import face_utils
except Exception as exc:  # pragma: no cover - runtime dependency check
    imutils = None
    face_utils = None
    IMPORT_ERRORS.append(f"imutils import failed: {exc}")

try:
    from scipy.spatial import distance
except Exception as exc:  # pragma: no cover - runtime dependency check
    distance = None
    IMPORT_ERRORS.append(f"scipy import failed: {exc}")

try:
    from pygame import mixer
except Exception:
    mixer = None

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "models" / "shape_predictor_68_face_landmarks.dat"
ALARM_PATH = BASE_DIR / "music.wav"

EYE_AR_THRESH = float(os.getenv("DROWSINESS_EAR_THRESHOLD", "0.25"))
CONSEC_FRAMES = int(os.getenv("DROWSINESS_CONSEC_FRAMES", "10"))
CAMERA_INDEX = int(os.getenv("DROWSINESS_CAMERA_INDEX", "0"))
SERVICE_HOST = os.getenv("DROWSINESS_HOST", "127.0.0.1")
SERVICE_PORT = int(os.getenv("DROWSINESS_PORT", "5001"))

app = Flask(__name__)
CORS(app)


class DetectorState:
    def __init__(self):
        self.lock = threading.Lock()
        self.latest_frame = None
        self.is_drowsy = False
        self.ear = 0.0
        self.counter = 0
        self.face_count = 0
        self.frame_count = 0
        self.last_error = ""
        self.ready = False
        self.started_at = time.time()
        self.running = True
        self.alarm_enabled = False

    def set_error(self, message: str):
        with self.lock:
            self.last_error = message
            self.ready = False

    def set_frame(self, frame_bytes: bytes):
        with self.lock:
            self.latest_frame = frame_bytes

    def set_metrics(self, *, is_drowsy: bool, ear: float, counter: int, face_count: int):
        with self.lock:
            self.is_drowsy = is_drowsy
            self.ear = float(ear)
            self.counter = int(counter)
            self.face_count = int(face_count)
            self.frame_count += 1
            if not self.last_error:
                self.ready = True

    def snapshot(self):
        with self.lock:
            return {
                "ready": self.ready,
                "running": self.running,
                "isDrowsy": self.is_drowsy,
                "ear": round(self.ear, 4),
                "counter": self.counter,
                "faceCount": self.face_count,
                "frameCount": self.frame_count,
                "error": self.last_error,
                "uptimeSec": round(time.time() - self.started_at, 1),
                "threshold": EYE_AR_THRESH,
                "consecutiveFrames": CONSEC_FRAMES,
            }


state = DetectorState()


def eye_aspect_ratio(eye):
    a = distance.euclidean(eye[1], eye[5])
    b = distance.euclidean(eye[2], eye[4])
    c = distance.euclidean(eye[0], eye[3])
    return (a + b) / (2.0 * c)


def init_alarm():
    if mixer is None:
        return False
    try:
        mixer.init()
        if ALARM_PATH.exists():
            mixer.music.load(str(ALARM_PATH))
        return True
    except Exception:
        return False


def stop_alarm():
    if mixer is None:
        return
    try:
        if mixer.music.get_busy():
            mixer.music.stop()
    except Exception:
        pass


def detect_loop():
    if IMPORT_ERRORS:
        state.set_error("; ".join(IMPORT_ERRORS))
        return

    if not MODEL_PATH.exists():
        state.set_error(f"Model file missing at: {MODEL_PATH}")
        return

    detector = dlib.get_frontal_face_detector()
    predictor = dlib.shape_predictor(str(MODEL_PATH))
    (l_start, l_end) = face_utils.FACIAL_LANDMARKS_68_IDXS["left_eye"]
    (r_start, r_end) = face_utils.FACIAL_LANDMARKS_68_IDXS["right_eye"]

    alarm_ready = init_alarm()
    with state.lock:
        state.alarm_enabled = alarm_ready

    if sys.platform.startswith("win"):
        cap = cv2.VideoCapture(CAMERA_INDEX, cv2.CAP_DSHOW)
    else:
        cap = cv2.VideoCapture(CAMERA_INDEX)

    if not cap.isOpened():
        state.set_error("Could not open webcam. Close other camera apps and retry.")
        return

    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 960)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 540)

    counter = 0

    try:
        while state.running:
            ok, frame = cap.read()
            if not ok or frame is None:
                time.sleep(0.03)
                continue

            frame = imutils.resize(frame, width=900)
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            subjects = detector(gray, 0)

            ear = 0.0
            is_drowsy = False
            face_count = len(subjects)

            for subject in subjects:
                shape = predictor(gray, subject)
                shape = face_utils.shape_to_np(shape)
                left_eye = shape[l_start:l_end]
                right_eye = shape[r_start:r_end]

                left_ear = eye_aspect_ratio(left_eye)
                right_ear = eye_aspect_ratio(right_eye)
                ear = (left_ear + right_ear) / 2.0

                left_eye_hull = cv2.convexHull(left_eye)
                right_eye_hull = cv2.convexHull(right_eye)
                cv2.drawContours(frame, [left_eye_hull], -1, (0, 255, 0), 1)
                cv2.drawContours(frame, [right_eye_hull], -1, (0, 255, 0), 1)

                if ear < EYE_AR_THRESH:
                    counter += 1
                else:
                    counter = 0

                if counter >= CONSEC_FRAMES:
                    is_drowsy = True
                    if alarm_ready and not mixer.music.get_busy():
                        mixer.music.play(-1)
                else:
                    stop_alarm()

                break

            if face_count == 0:
                counter = 0
                stop_alarm()

            state.set_metrics(
                is_drowsy=is_drowsy,
                ear=ear,
                counter=counter,
                face_count=face_count,
            )

            top_text = "ALERT: DROWSINESS DETECTED" if is_drowsy else "Driver Alert"
            top_color = (0, 0, 255) if is_drowsy else (0, 255, 0)
            cv2.putText(frame, top_text, (14, 36), cv2.FONT_HERSHEY_SIMPLEX, 0.85, top_color, 2)
            cv2.putText(
                frame,
                f"EAR: {ear:.3f} | Threshold: {EYE_AR_THRESH:.2f} | Faces: {face_count}",
                (14, 68),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.62,
                (255, 255, 255),
                2,
            )

            ok, encoded = cv2.imencode(".jpg", frame, [int(cv2.IMWRITE_JPEG_QUALITY), 82])
            if ok:
                state.set_frame(encoded.tobytes())

    except Exception as exc:
        state.set_error(f"Detection loop crashed: {exc}")
    finally:
        stop_alarm()
        cap.release()


def frame_stream():
    while state.running:
        frame = state.latest_frame
        if frame is None:
            time.sleep(0.05)
            continue
        yield (
            b"--frame\r\n"
            b"Content-Type: image/jpeg\r\n\r\n" + frame + b"\r\n"
        )


@app.get("/health")
def health():
    data = state.snapshot()
    return jsonify({"ok": True, "status": data})


@app.get("/status")
def status():
    return jsonify(state.snapshot())


@app.get("/video_feed")
def video_feed():
    return Response(frame_stream(), mimetype="multipart/x-mixed-replace; boundary=frame")


@app.post("/stop")
def stop_service():
    state.running = False
    return jsonify({"ok": True})


if __name__ == "__main__":
    worker = threading.Thread(target=detect_loop, daemon=True)
    worker.start()
    app.run(host=SERVICE_HOST, port=SERVICE_PORT, debug=False, threaded=True, use_reloader=False)
