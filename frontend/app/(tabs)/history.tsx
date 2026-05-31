import React, { useState, useCallback, useMemo } from 'react';
import {
  Text,
  StyleSheet,
  View,
  FlatList,
  ActivityIndicator,
  Platform,
  StatusBar,
  TouchableOpacity,
  Linking,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { MaterialIcons, FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { db, auth } from '../../firebaseConfig';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';

// ── Theme ──────────────────────────────────────────────────────────────────────
const COLORS = {
  bg:           '#0e0e0e',
  card:         '#141414',
  modalBg:      '#141414',
  text:         '#ffffff',
  accent:       '#00ff9d',
  danger:       '#ff4b4b',
  muted:        '#555555',
  border:       '#1e1e1e',
  activeFilter: 'rgba(0, 255, 157, 0.12)',
};

// ── Robust timestamp parser (inlined — no external import needed) ──────────────
const tsToDate = (ts: any): Date | null => {
  if (!ts) return null;
  if (typeof ts.toDate === 'function') return ts.toDate();           // Firestore SDK Timestamp
  if (typeof ts.seconds === 'number')  return new Date(ts.seconds * 1000); // raw { seconds }
  if (typeof ts === 'number')          return new Date(ts);          // unix millis
  if (typeof ts === 'string')          { const d = new Date(ts); return isNaN(d.getTime()) ? null : d; }
  return null;
};

const formatShort = (ts: any): string => {
  const d = tsToDate(ts);
  if (!d) return '—';
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
};

// ── Types ──────────────────────────────────────────────────────────────────────
type Prediction = 'SAFE' | 'MALICIOUS';

type ScanHistory = {
  id:              string;
  url:             string;
  prediction:      Prediction;
  confidence:      number;
  tier_resolved:   1 | 2 | 3;
  forensics_score: number;
  source:          string;
  timestamp:       any;
};

type TimeRange  = 'all' | 'today' | 'week';
type ScanType   = 'all' | 'QR Scan' | 'Manual';
type ResultType = 'all' | 'SAFE' | 'MALICIOUS';

const TIER_LABELS: Record<number, string> = { 1: 'T1', 2: 'T2', 3: 'T3' };

// ── Screen ─────────────────────────────────────────────────────────────────────
export default function HistoryScreen() {
  const [history,    setHistory]    = useState<ScanHistory[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [showFilter, setShowFilter] = useState(false);

  const [filters, setFilters] = useState({
    time:   'all' as TimeRange,
    type:   'all' as ScanType,
    result: 'all' as ResultType,
  });

  // ── Fetch ─────────────────────────────────────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      const fetchHistory = async () => {
        setLoading(true);
        const user = auth.currentUser;
        if (!user) { setLoading(false); return; }
        try {
          const q = query(
            collection(db, 'users', user.uid, 'scans'),
            orderBy('timestamp', 'desc')
          );
          const snap = await getDocs(q);
          const data: ScanHistory[] = [];
          snap.forEach(doc => data.push({ id: doc.id, ...doc.data() } as ScanHistory));
          setHistory(data);
        } catch (e) {
          console.error('Error fetching logs:', e);
        } finally {
          setLoading(false);
        }
      };
      fetchHistory();
    }, [])
  );

  // ── Open URL (safe only) ──────────────────────────────────────────────────────
  const handleOpenLink = async (url: string, prediction: Prediction) => {
    if (prediction !== 'SAFE') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'SECURITY BLOCK 🛡️',
        'Access denied. This URL is flagged as malicious.\n\nOpening malicious links is blocked for your protection.',
        [{ text: 'ACKNOWLEDGED', style: 'cancel' }]
      );
      return;
    }
    try {
      const safeUrl = url.startsWith('http') ? url : `https://${url}`;
      if (await Linking.canOpenURL(safeUrl)) await Linking.openURL(safeUrl);
      else Alert.alert('Error', 'Cannot open this URL.');
    } catch {
      Alert.alert('Error', 'Could not open browser.');
    }
  };

  // ── Filter logic ──────────────────────────────────────────────────────────────
  const filteredHistory = useMemo(() => {
    return history.filter(item => {
      if (filters.result !== 'all' && item.prediction !== filters.result) return false;
      if (filters.type   !== 'all' && item.source    !== filters.type)   return false;
      if (filters.time   !== 'all') {
        const d   = tsToDate(item.timestamp) ?? new Date();  // ← robust parse
        const now = new Date();
        if (filters.time === 'today') {
          if (
            d.getDate()     !== now.getDate()  ||
            d.getMonth()    !== now.getMonth() ||
            d.getFullYear() !== now.getFullYear()
          ) return false;
        } else if (filters.time === 'week') {
          const diff = Math.ceil(Math.abs(now.getTime() - d.getTime()) / 86400000);
          if (diff > 7) return false;
        }
      }
      return true;
    });
  }, [history, filters]);

  const isFilterActive =
    filters.time !== 'all' || filters.type !== 'all' || filters.result !== 'all';

  // ── Render item ───────────────────────────────────────────────────────────────
  const renderItem = ({ item }: { item: ScanHistory }) => {
    const isMalicious = item.prediction === 'MALICIOUS';
    const statusColor = isMalicious ? COLORS.danger : COLORS.accent;
    const tierLabel   = TIER_LABELS[item.tier_resolved] ?? `T${item.tier_resolved}`;
    const dateStr     = formatShort(item.timestamp);  // ← robust, no Invalid Date

    return (
      <View style={[styles.logRow, { borderLeftColor: statusColor }]}>

        <View style={styles.iconBox}>
          <MaterialIcons
            name={isMalicious ? 'gpp-bad' : 'verified-user'}
            size={22}
            color={statusColor}
          />
        </View>

        <View style={styles.logContent}>
          {/* Row 1: timestamp + source + tier badge */}
          <View style={styles.logHeader}>
            <Text style={styles.timestamp}>[{dateStr}]</Text>
            <Text style={styles.logType}>{(item.source ?? 'Manual').toUpperCase()}</Text>
            <View style={[styles.tierBadge, { borderColor: `${statusColor}50` }]}>
              <Text style={[styles.tierText, { color: statusColor }]}>{tierLabel}</Text>
            </View>
          </View>

          {/* Row 2: URL */}
          <Text style={styles.urlText} numberOfLines={1}>{item.url || '—'}</Text>

          {/* Row 3: verdict + confidence */}
          <View style={styles.logFooter}>
            <Text style={[styles.predictionText, { color: statusColor }]}>
              {item.prediction}
            </Text>
            <Text style={styles.confidenceText}>
              {item.confidence != null ? `${item.confidence.toFixed(1)}% conf` : ''}
              {item.tier_resolved === 3 && item.forensics_score > 0
                ? `  ·  score ${item.forensics_score}`
                : ''}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => handleOpenLink(item.url, item.prediction)}
          style={[styles.linkBtn, isMalicious && { opacity: 0.25 }]}
        >
          <FontAwesome5
            name={isMalicious ? 'lock' : 'external-link-alt'}
            size={13}
            color={isMalicious ? COLORS.danger : COLORS.muted}
          />
        </TouchableOpacity>
      </View>
    );
  };

  // ── Filter chip sub-component ─────────────────────────────────────────────────
  const FilterSection = ({
    title, options, selected, onSelect,
  }: {
    title: string; options: string[]; selected: string; onSelect: (v: any) => void;
  }) => (
    <View style={styles.filterGroup}>
      <Text style={styles.filterTitle}>{title}</Text>
      <View style={styles.chipContainer}>
        {options.map(opt => {
          const isSelected = selected === opt;
          const chipColor  = opt === 'MALICIOUS' ? COLORS.danger : COLORS.accent;
          return (
            <TouchableOpacity
              key={opt}
              style={[
                styles.chip,
                isSelected && { borderColor: chipColor, backgroundColor: `${chipColor}18` },
              ]}
              onPress={() => onSelect(opt)}
            >
              <Text style={[styles.chipText, isSelected && { color: chipColor }]}>
                {opt.toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      {/* Header */}
      <View style={styles.terminalHeader}>
        <View>
          <Text style={styles.terminalTitle}>// AUDIT_LOGS</Text>
          <Text style={styles.terminalSubtitle}>
            {filteredHistory.length} record{filteredHistory.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.filterBtn,
            isFilterActive && { borderColor: COLORS.accent, backgroundColor: COLORS.activeFilter },
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowFilter(true);
          }}
        >
          <Ionicons name="filter" size={18} color={isFilterActive ? COLORS.accent : COLORS.muted} />
          {isFilterActive && <View style={styles.activeDot} />}
        </TouchableOpacity>
      </View>

      {/* List */}
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.accent} style={{ marginTop: 60 }} />
      ) : filteredHistory.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="database-off-outline" size={44} color={COLORS.border} />
          <Text style={styles.emptyText}>NO RECORDS FOUND</Text>
        </View>
      ) : (
        <FlatList
          data={filteredHistory}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          style={styles.list}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}

      {/* Filter modal */}
      <Modal
        visible={showFilter}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFilter(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.filterPanel}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>// FILTERS</Text>
              <TouchableOpacity onPress={() => setShowFilter(false)}>
                <Ionicons name="close" size={22} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <FilterSection
                title="TIME RANGE"
                options={['all', 'today', 'week']}
                selected={filters.time}
                onSelect={(v: TimeRange) => setFilters({ ...filters, time: v })}
              />
              <FilterSection
                title="SCAN METHOD"
                options={['all', 'QR Scan', 'Manual']}
                selected={filters.type}
                onSelect={(v: ScanType) => setFilters({ ...filters, type: v })}
              />
              <FilterSection
                title="STATUS"
                options={['all', 'SAFE', 'MALICIOUS']}
                selected={filters.result}
                onSelect={(v: ResultType) => setFilters({ ...filters, result: v })}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.resetBtn}
                onPress={() => {
                  setFilters({ time: 'all', type: 'all', result: 'all' });
                  setShowFilter(false);
                }}
              >
                <Text style={styles.resetText}>RESET</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyBtn}
                onPress={() => setShowFilter(false)}
              >
                <Text style={styles.applyText}>APPLY</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  terminalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  terminalTitle: {
    color: COLORS.accent,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  terminalSubtitle: { color: COLORS.muted, fontSize: 10, marginTop: 3, letterSpacing: 1 },
  filterBtn: {
    padding: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  activeDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accent,
  },

  list: { flex: 1, paddingHorizontal: 14, paddingTop: 14 },

  logRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    marginBottom: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    alignItems: 'center',
  },
  iconBox:    { marginRight: 12 },
  logContent: { flex: 1 },
  logHeader:  { flexDirection: 'row', alignItems: 'center', marginBottom: 5, gap: 8 },
  timestamp: {
    color: COLORS.muted,
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  logType: {
    color: '#444',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    flex: 1,
  },
  tierBadge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  tierText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  urlText: {
    color: '#ccc',
    fontSize: 12,
    marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  logFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  predictionText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  confidenceText: {
    color: '#333',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  linkBtn: { padding: 10 },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', opacity: 0.5 },
  emptyText: {
    color: COLORS.muted,
    marginTop: 12,
    letterSpacing: 2,
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  filterPanel: {
    backgroundColor: COLORS.modalBg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  filterGroup:   { marginBottom: 24 },
  filterTitle:   { color: COLORS.muted, fontSize: 11, fontWeight: '700', marginBottom: 10, letterSpacing: 1.5 },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: COLORS.bg,
  },
  chipText: { color: COLORS.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1 },

  modalFooter: { flexDirection: 'row', marginTop: 16, gap: 12 },
  resetBtn: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
  },
  resetText: { color: COLORS.muted, fontWeight: '700', letterSpacing: 1 },
  applyBtn: {
    flex: 2,
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  applyText: { color: '#000', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
});