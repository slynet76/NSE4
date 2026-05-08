import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/lib/theme';
import { ALL_LESSONS } from '@/lib/lessons';
import { getAllProgress, getExamHistory, type ExamAttempt } from '@/lib/db';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Progress'>;

function fmtDate(ts: number) {
  const d = new Date(ts);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(2);
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yy} ${hh}:${mi}`;
}

function fmtDuration(sec: number | null) {
  if (sec == null) return '';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return ` • ${m}m${String(s).padStart(2, '0')}`;
}

export default function ProgressScreen({ navigation }: Props) {
  const [tick, setTick] = useState(0);
  useEffect(() => navigation.addListener('focus', () => setTick((t) => t + 1)), [navigation]);

  const map = new Map(getAllProgress().map((p) => [p.lessonId, p]));
  const modules = Array.from(new Set(ALL_LESSONS.map((l) => l.module)));
  const exams: ExamAttempt[] = getExamHistory(20);
  const done = ALL_LESSONS.filter((l) => map.get(l.id)?.status === 'done').length;
  const total = ALL_LESSONS.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.h1}>Progression</Text>

        <View style={styles.progressBlock}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Leçons validées</Text>
            <Text style={styles.progressValue}>{done}/{total} — {pct} %</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${pct}%` }]} />
          </View>
        </View>

        {exams.length > 0 && (
          <View style={{ gap: 8 }}>
            <Text style={styles.module}>Historique des examens blancs</Text>
            {exams.map((e) => {
              const pctScore = Math.round((e.score / e.total) * 100);
              const passed = pctScore >= 70;
              return (
                <View key={e.id} style={styles.examRow}>
                  <Text style={[styles.examIcon, { color: passed ? theme.success : theme.danger }]}>
                    {passed ? '✓' : '✗'}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>
                      {e.score}/{e.total} ({pctScore} %)
                    </Text>
                    <Text style={styles.dim}>
                      {fmtDate(e.ts)}{fmtDuration(e.durationSec)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {modules.map((mod) => (
          <View key={mod} style={{ gap: 8 }}>
            <Text style={styles.module}>{mod}</Text>
            {ALL_LESSONS.filter((l) => l.module === mod).map((l) => {
              const p = map.get(l.id);
              const status = p?.status ?? 'available';
              const icon = status === 'done' ? '✅' : status === 'failed' ? '❌' : '○';
              return (
                <Pressable
                  key={l.id}
                  style={styles.row}
                  onPress={() => navigation.navigate('Lesson', { id: l.id })}
                >
                  <Text style={styles.rowIcon}>{icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{l.title}</Text>
                    {p?.score != null && (
                      <Text style={styles.dim}>Dernier score : {p.score}</Text>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  container: { padding: 20, gap: 18 },
  h1: { color: theme.text, fontSize: 26, fontWeight: '700' },
  module: { color: theme.primary, fontWeight: '700', letterSpacing: 1 },
  progressBlock: {
    backgroundColor: theme.card,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { color: theme.textDim, fontSize: 13, letterSpacing: 1 },
  progressValue: { color: theme.text, fontWeight: '700', fontSize: 15 },
  progressTrack: { height: 10, backgroundColor: theme.bg, borderRadius: 5, overflow: 'hidden' },
  progressFill: { height: 10, backgroundColor: theme.primary },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.card,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  rowIcon: { fontSize: 18 },
  rowTitle: { color: theme.text, fontSize: 15, fontWeight: '600' },
  dim: { color: theme.textDim, fontSize: 12, marginTop: 2 },
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
});
