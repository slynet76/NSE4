import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import lessonsEn from '@/data/lessons.json';
import lessonsFr from '@/data/lessons-fr.json';
import type { Lesson } from '@/lib/lessons';

export type Lang = 'en' | 'fr';

const STORAGE_KEY = 'app_lang';

type LanguageContextValue = {
  lang: Lang;
  setLang: (l: Lang) => Promise<void>;
  lessons: Lesson[];
};

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'en',
  setLang: async () => {},
  lessons: lessonsEn as Lesson[],
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((v) => {
      if (v === 'fr' || v === 'en') setLangState(v);
    });
  }, []);

  async function setLang(l: Lang) {
    setLangState(l);
    await AsyncStorage.setItem(STORAGE_KEY, l);
  }

  const frLessons = lessonsFr as Lesson[];
  const lessons: Lesson[] =
    lang === 'fr' && frLessons.length > 0 ? frLessons : (lessonsEn as Lesson[]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, lessons }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
