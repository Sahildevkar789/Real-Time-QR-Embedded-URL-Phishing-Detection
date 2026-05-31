import {
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ScanResult } from "../hooks/useUrlScanner";

interface ResultModalProps {
  isVisible: boolean;
  onClose: () => void;
  result: ScanResult | null;
}

const TIER_META: Record<
  number,
  { label: string; icon: string; detail: string }
> = {
  1: {
    label: "Tier 1 · ML Filter",
    icon: "brain",
    detail:
      "Lexical machine learning model analysed the URL structure, character patterns, and known phishing indicators in under 5ms. High confidence allowed early resolution.",
  },
  2: {
    label: "Tier 2 · Threat Intel",
    icon: "database-search",
    detail:
      "Domain matched our real-time threat intelligence blacklist sourced from community-reported phishing incidents and auto-reported Tier-3 verdicts.",
  },
  3: {
    label: "Tier 3 · Deep Forensics",
    icon: "magnify-scan",
    detail:
      "Full-page forensic pipeline: SSL certificate validation, WHOIS domain age check, HTML content inspection, brand impersonation detection, and redirect chain analysis.",
  },
};

const getSignalColor = (signal: string) => {
  const s = signal.toLowerCase();
  if (s.includes("brand") || s.includes("impersonat") || s.includes("mismatch"))
    return "#ff4b4b";
  if (s.includes("ssl") || s.includes("certificate") || s.includes("self-sign"))
    return "#ff8c42";
  if (s.includes("young") || s.includes("domain age") || s.includes("age"))
    return "#ffbd2e";
  if (s.includes("login") || s.includes("credential") || s.includes("form"))
    return "#ff6b9d";
  if (s.includes("redirect") || s.includes("obfuscat") || s.includes("hidden"))
    return "#c792ea";
  return "#555";
};

// ── Score bar ──────────────────────────────────────────────────────────────────
const ScoreBar = ({ score }: { score: number }) => {
  const pct = Math.min(score / 10, 1);
  const color = score >= 5 ? "#ff4b4b" : score >= 3 ? "#ffbd2e" : "#00ff9d";
  return (
    <View
      style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 10 }}
    >
      <View
        style={{
          flex: 1,
          height: 5,
          backgroundColor: "#1a1a1a",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            height: 5,
            width: `${pct * 100}%`,
            backgroundColor: color,
            borderRadius: 3,
          }}
        />
      </View>
      <Text
        style={{
          color,
          fontWeight: "900",
          fontSize: 13,
          fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
          minWidth: 24,
        }}
      >
        {score}
      </Text>
    </View>
  );
};

