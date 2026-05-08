# NSE4 Daily

Application Android de révision quotidienne pour la certification **Fortinet NSE4**.
Style Duolingo : une leçon courte par jour, quiz QCM, streak, rappel quotidien programmable.

## Fonctionnalités

- Leçon du jour adaptative (priorité aux leçons ratées, puis nouvelles, puis révisions)
- Quiz QCM avec correction immédiate et explications
- Suivi de progression par module + streak (jours consécutifs)
- Rappel quotidien à l'heure de votre choix (notifications locales)
- 100 % offline, données stockées en local (SQLite)

## Stack

- Expo (React Native) + TypeScript
- `expo-notifications`, `expo-sqlite`
- `@react-navigation/native-stack`

## Lancer en développement

Sur votre poste (Linux/macOS/Windows) :

```bash
npm install
npx expo start
```

Puis sur votre téléphone Android :

1. Installer **Expo Go** depuis le Play Store.
2. Scanner le QR code affiché.
3. Autoriser les notifications à la première ouverture.

> Note : sur Expo Go, les notifications programmées fonctionnent en *foreground/background*
> mais le mieux est de générer un build (voir ci-dessous) pour un usage quotidien réaliste.

## Générer un APK installable

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build -p android --profile preview
```

Téléchargez l'APK depuis le lien fourni puis installez-le sur le téléphone.

## Structure

```
App.tsx
src/
  navigation.ts
  lib/
    db.ts             # SQLite (progress, streak)
    notifications.ts  # Rappel quotidien
    lessons.ts        # Sélecteur de la leçon du jour
    theme.ts
  screens/
    HomeScreen.tsx
    LessonScreen.tsx
    QuizScreen.tsx
    ProgressScreen.tsx
    SettingsScreen.tsx
  data/
    lessons.json      # Contenu pédagogique (à enrichir depuis le PDF NSE4)
```

## Ajouter / enrichir les leçons

Éditez `src/data/lessons.json`. Schéma :

```json
{
  "id": "string-unique",
  "module": "Nom du module",
  "title": "Titre de la leçon",
  "durationMin": 5,
  "content": "Texte markdown-ish (sauts de ligne \\n)",
  "quiz": [
    { "q": "...", "choices": ["a","b","c","d"], "answer": 0, "explain": "..." }
  ]
}
```

## Roadmap

- [ ] Extraction automatique des chapitres depuis le PDF officiel NSE4
- [ ] Génération de quiz par section
- [ ] Mode révision espacée (SM-2 light)
- [ ] Export/import de progression
