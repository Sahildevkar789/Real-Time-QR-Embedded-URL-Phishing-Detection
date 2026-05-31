import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const COLORS = {
  bg: "#000000",
  card: "#121212",
  text: "#ffffff",
  accent: "#00ff9d",
  muted: "#666666",
  border: "#333333",
};

const PROTOCOLS = [
  {
    id: 1,
    icon: "cloud-upload",
    title: "Data Minimization",
    desc: "We only store the URLs you explicitly scan. We do NOT track your browsing history, cookies, or saved passwords.",
  },
  {
    id: 2,
    icon: "lock",
    title: "Encryption Standard",
    desc: "All communication between your device and our Analysis Engine is encrypted using TLS 1.3. Your scan history is stored in Firebase Firestore with user-scoped security rules.",
  },
  {
    id: 3,
    icon: "share",
    title: "Third-Party Intelligence",
    desc: "To provide accurate threat detection, anonymized URL hashes are cross-referenced with VirusTotal and Google Safe Browsing APIs.",
  },
  {
    id: 4,
    icon: "delete-forever",
    title: "Right to Erasure",
    desc: "You retain full ownership of your data. Using the 'Delete Account' function in your profile instantly wipes all your logs from our servers permanently.",
  },
];

export default function PrivacyScreen() {
  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.navigate("/profile");
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PRIVACY PROTOCOL</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.hero}>
          <MaterialIcons
            name="security"
            size={40}
            color={COLORS.accent}
            style={{ marginBottom: 15 }}
          />
          <Text style={styles.heroTitle}>Your Data. Your Control.</Text>
          <Text style={styles.heroDesc}>
            CyberGuard is built on the principle of "Zero-Knowledge"
            surveillance. We analyze threats, not users.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>// DATA_GOVERNANCE</Text>

        {PROTOCOLS.map((item) => (
          <View key={item.id} style={styles.protocolCard}>
            <View style={styles.iconBox}>
              <MaterialIcons
                name={item.icon as any}
                size={20}
                color={COLORS.accent}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDesc}>{item.desc}</Text>
            </View>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Last Updated: March 2026</Text>
          <Text style={styles.footerText}>Compliance: GDPR / CCPA Ready</Text>
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

  hero: { alignItems: "center", marginBottom: 40, marginTop: 10 },
  heroTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  heroDesc: {
    color: "#bbb",
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

  protocolCard: {
    flexDirection: "row",
    backgroundColor: COLORS.card,
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconBox: { marginRight: 15, marginTop: 2 },
  cardTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  cardDesc: { color: "#888", fontSize: 13, lineHeight: 19 },

  footer: {
    marginTop: 30,
    alignItems: "center",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerText: {
    color: "#444",
    fontSize: 10,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    marginBottom: 5,
  },
});
