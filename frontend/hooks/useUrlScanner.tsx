// hooks/useUrlScanner.ts

import { useState } from "react";
import { Alert } from "react-native";
import io from "socket.io-client";
import { auth } from "../firebaseConfig";

const BACKEND_URL = "http://192.168.29.54:5000";

// ── Types ──────────────────────────────────────────────────────────────────────

export type Prediction = "SAFE" | "MALICIOUS";
export type TierResolved = 1 | 2 | 3;

export type ScanResult = {
  url: string;
  prediction: Prediction;
  confidence: number;
  tier_resolved: TierResolved;
  latency_ms: number;
  forensics_score: number;
  signals: string[];
  reason: string;
};

export type ScanProgress = {
  step: string;
  message: string;
  progress: number;
};

// ── Hook ───────────────────────────────────────────────────────────────────────

export const useUrlScanner = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [liveLogs, setLiveLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);

  const _log = (msg: string) => setLiveLogs((prev) => [...prev, msg]);

  const scanUrl = async (rawUrl: string, source: "QR Scan" | "Manual") => {
    if (!rawUrl) return;

    // ── 1. Require authenticated user ─────────────────────────────────────
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Not Signed In", "Please sign in to scan URLs.");
      return;
    }

    // ── 2. Get fresh Firebase ID token ────────────────────────────────────
    // forceRefresh=true ensures token is never expired when sent to backend.
    // Backend verifies this token via firebase-admin before processing.
    let idToken: string;
    try {
      idToken = await user.getIdToken(true);
    } catch (e) {
      Alert.alert(
        "Auth Error",
        "Could not retrieve session token. Please sign in again.",
      );
      return;
    }

    setLoading(true);
    setLiveLogs([]);
    setProgress(0);
    setResult(null);

    const socket = io(BACKEND_URL, {
      transports: ["websocket"],
      forceNew: true,
    });

    // ── 3. Send token + url to backend ────────────────────────────────────
    // Backend validates token, extracts uid, runs scan, saves result to Firebase.
    // Frontend does NOT write to Firestore — backend owns all data persistence.
    socket.on("connect", () => {
      _log("[SYSTEM] Connected to CyberGuard Engine.");
      socket.emit("start_scan", {
        url: rawUrl,
        token: idToken, // Firebase ID token — backend verifies this
        source: source, // 'QR Scan' | 'Manual' — for scan history tagging
      });
    });

    // ── 4. Live progress updates ──────────────────────────────────────────
    socket.on("scan_update", (data: ScanProgress) => {
      const pct = Math.round((data.progress ?? 0) * 100);
      setProgress(pct);
      _log(`[${pct}%] ${data.message}`);
    });

    // ── 5. Final result ───────────────────────────────────────────────────
    // Backend has already saved to Firebase by the time this fires.
    // Frontend only needs to display the result.
    socket.on("scan_result", (data: any) => {
      setProgress(100);
      _log("[100%] Analysis complete.");

      setResult({
        url: data.url ?? rawUrl,
        prediction: data.prediction ?? "SAFE",
        confidence: data.confidence ?? 0,
        tier_resolved: data.tier_resolved ?? 3,
        latency_ms: data.latency_ms ?? 0,
        forensics_score: data.forensics_score ?? 0,
        signals: data.signals ?? [],
        reason: data.reason ?? "",
      });

      setModalVisible(true);
      setLoading(false);
      socket.disconnect();
    });

    // ── 6. Auth rejection from backend ────────────────────────────────────
    socket.on("auth_error", (data: { error: string }) => {
      _log(`[AUTH ERROR] ${data.error}`);
      Alert.alert("Session Expired", "Please sign in again to continue.");
      setLoading(false);
      socket.disconnect();
    });

    // ── 7. Scan errors ────────────────────────────────────────────────────
    socket.on("scan_error", (data: { error: string }) => {
      _log(`[ERROR] ${data.error}`);
      Alert.alert("Scan Failed", data.error ?? "CyberGuard server error.");
      setLoading(false);
      socket.disconnect();
    });

    socket.on("connect_error", () => {
      Alert.alert("Connection Error", "Backend server is unreachable.");
      setLoading(false);
      socket.disconnect();
    });
  };

  const closeReport = () => {
    setModalVisible(false);
    setResult(null);
    setLiveLogs([]);
    setProgress(0);
  };

  return {
    loading,
    result,
    modalVisible,
    liveLogs,
    progress,
    scanUrl,
    closeReport,
  };
};
