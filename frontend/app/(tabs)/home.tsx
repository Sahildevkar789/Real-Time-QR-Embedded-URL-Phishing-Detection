import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  RefreshControl,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { auth, db } from '../../firebaseConfig';
import { collection, query, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { HackerLoader }  from '../../components/HackerLoader';
import { ResultModal }   from '../../components/ResultModal';
import { useUrlScanner } from '../../hooks/useUrlScanner';

// ── Theme ──────────────────────────────────────────────────────────────────────
const COLORS = {
  bg:     '#0e0e0e',
  card:   '#141414',
  text:   '#ffffff',
  accent: '#00ff9d',
  danger: '#ff4b4b',
  muted:  '#555555',
  border: '#1e1e1e',
};

const isValidURL = (s: string) =>
  /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)/g.test(s);

/**
 * Robust timestamp → Date converter.
 * Handles all 3 shapes Firestore can return:
 *   1. SDK Timestamp object  — has .toDate()
 *   2. Plain object          — { seconds, nanoseconds }
 *   3. ISO string / number   — fallback
 */
const tsToDate = (ts: any): Date | null => {
  if (!ts) return null;
  if (typeof ts.toDate === 'function')  return ts.toDate();
  if (typeof ts.seconds === 'number')   return new Date(ts.seconds * 1000);
  if (typeof ts === 'number')           return new Date(ts);
  if (typeof ts === 'string')           { const d = new Date(ts); return isNaN(d.getTime()) ? null : d; }
  return null;
};

