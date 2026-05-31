import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics"; // Add haptics for that premium feel!
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// --- IMPORT SHARED LOGIC ---
import { HackerLoader } from "../../components/HackerLoader";
import { ResultModal } from "../../components/ResultModal";
import { useUrlScanner } from "../../hooks/useUrlScanner";

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const router = useRouter();

  // --- 1. CONNECT TO SHARED BRAIN ---
  // Added liveLogs to the destructured hook variables!
  const { loading, result, liveLogs, modalVisible, scanUrl, closeReport } =
    useUrlScanner();

  // --- PHYSICAL VALIDATION LOGIC ---
  const handleBarCodeScanned = ({ type, data }: any) => {
    if (scanned || loading) return;

    if (!data || data.trim() === "") {
      Alert.alert("Read Error", "QR Code is damaged or contains no data.");
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setScanned(true);

    // Kick off the real-time websocket scan!
    scanUrl(data, "QR Scan");
  };

  const handleCloseReport = () => {
    closeReport();
    // Delay re-enabling scan to prevent accidental double-scans
    setTimeout(() => setScanned(false), 1500);
  };

  if (!permission) return <View style={styles.container} />;
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#fff", marginBottom: 20 }}>
          Camera access required
        </Text>
        <TouchableOpacity onPress={requestPermission} style={styles.btn}>
          <Text style={{ fontWeight: "bold" }}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {isFocused && (
        <CameraView
          style={StyleSheet.absoluteFillObject}
          // If we are loading or viewing result, stop scanning
          onBarcodeScanned={
            scanned || loading ? undefined : handleBarCodeScanned
          }
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
        />
      )}

      {/* --- TITLE OVERLAY --- */}
      <View style={[styles.overlay, { top: insets.top + 20 }]}>
        <Text style={styles.title}>OPTICAL SENSOR ACTIVE</Text>
        <Text style={styles.subtitle}>Align QR Code within frame</Text>
      </View>

      {/* --- CLOSE BUTTON --- */}
      <TouchableOpacity
        style={[styles.closeButton, { top: insets.top + 20 }]}
        onPress={() => router.replace("/(tabs)/home")}
      >
        <Ionicons name="close" size={24} color="#000" />
      </TouchableOpacity>

      {/* --- SCANNER FRAME --- */}
      <View style={styles.scannerFrame}>
        <View style={[styles.corner, styles.tl]} />
        <View style={[styles.corner, styles.tr]} />
        <View style={[styles.corner, styles.bl]} />
        <View style={[styles.corner, styles.br]} />
      </View>

      {/* --- 1. HACKER LOADER (NEW REAL-TIME VERSION) --- */}
      <Modal visible={loading} transparent={true} animationType="fade">
        <View style={styles.loaderOverlay}>
          <View style={styles.loaderBox}>
            {/* Replaced targetUrl with our live data stream props */}
            <HackerLoader liveLogs={liveLogs} loading={loading} />
          </View>
        </View>
      </Modal>

      {/* --- 2. RESULT MODAL --- */}
      <ResultModal
        isVisible={modalVisible}
        onClose={handleCloseReport}
        result={result}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },

  overlay: {
    position: "absolute",
    alignSelf: "center",
    alignItems: "center",
    zIndex: 10,
  },
  title: {
    color: "#00ff9d",
    fontSize: 16,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    fontWeight: "bold",
    letterSpacing: 2,
  },
  subtitle: { color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 5 },

  btn: { backgroundColor: "#00ff9d", padding: 15, borderRadius: 8 },

  closeButton: {
    position: "absolute",
    right: 20,
    zIndex: 20,
    backgroundColor: "#00ff9d",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },

  scannerFrame: {
    position: "absolute",
    top: "30%",
    left: "15%",
    width: "70%",
    height: "40%",
    borderColor: "rgba(0,255,157,0.3)",
    borderWidth: 1,
    borderRadius: 20,
  },
  corner: {
    position: "absolute",
    width: 30,
    height: 30,
    borderColor: "#00ff9d",
    borderWidth: 4,
  },
  tl: {
    top: -2,
    left: -2,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 20,
  },
  tr: {
    top: -2,
    right: -2,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 20,
  },
  bl: {
    bottom: -2,
    left: -2,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 20,
  },
  br: {
    bottom: -2,
    right: -2,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 20,
  },

  // Loader Styles
  loaderOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  loaderBox: { width: "90%" },
});