// ── Component ──────────────────────────────────────────────────────────────────
export const ResultModal = ({
  isVisible,
  onClose,
  result,
}: ResultModalProps) => {
  const slideAnim = useRef(new Animated.Value(600)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 600,
        duration: 200,
        useNativeDriver: true,
      }).start();
      fadeAnim.setValue(0);
    }
  }, [isVisible]);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  if (!result) return null;

  const isMalicious = result.prediction === "MALICIOUS";
  const themeColor = isMalicious ? "#ff4b4b" : "#00ff9d";
  const tierMeta = TIER_META[result.tier_resolved] ?? TIER_META[3];

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      {/* Dimmed backdrop */}
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        {/* Sheet — fixed height so ScrollView has bounded space */}
        <Animated.View
          style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}
        >
          {/* Top accent border */}
          <View style={[styles.topBorder, { backgroundColor: themeColor }]} />

          {/* ── HEADER ── */}
          <View style={styles.header}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: `${themeColor}15` },
              ]}
            >
              <Ionicons
                name={isMalicious ? "warning" : "shield-checkmark"}
                size={22}
                color={themeColor}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.headerVerdict, { color: themeColor }]}>
                {isMalicious ? "THREAT DETECTED" : "URL VERIFIED SAFE"}
              </Text>
              <Text style={styles.headerSub}>
                {isMalicious
                  ? "Do not open — high risk of credential theft."
                  : "No threats found. Safe to proceed."}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close-circle" size={24} color="#2a2a2a" />
            </TouchableOpacity>
          </View>

          {/* ── SCROLLABLE CONTENT ── */}
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Metrics */}
            <View style={styles.metricsRow}>
              <View
                style={[styles.metricCard, { borderColor: `${themeColor}35` }]}
              >
                <Text style={[styles.metricValue, { color: themeColor }]}>
                  {result.confidence.toFixed(1)}
                  <Text style={styles.metricUnit}>%</Text>
                </Text>
                <Text style={styles.metricLabel}>CONFIDENCE</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={[styles.metricValue, { color: "#666" }]}>
                  {result.latency_ms < 1000
                    ? `${Math.round(result.latency_ms)}`
                    : `${(result.latency_ms / 1000).toFixed(1)}s`}
                  <Text style={styles.metricUnit}>
                    {result.latency_ms < 1000 ? "ms" : ""}
                  </Text>
                </Text>
                <Text style={styles.metricLabel}>LATENCY</Text>
              </View>
              <View
                style={[styles.metricCard, { borderColor: `${themeColor}25` }]}
              >
                <Text style={[styles.metricValue, { color: themeColor }]}>
                  T{result.tier_resolved}
                </Text>
                <Text style={styles.metricLabel}>RESOLVED BY</Text>
              </View>
            </View>

            {/* URL */}
            <View style={styles.section}>
              <Text style={styles.sLabel}>// TARGET URL</Text>
              <View style={styles.urlBox}>
                <FontAwesome5
                  name="link"
                  size={11}
                  color="#2a2a2a"
                  style={{ marginTop: 2, marginRight: 8 }}
                />
                <Text style={styles.urlText} selectable numberOfLines={4}>
                  {result.url}
                </Text>
              </View>
            </View>

            {/* Risk Score — Tier 3 only */}
            {result.tier_resolved === 3 && (
              <View style={styles.section}>
                <Text style={styles.sLabel}>// RISK SCORE</Text>
                <View style={styles.infoBox}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      marginBottom: 10,
                    }}
                  >
                    <Text style={styles.infoLabel}>SCORE</Text>
                    <ScoreBar score={result.forensics_score} />
                    <Text style={styles.infoMuted}>/10</Text>
                  </View>
                  <Text style={styles.infoCaption}>
                    Signals accumulate weighted scores. Verdict threshold: 3
                    points. Your URL scored {result.forensics_score}.
                  </Text>
                </View>
              </View>
            )}

            {/* Detection Method */}
            <View style={styles.section}>
              <Text style={styles.sLabel}>// HOW WE DETECTED IT</Text>
              <View
                style={[styles.infoBox, { borderColor: `${themeColor}20` }]}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  <MaterialCommunityIcons
                    name={tierMeta.icon as any}
                    size={18}
                    color={themeColor}
                  />
                  <Text style={[styles.detectionTitle, { color: themeColor }]}>
                    {tierMeta.label}
                  </Text>
                </View>
                <Text style={styles.infoCaption}>{tierMeta.detail}</Text>
              </View>
            </View>

            {/* Signals — Tier 3 only */}
            {result.tier_resolved === 3 && (
              <View style={styles.section}>
                <Text style={styles.sLabel}>
                  // {isMalicious ? "THREAT SIGNALS" : "FORENSIC SIGNALS"}
                  {"  "}
                  <Text style={{ color: "#2a2a2a" }}>
                    ({result.signals.length})
                  </Text>
                </Text>

                {result.signals.length === 0 ? (
                  <View
                    style={[
                      styles.infoBox,
                      { flexDirection: "row", alignItems: "center", gap: 10 },
                    ]}
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color="#00ff9d"
                    />
                    <Text style={{ color: "#00ff9d", fontSize: 12 }}>
                      No suspicious signals detected
                    </Text>
                  </View>
                ) : (
                  <View style={styles.signalsBox}>
                    {result.signals.map((sig, i) => {
                      const c = getSignalColor(sig);
                      return (
                        <View key={i} style={styles.signalRow}>
                          <View
                            style={[styles.signalDot, { backgroundColor: c }]}
                          />
                          <Text style={[styles.signalText, { color: c }]}>
                            {sig}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            )}

            {/* Reason */}
            <View style={styles.reasonRow}>
              <Ionicons
                name="information-circle-outline"
                size={13}
                color="#ede8e8"
              />
              <Text style={styles.reasonText}> {result.reason}</Text>
            </View>
          </ScrollView>

          {/* ── CTA ── */}
          <TouchableOpacity
            style={[styles.cta, { backgroundColor: themeColor }]}
            onPress={handleClose}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaText}>ACKNOWLEDGE REPORT</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.88)",
    justifyContent: "flex-end", // sheet sticks to bottom
  },
  sheet: {
    // ⚠️ KEY FIX: explicit height instead of maxHeight so ScrollView has
    // a bounded container and doesn't collapse to zero.
    height: "88%",
    backgroundColor: "#0a0a0a",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    overflow: "hidden",
  },
  topBorder: { height: 2, width: "100%" },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#111",
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
  },
  headerVerdict: {
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 2,
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
  },
  headerSub: { color: "#f5efef", fontSize: 11, marginTop: 3 },

  // Scroll — flex:1 now works because parent `sheet` has explicit height
  scroll: { flex: 1 },
  scrollContent: { padding: 18, paddingBottom: 30 },

  // Metrics
  metricsRow: { flexDirection: "row", gap: 8, marginBottom: 20 },
  metricCard: {
    flex: 1,
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#1a1a1a",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  metricValue: {
    fontSize: 19,
    fontWeight: "900",
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
  },
  metricUnit: { fontSize: 11, fontWeight: "400" },
  metricLabel: {
    color: "#fbf8f8",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginTop: 5,
  },

  // Sections
  section: { marginBottom: 20 },
  sLabel: {
    color: "#f9f8f8",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    marginBottom: 10,
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
  },

  // URL
  urlBox: {
    backgroundColor: "#0e0e0e",
    borderWidth: 1,
    borderColor: "#1a1a1a",
    borderRadius: 10,
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  urlText: {
    color: "#f8f8f8",
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
    lineHeight: 19,
    flex: 1,
  },

  // Generic info box
  infoBox: {
    backgroundColor: "#0e0e0e",
    borderWidth: 1,
    borderColor: "#1a1a1a",
    borderRadius: 12,
    padding: 14,
  },
  infoLabel: {
    color: "#fbf9f9",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  infoMuted: { color: "#f1eeee", fontSize: 11 },
  infoCaption: { color: "#f1e6e6", fontSize: 11, lineHeight: 18 },

  detectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
    flex: 1,
  },

  // Signals
  signalsBox: {
    backgroundColor: "#0e0e0e",
    borderWidth: 1,
    borderColor: "#1a1a1a",
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  signalRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  signalDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
    flexShrink: 0,
  },
  signalText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 20,
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
  },

  // Reason
  reasonRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  reasonText: { color: "#e8e2e2", fontSize: 11, flex: 1 },

  // CTA
  cta: {
    padding: 18,
    alignItems: "center",
    marginBottom: Platform.OS === "ios" ? 30 : 0,
  },
  ctaText: {
    color: "#212020",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 3,
  },
});
