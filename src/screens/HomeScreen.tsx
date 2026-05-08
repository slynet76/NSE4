import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/lib/theme';
import { ALL_LESSONS, pickTodayLesson } from '@/lib/lessons';
import { getAllProgress, getStreak } from '@/lib/db';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const [tick, setTick] = useState(0);
  const refresh = () => setTick((t) => t + 1);

  useEffect(() => {
    const unsub = navigation.addListener('focus', refresh);
    return unsub;
  }, [navigation]);

  const today = pickTodayLesson();
  const streak = getStreak();
  const progress = getAllProgress();
  const done = progress.filter((p) => p.status === 'done').length;
  const total = ALL_LESSONS.length;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.h1}>NSE4 Daily</Text>
            <Text style={styles.dim}>Un peu chaque jour, comme Duolingo.</Text>
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

        <Pressable
          style={styles.secondary}
          onPress={() => navigation.navigate('Progress')}
        >
          <Text style={styles.secondaryText}>Voir ma progression</Text>
        </Pressable>
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
  secondary: {
    paddingVertical: 14,
    borderRadius: 12,
    borderColor: theme.border,
    borderWidth: 1,
    alignItems: 'center',
  },
  secondaryText: { color: theme.text, fontWeight: '600' },
});
