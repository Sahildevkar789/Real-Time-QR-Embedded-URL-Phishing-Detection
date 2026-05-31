import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import {
  Linking,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

const COLORS = {
  bg: "#000000",
  card: "#121212",
  text: "#ffffff",
  accent: "#00ff9d",
  muted: "#666666",
  border: "#333333",
};

const ENGINE_STEPS = [
  {
    id: 1,
    title: "Global Database Scan",
    desc: "We check the URL against VirusTotal's database of 70+ security vendors to find known threats instantly.",
    icon: "database",
  },
  {
    id: 2,
    title: "Domain Forensics",
    desc: "We analyze the SSL certificate, domain age, and registrar data to detect 'fly-by-night' scam sites.",
    icon: "search",
  },
  {
    id: 3,
    title: "Content Analysis",
    desc: "Our Python crawler visits the site, hunting for hidden login forms, fake logos, and malicious code.",
    icon: "code",
  },
];

export default function AboutScreen() {
  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.navigate("/profile");
  };

  const openPortfolio = () => {
    Haptics.selectionAsync();
    Linking.openURL("https://github.com/sanchitgharat-07");
  };

  const openSahilPortfolio = () => {
    Haptics.selectionAsync();
    Linking.openURL("https://github.com/sahildevkar789");
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SYSTEM ARCHITECTURE</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* HERO SECTION */}
        <View style={styles.heroSection}>
          <View style={styles.logoCircle}>
            <FontAwesome5 name="shield-alt" size={40} color={COLORS.accent} />
          </View>
          <Text style={styles.appName}>CyberGuard AI</Text>
          <Text style={styles.version}>v2.0.0 (Stable)</Text>
          <Text style={styles.missionText}>
            Our mission is to democratize digital security. We combine global
            threat intelligence with real-time forensic analysis to stop
            phishing attacks before they happen.
          </Text>
        </View>

        {/* HOW IT WORKS */}
        <Text style={styles.sectionTitle}>// THE ENGINE</Text>

        <View style={styles.engineContainer}>
          {ENGINE_STEPS.map((step, index) => (
            <View key={step.id} style={styles.stepRow}>
              {/* Timeline Line */}
              <View style={styles.timelineColumn}>
                <View style={styles.iconBox}>
                  <FontAwesome5 name={step.icon} size={14} color="#000" />
                </View>
                {index !== ENGINE_STEPS.length - 1 && (
                  <View style={styles.line} />
                )}
              </View>

              {/* Content */}
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDesc}>{step.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* DEVELOPER CARDS */}
        <Text style={styles.sectionTitle}>// ARCHITECTS</Text>

        <TouchableOpacity style={styles.devCard} onPress={openPortfolio}>
          <View style={styles.devAvatar}>
            <Text style={{ fontSize: 16, fontWeight: "bold" }}>SG</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.devName}>Sanchit Gharat</Text>
            <Text style={styles.devRole}>
              Lead Developer & Security Researcher
            </Text>
          </View>
          <Ionicons name="logo-github" size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.devCard} onPress={openSahilPortfolio}>
          <View style={[styles.devAvatar, { backgroundColor: COLORS.accent }]}>
            <Text style={{ fontSize: 16, fontWeight: "bold", color: "#000" }}>SD</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.devName}>Sahil Devkar</Text>
            <Text style={styles.devRole}>
              Lead Developer & Systems Architect
            </Text>
          </View>
          <Ionicons name="logo-github" size={24} color="#fff" />
        </TouchableOpacity>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.copyright}>
            © 2025 CyberGuard Security. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 2,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  backBtn: { padding: 5 },

  scrollContent: { padding: 25, paddingBottom: 100 },

  heroSection: { alignItems: "center", marginBottom: 40 },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(0, 255, 157, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  appName: { color: "#fff", fontSize: 28, fontWeight: "bold", marginBottom: 5 },
  version: {
    color: COLORS.muted,
    fontSize: 12,
    marginBottom: 20,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  missionText: {
    color: "#ccc",
    textAlign: "center",
    lineHeight: 22,
    fontSize: 14,
    paddingHorizontal: 10,
  },

  sectionTitle: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 2,
    marginBottom: 20,
  },

  // TIMELINE STYLES
  engineContainer: { marginBottom: 30 },
  stepRow: { flexDirection: "row", marginBottom: 0 },
  timelineColumn: { alignItems: "center", marginRight: 15, width: 30 },
  iconBox: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.accent,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: COLORS.border,
    marginVertical: 5,
  },

  stepContent: { flex: 1, paddingBottom: 30 },
  stepTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  stepDesc: { color: "#888", fontSize: 13, lineHeight: 18 },

  // DEV CARD
  devCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 15,
  },
  devAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  devName: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  devRole: { color: COLORS.muted, fontSize: 11 },

  footer: { alignItems: "center" },
  copyright: { color: "#444", fontSize: 10, marginBottom: 5 },
  buildId: {
    color: "#333",
    fontSize: 10,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
});
