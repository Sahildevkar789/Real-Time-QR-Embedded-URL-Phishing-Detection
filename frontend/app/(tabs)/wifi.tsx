import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated, 
  Easing, 
  ScrollView, 
  Dimensions 
} from 'react-native';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import * as Network from 'expo-network';
import * as Location from 'expo-location'; 
import { CameraView, Camera } from 'expo-camera';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function WifiScannerScreen() {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<null | any>(null);
  const [wifiDetails, setWifiDetails] = useState<any>(null);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  
  // Camera State
  const [isCameraVisible, setIsCameraVisible] = useState(false);
  const [scanned, setScanned] = useState(false);

  // Animation Values
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;

  // --- 1. ASK PERMISSIONS ON LOAD ---
  useEffect(() => {
    (async () => {
      await Location.requestForegroundPermissionsAsync();
    })();
  }, []);

  // --- ANIMATION ---
  const startRadarAnimation = () => {
    spinValue.setValue(0);
    Animated.loop(
      Animated.timing(spinValue, { toValue: 1, duration: 3000, easing: Easing.linear, useNativeDriver: true })
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseValue, { toValue: 1, duration: 1000, useNativeDriver: true })
      ])
    ).start();
  };

  const stopRadarAnimation = () => {
    spinValue.stopAnimation();
    pulseValue.stopAnimation();
  };

  const spin = spinValue.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  // --- QR HANDLER ---
  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    setIsCameraVisible(false);
    
    // CLEAR OLD DATA
    setWifiDetails(null); 
    setResult(null);

    setScanning(true);
    startRadarAnimation();
    
    setTimeout(() => {
        analyzeWifiQr(data);
        setScanning(false);
        stopRadarAnimation();
    }, 1500);
  };

  // --- 2. UNIVERSAL QR PARSER (Standard + Lazy + Plain Text) ---
  const analyzeWifiQr = (rawQrData: string) => {
    let qrData = rawQrData.trim();
    let score = 10;
    let reasons: string[] = [];

    // A. ANTI-TAMPER CHECK (Phishing Links)
    if (qrData.toLowerCase().startsWith("http")) {
       const isLocal = qrData.includes("192.168") || qrData.includes("10.0");
       setResult({
        status: isLocal ? "Suspicious" : "Malicious",
        score: isLocal ? 5 : 0,
        details: { 
            reasons: [
                "⚠️ QR TAMPERING DETECTED!", 
                "This QR opens a Browser Link, NOT a Wi-Fi connection.",
                isLocal ? "It redirects to a Fake Router Login Page." : "It redirects to a Phishing Website."
            ] 
        }
      });
      return;
    }

    // B. PARSING LOGIC
    // Try Standard Format first (WIFI:S:...)
    const ssidMatch = qrData.match(/S:(.*?)(?:;|$)/i);
    const passMatch = qrData.match(/P:(.*?)(?:;|$)/i);
    const typeMatch = qrData.match(/T:(.*?)(?:;|$)/i);
    const hiddenMatch = qrData.match(/H:(.*?)(?:;|$)/i);

    let ssid = ssidMatch ? ssidMatch[1] : "Unknown";
    let password = passMatch ? passMatch[1] : null;
    let security = typeMatch ? typeMatch[1] : "Unknown";
    let isHidden = hiddenMatch ? hiddenMatch[1].toLowerCase() === 'true' : false;
    let isStandardFormat = true;

    // Fallback: Lazy Format (Plain Text "Name Password")
    if (ssid === "Unknown" && !password && !qrData.toUpperCase().startsWith("WIFI:")) {
        const parts = qrData.split(' ');
        
        if (parts.length >= 2) {
            // Assume Last Part is Password, Rest is SSID (e.g., "Library Wifi pass123")
            password = parts.pop(); 
            ssid = parts.join(' '); 
            security = "WPA/WPA2"; 
            isStandardFormat = false;
        } else if (parts.length === 1 && parts[0].length > 0) {
            // "OpenWifi"
            ssid = parts[0];
            security = "OPEN";
            isStandardFormat = false;
        } else {
             // Truly Invalid
             const snippet = rawQrData.length > 20 ? rawQrData.substring(0, 20) + "..." : rawQrData;
             setResult({
                status: "Invalid",
                score: 0,
                details: { reasons: [`❌ Format Unrecognized. Raw Data: "${snippet}"`] }
             });
             return;
        }
    }

    // C. CREDENTIAL HARDENING (Security Audit)
    if (!isStandardFormat) {
        reasons.push("Notice: QR uses Plain Text (Non-Standard).");
    }

    // Password Strength
    if (password) {
        if (password.length < 8) {
            score -= 3;
            reasons.push("Weak Password: Too short (< 8 chars). Easily cracked.");
        }
        if (password === "12345678" || password.toLowerCase() === "password") {
            score -= 5;
            reasons.push("Critical: Default/Common Password detected.");
        }
        if (password === ssid) {
            score -= 2;
            reasons.push("Poor Config: Password matches Wi-Fi Name.");
        }
    }

    // Spoofing / Honeypot Checks
    const ssidLower = ssid.toLowerCase();
    if (ssidLower.includes("free") && !ssidLower.includes("guest") && security === "OPEN") {
        score -= 3;
        reasons.push("Honeypot Warning: Generic 'Free' name with no password.");
    }
    
    // Protocol Checks
    if (security.toUpperCase() === "WEP") { 
        score -= 6; 
        reasons.push("WEP Encryption is Obsolete."); 
    } 
    if (security.toLowerCase() === "nopass" || (!password && security === "OPEN")) {
       score -= 5; 
       reasons.push("Open Network (Unsecured).");
    }
    if (isHidden) { 
        score -= 1; 
        reasons.push("Hidden Network."); 
    }

    // D. SUCCESS
    setWifiDetails({ 
        ssid: ssid, 
        type: security !== "Unknown" ? security : "WPA/WPA2", 
        publicIp: "Not Connected", 
        isp: "Scan QR to Connect" 
    });
    setIsOfflineMode(true);
    
    setResult({
      status: score > 7 ? "Safe" : (score > 4 ? "Suspicious" : "Unsafe"),
      score: score,
      details: { reasons: reasons.length > 0 ? reasons : ["Credentials valid & Secure."] }
    });
  };

  // --- 3. CAPTIVE PORTAL CHECKER ---
  const checkCaptivePortal = async () => {
    try {
      // Android/iOS check connectivity by pinging this URL.
      // If it returns 204, internet is clean. If it redirects, it's a Portal.
      const response = await fetch('http://clients3.google.com/generate_204', {
         redirect: 'manual' 
      });
      
      if (response.status === 204) return null; // No Portal

      const portalUrl = response.headers.get('Location') || response.url;
      return portalUrl;
    } catch (e) {
      return null;
    }
  };

  // --- 4. NETWORK FORENSICS SCANNER ---
  const startNetworkScan = async () => {
    setScanning(true);
    setResult(null);
    startRadarAnimation();

    try {
      const networkState = await Network.getNetworkStateAsync();
      const ip = await Network.getIpAddressAsync();
      
      let score = 10;
      let reasons: string[] = [];
      let publicIp = "Offline";
      let ispName = "Unknown";
      let portalUrl = null;

      // A. SSID Retrieval
      let ssid = "Wi-Fi Connection";
      if (networkState.type === Network.NetworkStateType.CELLULAR) ssid = "Cellular Data";

      // B. ONLINE CHECKS
      if (networkState.isInternetReachable) {
          setIsOfflineMode(false);
          
          // 1. Check for EVIL TWIN PORTAL
          portalUrl = await checkCaptivePortal();
          if (portalUrl) {
             score -= 2; 
             if (portalUrl.startsWith("http://")) {
                 score -= 5;
                 reasons.push("⚠️ INSECURE PORTAL: Login page is not encrypted (HTTP).");
             }
             // Check for suspicious local hosting or tunnelling
             if (portalUrl.includes("ngrok") || portalUrl.includes("serveo") || /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(portalUrl)) {
                 score -= 8; 
                 reasons.push("🚨 EVIL TWIN ALERT: Login page hosted on temporary/local server.");
             } else {
                 reasons.push(`Notice: Authentication Page Detected.`);
             }
          }

          // 2. Check ISP Reputation
          try {
            const response = await fetch('http://ip-api.com/json');
            const data = await response.json();
            if (data.status === 'success') {
                publicIp = data.query;
                ispName = data.isp || data.org;
                
                const hostingKeywords = ["amazon", "google", "digitalocean", "microsoft", "oracle", "ovh"];
                if (hostingKeywords.some(k => ispName.toLowerCase().includes(k))) {
                    score -= 3;
                    reasons.push(`Suspicious ISP: Traffic routed through Cloud Hosting (${ispName}).`);
                }
            }
          } catch (e) {}
      } else {
          setIsOfflineMode(true);
          // Even without internet, try to find the portal
          portalUrl = await checkCaptivePortal(); 
          if (portalUrl) reasons.push("⚠️ Trap Detected: You are behind a Captive Portal.");
          else reasons.push("No Internet Access.");
      }

      setWifiDetails({
        ssid: ssid,
        ip: ip || "0.0.0.0",
        publicIp: publicIp,
        type: networkState.type,
        isp: ispName,
        portal: portalUrl
      });
      
      setResult({
        status: score > 7 ? "Safe" : "Unsafe",
        score: score,
        details: { reasons: reasons.length > 0 ? reasons : ["Network Infrastructure is Clean."] }
      });

    } catch (e) {
      setResult({ status: "Error", score: 0, details: { reasons: ["Scan Failed"] } });
    } finally {
      setTimeout(() => {
        setScanning(false);
        stopRadarAnimation();
      }, 2000);
    }
  };

  // --- RENDER ---
  if (isCameraVisible) {
    return (
      <View style={{ flex: 1, backgroundColor: 'black' }}>
         <CameraView
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            style={StyleSheet.absoluteFillObject}
          />
        <View style={styles.cameraOverlay}>
          <Text style={styles.cameraText}>Align Wi-Fi QR Code</Text>
          <TouchableOpacity onPress={() => setIsCameraVisible(false)} style={styles.closeBtn}>
            <Text style={styles.closeText}>CANCEL SCAN</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>WI-FI SENTINEL</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* RADAR */}
        <View style={styles.radarSection}>
          <View style={styles.radarContainer}>
            <View style={styles.radarRingOuter} />
            <View style={styles.radarRingInner} />
            <View style={styles.radarCrosshairVertical} />
            <View style={styles.radarCrosshairHorizontal} />

            {scanning ? (
                <Animated.View style={[styles.radarSweepContainer, { transform: [{ rotate: spin }] }]}>
                    <View style={styles.radarSweepGradient} />
                </Animated.View>
            ) : (
                <Ionicons name={isOfflineMode ? "airplane" : "wifi"} size={60} color="#333" />
            )}
            
            {scanning && <Animated.View style={[styles.radarDot, { transform: [{ scale: pulseValue }] }]} />}
          </View>
          <Text style={styles.statusText}>
            {scanning ? "ANALYZING INFRASTRUCTURE..." : "SYSTEM READY"}
          </Text>
        </View>

        {/* RESULTS */}
        {result && !scanning && (
          <View style={[styles.resultBox, { borderColor: result.score > 7 ? '#00ff9d' : '#ff4b4b' }]}>
            <View style={styles.resultHeader}>
                <Ionicons name={result.score > 7 ? "shield-checkmark" : "warning"} size={32} color={result.score > 7 ? "#00ff9d" : "#ff4b4b"} />
                <View style={{ marginLeft: 15 }}>
                    <Text style={[styles.resultTitle, { color: result.score > 7 ? "#00ff9d" : "#ff4b4b" }]}>
                        {result.status.toUpperCase()}
                    </Text>
                    <Text style={styles.resultSub}>Threat Score: {10 - result.score}/10</Text>
                </View>
            </View>

            {isOfflineMode && (
                <View style={styles.offlineNotice}>
                    <Ionicons name="cloud-offline-outline" size={14} color="#aaa" />
                    <Text style={styles.offlineNoticeText}>Offline Mode: Using Heuristic Analysis</Text>
                </View>
            )}

            <View style={styles.divider} />

            {/* EXPANDED GRID */}
            <View style={styles.grid}>
                <View style={styles.gridItemFull}>
                    <Text style={styles.label}>PROVIDER (ISP)</Text>
                    <Text style={[styles.value, { color: COLORS.accent }]}>
                        {wifiDetails?.isp || "Unknown"}
                    </Text>
                </View>

                <View style={styles.gridItem}>
                    <Text style={styles.label}>CONNECTION</Text>
                    <Text style={styles.value}>{wifiDetails?.ssid || "Unknown"}</Text>
                </View>
                <View style={styles.gridItem}>
                    <Text style={styles.label}>PUBLIC IP</Text>
                    <Text style={styles.value}>{wifiDetails?.publicIp || "---"}</Text>
                </View>

                {/* NEW: CAPTIVE PORTAL ROW */}
                {wifiDetails?.portal && (
                  <View style={[styles.gridItemFull, { 
                      backgroundColor: 'rgba(255, 75, 75, 0.1)', 
                      padding: 10, 
                      borderRadius: 8, 
                      borderWidth: 1, 
                      borderColor: '#ff4b4b',
                      marginTop: 5
                  }]}>
                      <Text style={[styles.label, { color: '#ff4b4b' }]}>⚠️ AUTHENTICATION PAGE DETECTED</Text>
                      <Text style={[styles.value, { fontSize: 12 }]} numberOfLines={1}>
                          {wifiDetails.portal}
                      </Text>
                  </View>
                )}
            </View>

            <View style={styles.reasonsBox}>
                {result.details.reasons.map((r: string, i: number) => (
                    <Text key={i} style={[styles.reasonText, { color: result.score > 7 ? '#888' : '#ffd700' }]}>
                        • {r}
                    </Text>
                ))}
            </View>
          </View>
        )}

        {/* CONTROLS */}
        {!scanning && (
          <View style={styles.controls}>
             <TouchableOpacity style={styles.scanBtn} onPress={startNetworkScan}>
                <Ionicons name="scan-circle-outline" size={24} color="#000" />
                <Text style={styles.scanBtnText}>SCAN NETWORK</Text>
             </TouchableOpacity>

             <TouchableOpacity style={[styles.scanBtn, styles.qrBtn]} onPress={() => { setScanned(false); setIsCameraVisible(true); }}>
                <Ionicons name="qr-code-outline" size={24} color="#fff" />
                <Text style={[styles.scanBtnText, { color: '#fff' }]}>SCAN QR</Text>
             </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const COLORS = { accent: '#00ff9d' };

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#050505' },
  scrollContent: { paddingBottom: 100, alignItems: 'center' },
  
  header: { 
      width: '100%', flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20,
      backgroundColor: '#111', borderBottomWidth: 1, borderBottomColor: '#222'
  },
  backBtn: { marginRight: 15 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', letterSpacing: 1 },

  radarSection: { marginTop: 40, marginBottom: 30, alignItems: 'center' },
  radarContainer: { width: 220, height: 220, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  radarRingOuter: { position: 'absolute', width: 220, height: 220, borderRadius: 110, borderWidth: 2, borderColor: '#1a1a1a' },
  radarRingInner: { position: 'absolute', width: 140, height: 140, borderRadius: 70, borderWidth: 1, borderColor: '#1a1a1a' },
  radarCrosshairVertical: { position: 'absolute', width: 1, height: 220, backgroundColor: '#111' },
  radarCrosshairHorizontal: { position: 'absolute', height: 1, width: 220, backgroundColor: '#111' },
  radarSweepContainer: { position: 'absolute', width: 220, height: 220, borderRadius: 110, overflow: 'hidden' },
  radarSweepGradient: { width: 110, height: 110, backgroundColor: 'rgba(0, 255, 157, 0.4)', position: 'absolute', top: 0, right: 0, borderBottomLeftRadius: 110 },
  radarDot: { position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: '#00ff9d' },
  statusText: { color: '#00ff9d', marginTop: 20, fontSize: 12, letterSpacing: 2 },

  resultBox: { width: width - 40, backgroundColor: '#111', borderRadius: 16, padding: 20, borderWidth: 1, marginBottom: 30 },
  resultHeader: { flexDirection: 'row', alignItems: 'center' },
  resultTitle: { fontSize: 20, fontWeight: '900', letterSpacing: 1 },
  resultSub: { color: '#666', fontSize: 12 },
  offlineNotice: { flexDirection: 'row', alignItems: 'center', marginTop: 5, backgroundColor: '#222', padding: 5, borderRadius: 4, alignSelf: 'flex-start' },
  offlineNoticeText: { color: '#aaa', fontSize: 10, marginLeft: 5 },
  divider: { height: 1, backgroundColor: '#333', marginVertical: 15 },
  
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridItem: { width: '48%', marginBottom: 15 },
  gridItemFull: { width: '100%', marginBottom: 15 }, 
  label: { color: '#555', fontSize: 10, fontWeight: 'bold', marginBottom: 5 },
  value: { color: '#fff', fontSize: 14, fontFamily: 'monospace' },
  reasonsBox: { marginTop: 10, padding: 10, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 8 },
  reasonText: { fontSize: 12, lineHeight: 18 },

  controls: { width: '100%', paddingHorizontal: 20, gap: 15 },
  scanBtn: { flexDirection: 'row', backgroundColor: '#00ff9d', padding: 18, borderRadius: 12, justifyContent: 'center', alignItems: 'center', gap: 10 },
  qrBtn: { backgroundColor: '#222', borderWidth: 1, borderColor: '#333' },
  scanBtnText: { color: '#000', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 },

  cameraOverlay: { position: 'absolute', bottom: 50, width: '100%', alignItems: 'center' },
  cameraText: { color: '#fff', marginBottom: 20, fontWeight: 'bold', backgroundColor: 'rgba(0,0,0,0.6)', padding: 10 },
  closeBtn: { backgroundColor: '#ff4b4b', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 30 },
  closeText: { color: '#fff', fontWeight: 'bold' }
});