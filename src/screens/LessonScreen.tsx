import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, useWindowDimensions, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Markdown, { MarkdownIt } from 'react-native-markdown-display';
import { SvgXml } from 'react-native-svg';
import { theme } from '@/lib/theme';
import { lessonById } from '@/lib/lessons';
import lessonImages from '@/data/lessonImages';
import { useLang } from '@/context/LanguageContext';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Lesson'>;

const md = MarkdownIt({ typographer: true, linkify: false });

export default function LessonScreen({ route, navigation }: Props) {
  const { lessons } = useLang();
  const lesson = lessonById(route.params.id, lessons);
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
              {lessonImages[lesson.id] ? (
                <Image
                  source={lessonImages[lesson.id]}
                  style={{ width: w, height: h }}
                  resizeMode="contain"
                />
              ) : d.svg ? (
                <SvgXml xml={d.svg} width={w} height={h} />
              ) : null}
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
  paragraph: { marginTop: 4, marginBottom: 12, color: theme.text, lineHeight: 24 },
  heading1: {
    color: theme.text,
    fontSize: 24,
    fontWeight: '800',
    marginTop: 18,
    marginBottom: 8,
    borderBottomColor: theme.primary,
    borderBottomWidth: 2,
    paddingBottom: 6,
  },
  heading2: {
    color: theme.primary,
    fontSize: 21,
    fontWeight: '800',
    marginTop: 22,
    marginBottom: 8,
  },
  heading3: {
    color: theme.warn,
    fontSize: 17,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  heading4: { color: theme.textDim, fontSize: 15, fontWeight: '700', marginTop: 10, marginBottom: 4 },
  strong: { color: theme.text, fontWeight: '800' },
  em: { color: theme.text, fontStyle: 'italic' },
  bullet_list: { marginVertical: 6 },
  ordered_list: { marginVertical: 6 },
  list_item: { color: theme.text, marginVertical: 3 },
  bullet_list_icon: { color: theme.primary, marginRight: 6 },
  ordered_list_icon: { color: theme.primary, marginRight: 6, fontWeight: '700' },
  code_inline: {
    backgroundColor: '#1a2540',
    color: '#fbbf24',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    fontFamily: 'monospace',
    fontSize: 14,
  },
  code_block: {
    backgroundColor: '#1a2540',
    color: theme.text,
    padding: 12,
    borderRadius: 8,
    fontFamily: 'monospace',
    fontSize: 14,
    marginVertical: 8,
  },
  fence: {
    backgroundColor: '#1a2540',
    color: theme.text,
    padding: 12,
    borderRadius: 8,
    fontFamily: 'monospace',
    fontSize: 14,
    marginVertical: 8,
  },
  blockquote: {
    backgroundColor: theme.card,
    borderLeftColor: theme.warn,
    borderLeftWidth: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginVertical: 10,
    borderRadius: 6,
  },
  hr: { backgroundColor: theme.border, height: 1, marginVertical: 14 },
  table: { borderColor: theme.border, borderWidth: 1, borderRadius: 8, marginVertical: 10 },
  thead: { backgroundColor: '#1a2540' },
  th: { color: theme.primary, padding: 10, fontWeight: '700', fontSize: 14 },
  td: { color: theme.text, padding: 10, borderColor: theme.border, fontSize: 14 },
  tr: { borderBottomColor: theme.border, borderBottomWidth: 1 },
} as any;
