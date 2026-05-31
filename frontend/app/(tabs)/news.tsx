import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import axios from "axios";
import * as Haptics from "expo-haptics";
import { router, useFocusEffect } from "expo-router"; // Ensure router is imported
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  RefreshControl,
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
  danger: "#ff4b4b",
  muted: "#888888",
  border: "#222222",
};

const API_URL = "http://192.168.29.54:5000/news";

const DAILY_TIPS = [
  { id: 1, title: "Password Hygiene", desc: "Use a Manager.", icon: "key" },
  { id: 2, title: "Phishing Checks", desc: "Check URL typos.", icon: "fish" },
  { id: 3, title: "VPN Usage", desc: "Always on public Wi-Fi.", icon: "wifi" },
];

export default function NewsScreen() {
  const [newsFeed, setNewsFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // --- SAFE BACK NAVIGATION ---
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      // Fallback: If no history, force navigate to Dashboard
      router.replace("/(tabs)/home");
    }
  };

  const getHeroImage = (type: string) => {
    switch (type) {
      case "MALWARE":
        return "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1000&auto=format&fit=crop";
      case "BREACH":
        return "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1000&auto=format&fit=crop";
      case "PATCH":
        return "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1000&auto=format&fit=crop";
      case "ALERT":
        return "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?q=80&w=1000&auto=format&fit=crop";
      default:
        return "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?q=80&w=1000&auto=format&fit=crop";
    }
  };

  const fetchNews = async () => {
    try {
      console.log("Fetching news...");
      const response = await axios.get(API_URL);
      setNewsFeed(response.data);
    } catch (error) {
      console.error("News Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchNews();
    }, []),
  );

  const onRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await fetchNews();
    setRefreshing(false);
  }, []);

  const openLink = (url: string) => {
    Haptics.selectionAsync();
    Linking.openURL(url);
  };

  const formatDate = (timestampArray: any) => "Today";

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {/* UPDATED BACK BUTTON */}
          <TouchableOpacity onPress={handleBack} style={{ marginRight: 15 }}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Discover</Text>
        </View>
        <TouchableOpacity style={styles.settingsBtn}>
          <Image
            source={{
              uri: "https://ui-avatars.com/api/?name=Operative&background=00ff9d&color=000",
            }}
            style={styles.avatar}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.accent}
          />
        }
      >
        {/* STORIES */}
        <View style={{ marginBottom: 25 }}>
          <Text style={styles.sectionLabel}>DAILY BRIEFING</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ paddingLeft: 20 }}
          >
            {DAILY_TIPS.map((tip, index) => (
              <View
                key={tip.id}
                style={[styles.storyCard, index === 0 && { marginLeft: 0 }]}
              >
                <View style={styles.storyIconCircle}>
                  <FontAwesome5 name={tip.icon} size={14} color="#000" />
                </View>
                <View>
                  <Text style={styles.storyTitle}>{tip.title}</Text>
                  <Text style={styles.storyDesc}>{tip.desc}</Text>
                </View>
              </View>
            ))}
            <View style={{ width: 40 }} />
          </ScrollView>
        </View>

        {/* FEED */}
        <Text style={[styles.sectionLabel, { marginLeft: 20 }]}>
          HIGH VOLTAGE INTEL
        </Text>

        {loading ? (
          <ActivityIndicator
            size="large"
            color={COLORS.accent}
            style={{ marginTop: 50 }}
          />
        ) : newsFeed.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Intel Feed Offline.</Text>
            <Text style={{ color: "#666", fontSize: 10, marginTop: 5 }}>
              Check Backend Connection
            </Text>
          </View>
        ) : (
          newsFeed.map((news, index) => (
            <TouchableOpacity
              key={index}
              style={styles.discoverCard}
              onPress={() => openLink(news.url)}
              activeOpacity={0.9}
            >
              <Image
                source={{ uri: news.imageUrl || getHeroImage(news.type) }}
                style={styles.cardImage}
                resizeMode="cover"
              />

              <View style={styles.cardContent}>
                <Text style={styles.cardTitle} numberOfLines={3}>
                  {news.title}
                </Text>
                <Text style={styles.cardSummary} numberOfLines={2}>
                  {news.summary}
                </Text>

                <View style={styles.cardFooter}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View style={styles.favicon}>
                      <Text
                        style={{
                          color: "#fff",
                          fontSize: 10,
                          fontWeight: "bold",
                        }}
                      >
                        {(news.source || "N").charAt(0)}
                      </Text>
                    </View>
                    <Text style={styles.sourceName}>{news.source}</Text>
                    <Text style={styles.dot}>•</Text>
                    {/* TYPE BADGE */}
                    <View
                      style={[
                        styles.typeBadge,
                        {
                          borderColor:
                            news.type === "MALWARE"
                              ? COLORS.danger
                              : COLORS.accent,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.typeText,
                          {
                            color:
                              news.type === "MALWARE"
                                ? COLORS.danger
                                : COLORS.accent,
                          },
                        ]}
                      >
                        {news.type}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
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
    backgroundColor: COLORS.bg,
  },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "bold" },
  avatar: { width: 30, height: 30, borderRadius: 15 },
  settingsBtn: { padding: 5 },

  scrollContent: { paddingBottom: 100 },
  sectionLabel: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 1,
    marginBottom: 15,
    marginLeft: 20,
  },

  storyCard: {
    width: 140,
    height: 100,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 15,
    marginRight: 12,
    justifyContent: "space-between",
  },
  storyIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.accent,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  storyTitle: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 2,
  },
  storyDesc: { color: "#888", fontSize: 10, lineHeight: 12 },

  discoverCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    marginHorizontal: 20,
    marginBottom: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#222",
  },
  cardImage: { width: "100%", height: 180, opacity: 0.9 },
  cardContent: { padding: 20 },
  cardTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    lineHeight: 24,
    marginBottom: 8,
  },
  cardSummary: {
    color: "#aaa",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },

  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  favicon: {
    width: 16,
    height: 16,
    borderRadius: 4,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  sourceName: { color: "#ccc", fontSize: 12, fontWeight: "500" },
  dot: { color: "#555", marginHorizontal: 6, fontSize: 10 },
  typeBadge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  typeText: { fontSize: 8, fontWeight: "bold" },

  emptyContainer: { alignItems: "center", marginTop: 50 },
  emptyText: { color: COLORS.muted, fontSize: 16 },
});