const formatDate = (ts: any): string => {
  const d = tsToDate(ts);
  if (!d) return '—';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

// ── Screen ─────────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const [manualUrl,   setManualUrl]   = useState('');
  const [stats,       setStats]       = useState({ safe: 0, threats: 0, total: 0 });
  const [recentScans, setRecentScans] = useState<any[]>([]);
  const [refreshing,  setRefreshing]  = useState(false);
  const [username,    setUsername]    = useState('OPERATIVE');

  const router = useRouter();

  const { loading, result, liveLogs, progress, modalVisible, scanUrl, closeReport } =
    useUrlScanner();

  // ── Dashboard fetch ────────────────────────────────────────────────────────
  const fetchDashboardData = async () => {
    if (!auth.currentUser) return;
    try {
      const userSnap = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userSnap.exists() && userSnap.data().username)
        setUsername(userSnap.data().username.toUpperCase());

      const q = query(
        collection(db, 'users', auth.currentUser.uid, 'scans'),
        orderBy('timestamp', 'desc')   // ← plain string, not a template expression
      );
      const snap = await getDocs(q);
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      let safe = 0, threats = 0;
      docs.forEach((s: any) => {
        if (s.prediction === 'SAFE') safe++;
        else threats++;
      });

      setStats({ safe, threats, total: docs.length });
      setRecentScans(docs.slice(0, 3));
    } catch (e) {
      console.log('Dashboard fetch error:', e);
    }
  };

  useFocusEffect(useCallback(() => { fetchDashboardData(); }, []));

  useEffect(() => {
    if (!loading && !modalVisible) fetchDashboardData();
  }, [loading, modalVisible]);

  const onRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleManualScan = () => {
    const cleaned = manualUrl.trim();
    if (!cleaned) return;
    if (!isValidURL(cleaned)) {
      Alert.alert('Invalid Input', 'Please enter a valid URL.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    scanUrl(cleaned, 'Manual');
    setManualUrl('');
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />
        }
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>WELCOME AGENT,</Text>
            <Text style={styles.username}>{username}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>SYSTEM ACTIVE</Text>
            </View>
            <TouchableOpacity
              style={styles.newsButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/news');
              }}
            >
              <Ionicons name="notifications-outline" size={20} color={COLORS.accent} />
              <View style={styles.newsDot} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Scanner card ── */}
        <View style={styles.actionCard}>
          <Text style={styles.sectionTitle}>// QUICK SCANNER</Text>

          <TouchableOpacity
            style={styles.bigScanBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.replace('/scanner');
            }}
            activeOpacity={0.8}
          >
            <View style={styles.scanIconCircle}>
              <Ionicons name="qr-code-outline" size={50} color="#000" />
            </View>
            <Text style={styles.bigScanText}>SCAN QR CODE</Text>
            <Text style={styles.bigScanSubText}>Detect Scams Instantly</Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>OR CHECK URL</Text>
            <View style={styles.line} />
          </View>

          <View style={styles.manualContainer}>
            <View style={styles.inputWrapper}>
              <FontAwesome5 name="link" size={14} color={COLORS.muted} style={{ marginRight: 10 }} />
              <TextInput
                style={styles.input}
                placeholder="Paste URL to analyze..."
                placeholderTextColor={COLORS.muted}
                value={manualUrl}
                onChangeText={setManualUrl}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <TouchableOpacity
              style={[styles.analyzeBtn, (!manualUrl || loading) && { opacity: 0.4 }]}
              onPress={handleManualScan}
              disabled={!manualUrl || loading}
            >
              <FontAwesome5 name="arrow-right" size={16} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Wi-Fi Sentinel ── */}
        <TouchableOpacity
          style={styles.wifiCard}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/wifi');
          }}
          activeOpacity={0.8}
        >
          <View style={styles.wifiIconBox}>
            <Ionicons name="wifi" size={24} color={COLORS.accent} />
          </View>
          <View style={styles.wifiContent}>
            <Text style={styles.wifiTitle}>WI-FI SENTINEL</Text>
            <Text style={styles.wifiSub}>Detect Network Spies & Rogue Routers</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={COLORS.muted} />
        </TouchableOpacity>

        {/* ── Stats ── */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderColor: COLORS.accent }]}>
            <Text style={[styles.statNumber, { color: COLORS.accent }]}>{stats.safe}</Text>
            <Text style={styles.statLabel}>SECURE SCANS</Text>
          </View>
          <View style={[styles.statCard, { borderColor: COLORS.danger }]}>
            <Text style={[styles.statNumber, { color: COLORS.danger }]}>{stats.threats}</Text>
            <Text style={styles.statLabel}>THREATS BLOCKED</Text>
          </View>
        </View>

        {/* ── Recent scans ── */}
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>// RECENT INTERCEPTS</Text>
          {recentScans.length === 0 ? (
            <Text style={styles.emptyText}>NO DATA LOGGED.</Text>
          ) : (
            recentScans.map((scan, i) => {
              const isMalicious = scan.prediction === 'MALICIOUS';
              const color       = isMalicious ? COLORS.danger : COLORS.accent;
              return (
                <View key={i} style={[styles.recentItem, { borderLeftColor: color }]}>
                  <View style={styles.recentInfo}>
                    <Text style={styles.recentUrl} numberOfLines={1}>{scan.url}</Text>
                    <Text style={styles.recentDate}>
                      {formatDate(scan.timestamp)}  {/* ← robust, no more Invalid Date */}
                    </Text>
                  </View>
                  <View style={[
                    styles.recentBadge,
                    { backgroundColor: isMalicious ? 'rgba(255,75,75,0.1)' : 'rgba(0,255,157,0.1)' },
                  ]}>
                    <Text style={{ color, fontWeight: '900', fontSize: 9, letterSpacing: 1 }}>
                      {scan.prediction}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* ── Loader modal ── */}
      <Modal visible={loading} transparent animationType="fade">
        <View style={styles.loaderOverlay}>
          <View style={styles.loaderBox}>
            <HackerLoader liveLogs={liveLogs} loading={loading} progress={progress} />
          </View>
        </View>
      </Modal>

      {/* ── Result modal ── */}
      <ResultModal isVisible={modalVisible} onClose={closeReport} result={result} />
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: COLORS.bg },
  scrollContent: { padding: 20, paddingBottom: 100 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 12,
  },
  greeting:  { color: COLORS.muted, fontSize: 11, letterSpacing: 1.5 },
  username:  { color: COLORS.text, fontSize: 20, fontWeight: '900', letterSpacing: 1 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,255,157,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  statusDot:  { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.accent, marginRight: 6 },
  statusText: { color: COLORS.accent, fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  newsButton: {
    marginLeft: 10,
    padding: 8,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  newsDot: {
    position: 'absolute',
    top: 5,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.danger,
  },

  actionCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
  },
  sectionTitle: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 18,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  bigScanBtn: {
    backgroundColor: COLORS.text,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    marginBottom: 18,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  scanIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(0,0,0,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  bigScanText:    { color: '#000', fontSize: 17, fontWeight: '900', letterSpacing: 1 },
  bigScanSubText: { color: '#555', fontSize: 12, marginTop: 4 },

  divider:     { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  line:        { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { color: COLORS.muted, fontSize: 10, marginHorizontal: 10, letterSpacing: 1 },

  manualContainer: { flexDirection: 'row', alignItems: 'center' },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    height: 48,
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: COLORS.text,
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  analyzeBtn: {
    width: 48,
    height: 48,
    backgroundColor: COLORS.text,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  wifiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 22,
  },
  wifiIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(0,255,157,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  wifiContent: { flex: 1 },
  wifiTitle:   { color: COLORS.text, fontWeight: '900', fontSize: 15, letterSpacing: 1 },
  wifiSub:     { color: COLORS.muted, fontSize: 11, marginTop: 2 },

  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  statCard: {
    flex: 0.48,
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  statNumber: { fontSize: 28, fontWeight: '900' },
  statLabel:  { color: COLORS.muted, fontSize: 9, marginTop: 5, letterSpacing: 1 },

  recentSection: { marginBottom: 20 },
  recentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: 14,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  recentInfo:  { flex: 1, marginRight: 10 },
  recentUrl: {
    color: COLORS.text,
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    marginBottom: 4,
  },
  recentDate:  { color: COLORS.muted, fontSize: 10 },
  recentBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  emptyText:   { color: COLORS.muted, textAlign: 'center', marginTop: 10, fontSize: 12, letterSpacing: 1 },

  loaderOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.88)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderBox: { width: '90%' },
});