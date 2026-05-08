import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/lib/theme';
import { pickExamQuestions, passingScore } from '@/lib/lessons';
import { recordExamAttempt } from '@/lib/db';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Exam'>;

function fmtMmSs(sec: number) {
  if (sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function ExamScreen({ route, navigation }: Props) {
  const count = route.params?.count ?? 30;
  const durationMin = route.params?.durationMin ?? 50; // proportional to NSE4 (105 min / 60 Q)
  const questions = useMemo(() => pickExamQuestions(count), [count]);
  const startedAt = useRef<number>(Date.now());
  const deadline = useRef<number>(Date.now() + durationMin * 60_000);

  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [remaining, setRemaining] = useState<number>(durationMin * 60);
  const finalScoreRef = useRef(0);
  const finishedRef = useRef(false);

  // Countdown — ticks every second; auto-finish at zero.
  useEffect(() => {
    if (done) return;
    const t = setInterval(() => {
      const rem = Math.max(0, Math.round((deadline.current - Date.now()) / 1000));
      setRemaining(rem);
      if (rem === 0 && !finishedRef.current) {
        finishedRef.current = true;
        finishExam(finalScoreRef.current, true);
      }
    }, 1000);
    return () => clearInterval(t);
  }, [done]);

  function finishExam(finalScore: number, byTimeout: boolean) {
    const dur = Math.round((Date.now() - startedAt.current) / 1000);
    recordExamAttempt(finalScore, questions.length, dur);
    setScore(finalScore);
    setDone(true);
    if (byTimeout) {
      Alert.alert('Temps écoulé', `Examen terminé. Score : ${finalScore}/${questions.length}.`);
    }
  }

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
          <Pressable style={styles.secondary} onPress={() => navigation.navigate('ExamHistory')}>
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
  const lowTime = remaining <= 60;

  function next() {
    const finalScore = score + (isCorrect ? 1 : 0);
    setScore(finalScore);
    finalScoreRef.current = finalScore;
    const nextIdx = idx + 1;
    if (nextIdx >= total) {
      finishedRef.current = true;
      finishExam(finalScore, false);
      return;
    }
    setIdx(nextIdx);
    setPicked(null);
  }

  function confirmGiveUp() {
    Alert.alert(
      "Abandonner l'examen ?",
      `Le résultat sera enregistré : ${score}/${total} (incomplet).`,
      [
        { text: 'Continuer', style: 'cancel' },
        {
          text: 'Abandonner',
          style: 'destructive',
          onPress: () => {
            finishedRef.current = true;
            finishExam(score + (isCorrect ? 1 : 0), false);
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.topbar}>
          <Text style={styles.dim}>
            Q {idx + 1} / {total}  •  Score : {score}
          </Text>
          <Pressable onPress={confirmGiveUp} hitSlop={8}>
            <Text style={[styles.timer, lowTime && styles.timerDanger]}>⏱ {fmtMmSs(remaining)}</Text>
          </Pressable>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${pctProgress}%` }]} />
        </View>

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
          <Text style={styles.ctaText}>{idx + 1 === total ? "Terminer l'examen" : 'Suivant'}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  container: { padding: 20, gap: 8 },
  center: { flex: 1, padding: 20, alignItems: 'center', justifyContent: 'center', gap: 12 },
  topbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timer: {
    color: theme.text,
    fontSize: 18,
    fontWeight: '800',
    fontFamily: 'monospace',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: theme.card,
  },
  timerDanger: { color: theme.danger, backgroundColor: '#3b0d0d' },
  title: { color: theme.text, fontSize: 22, fontWeight: '700', marginTop: 8 },
  body: { color: theme.text, fontSize: 16 },
  dim: { color: theme.textDim, fontSize: 13 },
  bigEmoji: { fontSize: 56 },
  progressTrack: {
    height: 8,
    backgroundColor: theme.card,
    borderRadius: 4,
    overflow: 'hidden',
    marginVertical: 6,
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
