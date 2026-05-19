import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/lib/theme';
import { pickTodayLesson, totalAvailableQuestions } from '@/lib/lessons';
import { getAllProgress, getStreak, getExamHistory } from '@/lib/db';
import { useLang } from '@/context/LanguageContext';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const [tick, setTick] = useState(0);
  const refresh = () => setTick((t) => t + 1);
  const { lessons } = useLang();

  useEffect(() => {
    const unsub = navigation.addListener('focus', refresh);
    return unsub;
  }, [navigation]);

  const today = pickTodayLesson(lessons);
  const streak = getStreak();
  const progress = getAllProgress();
  const done = progress.filter((p) => p.status === 'done').length;
  const total = lessons.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const totalQ = totalAvailableQuestions(lessons);
  const lastExam = getExamHistory(1)[0];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.h1}>NSE4 Daily</Text>
          </View>
          <Pressable onPress={() => navigation.navigate('Settings')} hitSlop={10}>
            <Text style={styles.gear}>⚙︎</Text>
          </Pressable>
        </View>

        <View style={styles.row}>
          <Stat label="Streak" value={`🔥 ${streak.current}`} />
          <Stat label="Record" value={`${streak.best}`} />
          <Stat label="Leçons" value={`${done}/${total}`} />
        </View>

        <View style={styles.progressBlock}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Progression globale</Text>
            <Text style={styles.progressValue}>{pct} %</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${pct}%` }]} />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Aujourd'hui</Text>
          <Text style={styles.cardTitle}>{today.title}</Text>
          <Text style={styles.dim}>
            {today.module} • ~{today.durationMin} min
          </Text>
          <Pressable
            style={styles.cta}
            onPress={() => navigation.navigate('Lesson', { id: today.id })}
          >
            <Text style={styles.ctaText}>Commencer la leçon</Text>
          </Pressable>
        </View>

        <View style={styles.examCard}>
          <Text style={styles.examLabel}>Examen blanc</Text>
          <Text style={styles.examTitle}>30 questions • 50 min • chrono</Text>
          <Text style={styles.dim}>
            Banque de {totalQ} questions • réussite à 70 %
            {lastExam ? ` • dernier : ${lastExam.score}/${lastExam.total}` : ''}
          </Text>
          <Pressable
            style={styles.examCta}
            onPress={() => navigation.navigate('Exam', { count: 30, durationMin: 50 })}
          >
            <Text style={styles.ctaText}>Lancer un examen blanc</Text>
          </Pressable>
        </View>

        <View style={styles.row}>
          <Pressable style={styles.secondaryFlex} onPress={() => navigation.navigate('Progress')}>
            <Text style={styles.secondaryText}>📚 Progression</Text>
          </Pressable>
          <Pressable style={styles.secondaryFlex} onPress={() => navigation.navigate('ExamHistory')}>
            <Text style={styles.secondaryText}>📋 Historique</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.dim}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  container: { padding: 20, gap: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  h1: { color: theme.text, fontSize: 26, fontWeight: '700' },
  dim: { color: theme.textDim, fontSize: 13 },
  gear: { color: theme.text, fontSize: 24 },
  row: { flexDirection: 'row', gap: 10 },
  stat: {
    flex: 1,
    backgroundColor: theme.card,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statValue: { color: theme.text, fontSize: 18, fontWeight: '700' },
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
  progressValue: { color: theme.text, fontWeight: '700', fontSize: 16 },
  progressTrack: { height: 10, backgroundColor: theme.bg, borderRadius: 5, overflow: 'hidden' },
  progressFill: { height: 10, backgroundColor: theme.primary },
  card: {
    backgroundColor: theme.card,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    gap: 6,
  },
  cardLabel: { color: theme.primary, fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  cardTitle: { color: theme.text, fontSize: 20, fontWeight: '700' },
  cta: {
    marginTop: 12,
    backgroundColor: theme.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  ctaText: { color: '#fff', fontWeight: '700' },
  examCard: {
    backgroundColor: theme.card,
    borderColor: theme.warn,
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    gap: 6,
  },
  examLabel: { color: theme.warn, fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  examTitle: { color: theme.text, fontSize: 18, fontWeight: '700' },
  examCta: {
    marginTop: 12,
    backgroundColor: theme.warn,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryFlex: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderColor: theme.border,
    borderWidth: 1,
    alignItems: 'center',
  },
  secondaryText: { color: theme.text, fontWeight: '600' },
});
