import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/lib/theme';
import { lessonById } from '@/lib/lessons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Lesson'>;

export default function LessonScreen({ route, navigation }: Props) {
  const lesson = lessonById(route.params.id);
  if (!lesson) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.body}>Leçon introuvable.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.module}>{lesson.module}</Text>
        <Text style={styles.title}>{lesson.title}</Text>
        <Text style={styles.dim}>~{lesson.durationMin} min</Text>
        <View style={styles.divider} />
        <Text style={styles.body}>{lesson.content}</Text>
        <Pressable
          style={styles.cta}
          onPress={() => navigation.replace('Quiz', { id: lesson.id })}
        >
          <Text style={styles.ctaText}>Passer au quiz</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  container: { padding: 20, gap: 8 },
  module: { color: theme.primary, fontWeight: '700', letterSpacing: 1 },
  title: { color: theme.text, fontSize: 24, fontWeight: '700' },
  dim: { color: theme.textDim },
  divider: { height: 1, backgroundColor: theme.border, marginVertical: 12 },
  body: { color: theme.text, fontSize: 16, lineHeight: 24 },
  cta: {
    marginTop: 24,
    backgroundColor: theme.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  ctaText: { color: '#fff', fontWeight: '700' },
});
