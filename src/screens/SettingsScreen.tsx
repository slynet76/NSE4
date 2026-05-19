import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch, Pressable, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { theme } from '@/lib/theme';
import { getReminder, scheduleDailyReminder } from '@/lib/notifications';
import { useLang } from '@/context/LanguageContext';

export default function SettingsScreen() {
  const { lang, setLang } = useLang();
  const [enabled, setEnabled] = useState(true);
  const [hour, setHour] = useState(19);
  const [minute, setMinute] = useState(0);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    getReminder().then((r) => {
      setEnabled(r.enabled);
      setHour(r.hour);
      setMinute(r.minute);
    });
  }, []);

  async function save(next: { enabled: boolean; hour: number; minute: number }) {
    setEnabled(next.enabled);
    setHour(next.hour);
    setMinute(next.minute);
    await scheduleDailyReminder(next.hour, next.minute, next.enabled);
  }

  function onTimeChange(_: any, selected?: Date) {
    setShowPicker(Platform.OS === 'ios');
    if (selected) {
      save({ enabled, hour: selected.getHours(), minute: selected.getMinutes() }).catch((e) =>
        Alert.alert('Erreur', String(e)),
      );
    }
  }

  const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.h1}>Réglages</Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Rappel quotidien</Text>
              <Text style={styles.dim}>Reçois une notification chaque jour.</Text>
            </View>
            <Switch
              value={enabled}
              onValueChange={(v) => save({ enabled: v, hour, minute })}
              thumbColor={enabled ? theme.primary : '#888'}
            />
          </View>

          <View style={styles.divider} />

          <Pressable style={styles.row} onPress={() => setShowPicker(true)} disabled={!enabled}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, !enabled && styles.disabledText]}>Heure du rappel</Text>
              <Text style={styles.dim}>Tap pour modifier</Text>
            </View>
            <Text style={[styles.time, !enabled && styles.disabledText]}>{timeStr}</Text>
          </Pressable>
        </View>

        {showPicker && (
          <DateTimePicker
            value={(() => {
              const d = new Date();
              d.setHours(hour, minute, 0, 0);
              return d;
            })()}
            mode="time"
            is24Hour
            onChange={onTimeChange}
          />
        )}

        <View style={styles.card}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Langue / Language</Text>
              <Text style={styles.dim}>Contenu des leçons et questions</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable
                style={[styles.langBtn, lang === 'en' && styles.langBtnActive]}
                onPress={() => setLang('en')}
              >
                <Text style={[styles.langBtnText, lang === 'en' && styles.langBtnTextActive]}>EN</Text>
              </Pressable>
              <Pressable
                style={[styles.langBtn, lang === 'fr' && styles.langBtnActive]}
                onPress={() => setLang('fr')}
              >
                <Text style={[styles.langBtnText, lang === 'fr' && styles.langBtnTextActive]}>FR</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <Text style={styles.dim}>
          Astuce : sur Android 13+, autorise les notifications à la première utilisation.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  container: { padding: 20, gap: 16 },
  h1: { color: theme.text, fontSize: 26, fontWeight: '700' },
  card: {
    backgroundColor: theme.card,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: 14,
  },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  label: { color: theme.text, fontSize: 16, fontWeight: '600' },
  dim: { color: theme.textDim, fontSize: 12, marginTop: 2 },
  divider: { height: 1, backgroundColor: theme.border },
  time: { color: theme.primary, fontSize: 18, fontWeight: '700' },
  disabledText: { opacity: 0.4 },
  langBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  langBtnActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  langBtnText: { color: theme.textDim, fontWeight: '700', fontSize: 14 },
  langBtnTextActive: { color: '#fff' },
});
