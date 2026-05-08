import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/lib/theme';
import { ALL_LESSONS } from '@/lib/lessons';
import { getAllProgress } from '@/lib/db';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Progress'>;

export default function ProgressScreen({ navigation }: Props) {
  const [tick, setTick] = useState(0);
  useEffect(() => navigation.addListener('focus', () => setTick((t) => t + 1)), [navigation]);

  const map = new Map(getAllProgress().map((p) => [p.lessonId, p]));
  const modules = Array.from(new Set(ALL_LESSONS.map((l) => l.module)));

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.h1}>Progression</Text>
        {modules.map((mod) => (
          <View key={mod} style={{ gap: 8 }}>
            <Text style={styles.module}>{mod}</Text>
            {ALL_LESSONS.filter((l) => l.module === mod).map((l) => {
              const p = map.get(l.id);
              const status = p?.status ?? 'available';
              const icon =
                status === 'done' ? '✅' : status === 'failed' ? '❌' : '○';
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
                      <Text style={styles.dim}>Score : {p.score}/{l.quiz.length}</Text>
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
});
