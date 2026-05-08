import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/lib/theme';
import { getExamHistory, type ExamAttempt } from '@/lib/db';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'ExamHistory'>;

function fmtDate(ts: number) {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${String(d.getFullYear()).slice(2)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fmtDuration(sec: number | null) {
  if (sec == null) return '';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m${String(s).padStart(2, '0')}`;
}

export default function ExamHistoryScreen({ navigation }: Props) {
  const [tick, setTick] = useState(0);
  useEffect(() => navigation.addListener('focus', () => setTick((t) => t + 1)), [navigation]);

  const exams: ExamAttempt[] = getExamHistory(100);

  if (exams.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📋</Text>
          <Text style={styles.body}>Aucun examen blanc passé pour l'instant.</Text>
          <Pressable
            style={styles.cta}
            onPress={() => navigation.replace('Exam', { count: 30, durationMin: 50 })}
          >
            <Text style={styles.ctaText}>Lancer un premier examen blanc</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const passed = exams.filter((e) => e.score / e.total >= 0.7).length;
  const best = Math.max(...exams.map((e) => Math.round((e.score / e.total) * 100)));
  const avg = Math.round(exams.reduce((s, e) => s + e.score / e.total, 0) / exams.length * 100);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.h1}>Historique examens</Text>

        <View style={styles.row}>
          <Stat value={`${exams.length}`} label="Tentatives" />
          <Stat value={`${passed}`} label="Réussies" />
          <Stat value={`${best} %`} label="Meilleur" />
          <Stat value={`${avg} %`} label="Moyenne" />
        </View>

        <View style={{ gap: 8 }}>
          {exams.map((e) => {
            const pct = Math.round((e.score / e.total) * 100);
            const ok = pct >= 70;
            return (
              <View key={e.id} style={styles.examRow}>
                <Text style={[styles.examIcon, { color: ok ? theme.success : theme.danger }]}>
                  {ok ? '✓' : '✗'}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>
                    {e.score}/{e.total}  •  {pct} %
                  </Text>
                  <Text style={styles.dim}>
                    {fmtDate(e.ts)}
                    {e.durationSec != null ? `  •  ${fmtDuration(e.durationSec)}` : ''}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        <Pressable
          style={styles.cta}
          onPress={() => navigation.replace('Exam', { count: 30, durationMin: 50 })}
        >
          <Text style={styles.ctaText}>Nouvel examen blanc</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  container: { padding: 20, gap: 16 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30, gap: 14 },
  emptyEmoji: { fontSize: 56 },
  body: { color: theme.text, fontSize: 16, textAlign: 'center' },
  h1: { color: theme.text, fontSize: 26, fontWeight: '700' },
  row: { flexDirection: 'row', gap: 8 },
  stat: {
    flex: 1,
    backgroundColor: theme.card,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  statValue: { color: theme.text, fontSize: 16, fontWeight: '700' },
  statLabel: { color: theme.textDim, fontSize: 11, marginTop: 2 },
  examRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.card,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  examIcon: { fontSize: 22, fontWeight: '700' },
  rowTitle: { color: theme.text, fontSize: 15, fontWeight: '600' },
  dim: { color: theme.textDim, fontSize: 12, marginTop: 2 },
  cta: {
    marginTop: 8,
    backgroundColor: theme.warn,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  ctaText: { color: '#fff', fontWeight: '700' },
});
