# Cultivate

A suite of AI-powered apps for learning and everyday life.

---

## Apps

### [WearIt](./wearit) — AI Wardrobe Assistant
*Live*

Photograph your clothes, build your wardrobe, and get personalized outfit suggestions powered by a three-tier AI system. Claude API handles primary suggestions and vision-based clothing tagging; a self-hosted Bonsai LLM covers offline fallback; few-shot prompt injection from your own usage history improves quality over time.

**Stack:** React Native · TypeScript · Expo Router · Anthropic Claude API · AsyncStorage

→ [See WearIt README](./wearit/README.md)

---

### Cultivate App — Personalized AI Bootcamp Generator
*In development*

Learn anything through real scenarios and adaptive mentorship. Cultivate isn't a course — it's an AI mentor that learns how you think.

**How it works:**

1. You submit code, a concept, or a problem
2. Cultivate reads it independently and forms an honest assessment — no hints, no softening
3. It delivers a structured review: real bugs named precisely, genuine strengths with specific reasons
4. It picks one targeted probe question on a specific piece of logic — not "do you understand this?" but "walk me through what this is actually doing and why it returns X"
5. Your answer reveals the gap between code that runs and code you understand
6. Cultivate traces the execution path, names the gap precisely, shows the clean version, and logs it to your progress profile

The goal: close the gap between "it works" and "I know why it works." Co-founder tone — direct, specific, honest, never condescending.

**Stack:** React Native · TypeScript · Expo Router · Anthropic Claude API

---

## Reference

[`cultivate-reference/`](./cultivate-reference) — Design specs and interaction patterns for the Cultivate mentor agent, derived from live sessions.

---

## Getting Started

Each app is a standalone Expo project:

```bash
cd wearit        # or cultivate-app
npm install
npx expo start
```

You'll need environment variables — see each app's README for details.
