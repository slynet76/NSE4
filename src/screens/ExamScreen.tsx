import React, { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/lib/theme';
import { pickExamQuestions, passingScore } from '@/lib/lessons';
import { recordExamAttempt } from '@/lib/db';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Exam'>;

export default function ExamScreen({ route, navigation }: Props) {
  const count = route.params?.count ?? 30;
  const questions = useMemo(() => pickExamQuestions(count), [count]);
  const startedAt = useRef<number>(Date.now());
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const total = questions.length;
  const pass = useMemo(() => passingScore(total), [total]);

  if (done) {
    const passed = score >= pass;
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.bigEmoji}>{passed ? '🏆' : '📚'}</Text>
          <Text style={styles.title}>{passed ? 'Examen réussi !' : 'Pas encore...'}</Text>
          <Text style={styles.body}>
            Score : {score}/{total} — réussite à {pass} ({Math.round((pass / total) * 100)} %)
          </Text>
          <Text style={styles.dim}>Résultat enregistré dans l'historique.</Text>
          <Pressable style={styles.cta} onPress={() => navigation.popToTop()}>
            <Text style={styles.ctaText}>Retour à l'accueil</Text>
          </Pressable>
          <Pressable style={styles.secondary} onPress={() => navigation.navigate('Progress')}>
            <Text style={styles.secondaryText}>Voir l'historique</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const q = questions[idx];
  const isAnswered = picked !== null;
  const isCorrect = picked === q.answer;
  const pctProgress = ((idx + (isAnswered ? 1 : 0)) / total) * 100;

  function next() {
    const finalScore = score + (isCorrect ? 1 : 0);
    const nextIdx = idx + 1;
    if (nextIdx >= total) {
      setScore(finalScore);
      const dur = Math.round((Date.now() - startedAt.current) / 1000);
      recordExamAttempt(finalScore, total, dur);
      setDone(true);
      return;
    }
    setScore(finalScore);
    setIdx(nextIdx);
    setPicked(null);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${pctProgress}%` }]} />
        </View>
        <Text style={styles.dim}>
          Examen — Question {idx + 1} / {total}  •  Score actuel : {score}
        </Text>
        <Text style={styles.title}>{q.q}</Text>
        <View style={{ gap: 10, marginTop: 16 }}>
          {q.choices.map((c, i) => {
            const state =
              !isAnswered ? 'idle'
                : i === q.answer ? 'correct'
                : i === picked ? 'wrong'
                : 'idle';
            return (
              <Pressable
                key={i}
                disabled={isAnswered}
                onPress={() => setPicked(i)}
                style={[styles.choice, state === 'correct' && styles.correct, state === 'wrong' && styles.wrong]}
              >
                <Text style={styles.choiceText}>{c}</Text>
              </Pressable>
            );
          })}
        </View>

        {isAnswered && q.explain ? (
          <View style={styles.explain}>
            <Text style={styles.dim}>{q.explain}</Text>
          </View>
        ) : null}

        <Pressable
          style={[styles.cta, !isAnswered && styles.ctaDisabled]}
          disabled={!isAnswered}
          onPress={next}
        >
          <Text style={styles.ctaText}>{idx + 1 === total ? 'Terminer l\'examen' : 'Suivant'}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  container: { padding: 20, gap: 8 },
  center: { flex: 1, padding: 20, alignItems: 'center', justifyContent: 'center', gap: 12 },
  title: { color: theme.text, fontSize: 22, fontWeight: '700', marginTop: 8 },
  body: { color: theme.text, fontSize: 16 },
  dim: { color: theme.textDim, fontSize: 13 },
  bigEmoji: { fontSize: 56 },
  progressTrack: {
    height: 8,
    backgroundColor: theme.card,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: { height: 8, backgroundColor: theme.primary },
  choice: {
    backgroundColor: theme.card,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  choiceText: { color: theme.text, fontSize: 15 },
  correct: { borderColor: theme.success, backgroundColor: '#102b1e' },
  wrong: { borderColor: theme.danger, backgroundColor: '#2b1010' },
  explain: {
    marginTop: 12,
    padding: 12,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: theme.card,
  },
  cta: {
    marginTop: 20,
    backgroundColor: theme.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  ctaDisabled: { opacity: 0.4 },
  ctaText: { color: '#fff', fontWeight: '700' },
  secondary: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderColor: theme.border,
    borderWidth: 1,
  },
  secondaryText: { color: theme.text, fontWeight: '600' },
});
