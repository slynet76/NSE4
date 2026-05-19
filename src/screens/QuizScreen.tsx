import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/lib/theme';
import { lessonById, passingScore, pickQuizQuestions } from '@/lib/lessons';
import { setLessonResult } from '@/lib/db';
import { useLang } from '@/context/LanguageContext';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Quiz'>;

export default function QuizScreen({ route, navigation }: Props) {
  const { lessons } = useLang();
  const lesson = lessonById(route.params.id, lessons);
  // Pick a random selection ONCE at mount — preserved through the run.
  const questions = useMemo(() => (lesson ? pickQuizQuestions(lesson, 5) : []), [lesson]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const total = questions.length;
  const pass = useMemo(() => passingScore(total), [total]);

  if (!lesson) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.body}>Leçon introuvable.</Text>
      </SafeAreaView>
    );
  }

  if (done) {
    const passed = score >= pass;
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.bigEmoji}>{passed ? '🎉' : '💪'}</Text>
          <Text style={styles.title}>{passed ? 'Bravo !' : 'Presque !'}</Text>
          <Text style={styles.body}>
            Score : {score}/{total} (réussite à {pass})
          </Text>
          <Pressable style={styles.cta} onPress={() => navigation.popToTop()}>
            <Text style={styles.ctaText}>Retour à l'accueil</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const q = questions[idx];
  const isAnswered = picked !== null;
  const isCorrect = picked === q.answer;

  function next() {
    const nextIdx = idx + 1;
    if (nextIdx >= total) {
      const finalScore = score + (isCorrect ? 1 : 0);
      setScore(finalScore);
      setLessonResult(lesson!.id, finalScore, finalScore >= pass);
      setDone(true);
      return;
    }
    if (isCorrect) setScore((s) => s + 1);
    setIdx(nextIdx);
    setPicked(null);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.dim}>
          Question {idx + 1} / {total}
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
          <Text style={styles.ctaText}>{idx + 1 === total ? 'Terminer' : 'Suivant'}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  container: { padding: 20, gap: 8 },
  center: { flex: 1, padding: 20, alignItems: 'center', justifyContent: 'center', gap: 12 },
  title: { color: theme.text, fontSize: 22, fontWeight: '700' },
  body: { color: theme.text, fontSize: 16 },
  dim: { color: theme.textDim },
  bigEmoji: { fontSize: 56 },
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
});
