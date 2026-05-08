import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Markdown, { MarkdownIt } from 'react-native-markdown-display';
import { SvgXml } from 'react-native-svg';
import { theme } from '@/lib/theme';
import { lessonById } from '@/lib/lessons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Lesson'>;

const md = MarkdownIt({ typographer: true, linkify: false });

export default function LessonScreen({ route, navigation }: Props) {
  const lesson = lessonById(route.params.id);
  const { width } = useWindowDimensions();

  if (!lesson) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.body}>Leçon introuvable.</Text>
      </SafeAreaView>
    );
  }

  // Custom rule: ![caption](diagram:N) renders the indexed SVG diagram.
  const rules = {
    image: (node: any) => {
      const src: string = node.attributes?.src ?? '';
      const m = src.match(/^diagram:(\d+)$/);
      if (m && lesson.diagrams) {
        const i = Number(m[1]);
        const d = lesson.diagrams[i];
        if (d) {
          const w = width - 40;
          const h = d.height ?? Math.round(w * 0.6);
          return (
            <View key={node.key} style={styles.diagram}>
              <SvgXml xml={d.svg} width={w} height={h} />
              {d.caption ? <Text style={styles.caption}>{d.caption}</Text> : null}
            </View>
          );
        }
      }
      return null;
    },
  } as any;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.module}>{lesson.module}</Text>
        <Text style={styles.title}>{lesson.title}</Text>
        <Text style={styles.dim}>~{lesson.durationMin} min</Text>
        <View style={styles.divider} />
        <Markdown style={mdStyles} rules={rules} markdownit={md}>
          {lesson.content}
        </Markdown>
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
  container: { padding: 20 },
  module: { color: theme.primary, fontWeight: '700', letterSpacing: 1 },
  title: { color: theme.text, fontSize: 24, fontWeight: '700' },
  dim: { color: theme.textDim },
  divider: { height: 1, backgroundColor: theme.border, marginVertical: 12 },
  body: { color: theme.text, fontSize: 16, lineHeight: 24 },
  diagram: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    marginVertical: 12,
    alignItems: 'center',
  },
  caption: { color: '#222', fontSize: 13, marginTop: 6, fontStyle: 'italic' },
  cta: {
    marginTop: 24,
    backgroundColor: theme.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  ctaText: { color: '#fff', fontWeight: '700' },
});

const mdStyles = {
  body: { color: theme.text, fontSize: 16, lineHeight: 24 },
  heading1: { color: theme.text, fontSize: 22, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  heading2: { color: theme.text, fontSize: 19, fontWeight: '700', marginTop: 14, marginBottom: 6 },
  heading3: { color: theme.primary, fontSize: 17, fontWeight: '700', marginTop: 12, marginBottom: 4 },
  strong: { color: theme.text, fontWeight: '700' },
  em: { color: theme.textDim, fontStyle: 'italic' },
  bullet_list: { marginVertical: 6 },
  ordered_list: { marginVertical: 6 },
  list_item: { color: theme.text, marginVertical: 2 },
  code_inline: {
    backgroundColor: theme.card,
    color: theme.warn,
    paddingHorizontal: 4,
    borderRadius: 4,
    fontFamily: 'Courier',
  },
  code_block: {
    backgroundColor: theme.card,
    color: theme.text,
    padding: 10,
    borderRadius: 8,
    fontFamily: 'Courier',
  },
  fence: {
    backgroundColor: theme.card,
    color: theme.text,
    padding: 10,
    borderRadius: 8,
    fontFamily: 'Courier',
  },
  blockquote: {
    backgroundColor: theme.card,
    borderLeftColor: theme.primary,
    borderLeftWidth: 4,
    padding: 10,
    marginVertical: 8,
  },
  hr: { backgroundColor: theme.border, height: 1, marginVertical: 12 },
  table: { borderColor: theme.border, borderWidth: 1, borderRadius: 8 },
  th: { backgroundColor: theme.card, color: theme.text, padding: 8, fontWeight: '700' },
  td: { color: theme.text, padding: 8, borderColor: theme.border },
} as any;
