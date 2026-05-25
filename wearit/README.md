# WearIt

An AI-powered wardrobe assistant built with React Native, TypeScript, and Expo. Photograph your clothes, build your wardrobe, and get personalized outfit suggestions powered by a three-tier AI system.

---

## Features

- **AI outfit suggestions** — Get a complete outfit recommendation based on your wardrobe and the occasion
- **Vision-based clothing tagging** — Photograph a garment and Claude automatically identifies the name, category, and color
- **Three-tier AI fallback** — Claude API → self-hosted Bonsai LLM → graceful degradation, so the app always works
- **Occasion-aware context** — Tell the app where you're going and suggestions adapt accordingly
- **Few-shot learning** — The app captures successful suggestions and injects them as examples into future prompts, improving quality over time
- **Usage cap management** — Monthly Claude API budget with automatic fallback to Bonsai when the cap is hit
- **Wardrobe CRUD** — Add, edit, delete, and search clothing items with persistent local storage
- **Wishlist** — Save items you want to add to your wardrobe

---

## Architecture

### AI Stack

```
User requests outfit
        │
        ▼
 Under monthly cap?
   ┌────┴────┐
  YES       NO
   │         │
   ▼         ▼
Claude    Bonsai LLM
API       (self-hosted fallback)
   │         │
   └────┬────┘
        │
   Error? ──► Graceful degradation message
        │
        ▼
  Structured JSON
  { suggestion, reason }
```

**Claude API** (`claude-sonnet-4-5`) handles primary outfit suggestions and vision-based clothing tagging. When the monthly cap is reached, the app falls back to **Bonsai**, a self-hosted LLM that receives few-shot examples drawn from past Claude suggestions to maintain output quality.

### Few-Shot Prompt Injection

Every successful Claude suggestion is saved as a training example (up to 20 stored in AsyncStorage). When falling back to Bonsai, the last 3 saved examples are injected directly into the system prompt:

```
Here are examples of good outfit suggestions:
Wardrobe: [list] | Context: [occasion] | Good suggestion: [text]
```

The app improves over time without retraining — the user's own preferences shape future suggestions.

### Vision-Based Clothing Tagging

When adding a new item, the user can photograph it. The image is base64-encoded and sent to Claude's vision endpoint, which returns structured JSON:

```json
{ "name": "Dark Wash Jeans", "category": "Bottoms", "color": "Navy" }
```

No manual data entry needed.

### Response Parsing

Both Claude and Bonsai return structured JSON (`{ suggestion, reason }`). A shared parser handles:
- Stripping `<think>` tags from reasoning models
- Sanitizing control characters and malformed JSON
- Removing markdown code fences
- Falling back to raw text if JSON parsing fails entirely

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | React Native + Expo (file-based routing via Expo Router) |
| Language | TypeScript |
| AI — Primary | Anthropic Claude API (`claude-sonnet-4-5`) |
| AI — Fallback | Bonsai (self-hosted LLM, OpenAI-compatible endpoint) |
| Storage | AsyncStorage (wardrobe, wishlist, usage tracking, training examples) |
| Image handling | expo-file-system (base64 encoding for vision API) |
| IDs | expo-crypto (UUID generation) |
| Context | Weather API integration for location-aware suggestions |

---

## Project Structure

```
wearit/
├── app/
│   ├── _layout.tsx       # Root layout, Expo Router entry
│   ├── index.tsx         # Home / outfit suggestion screen
│   ├── modal.tsx         # Add/edit clothing item modal
│   └── (tabs)/           # Tab navigation
├── components/           # Shared UI components
├── constants/            # Types and theme tokens
├── hooks/                # Custom React hooks
├── utils/
│   ├── claude.ts         # AI logic: Claude API, Bonsai fallback, few-shot injection, vision tagging
│   ├── storage.ts        # AsyncStorage CRUD: wardrobe, wishlist, usage cap, training examples
│   ├── weather.ts        # Weather API integration
│   └── testFallback.ts   # Fallback chain testing utilities
└── assets/
```

---

## Getting Started

```bash
cd wearit
npm install
npx expo start
```

Create a `.env` file with:

```
EXPO_PUBLIC_ANTHROPIC_KEY=your_claude_api_key
EXPO_PUBLIC_BONSAI_URL=your_bonsai_endpoint
```

Run on iOS Simulator, Android Emulator, or scan the QR code with [Expo Go](https://expo.dev/go).

---

## Roadmap

- [ ] Demo screenshots / screen recording
- [ ] Weather-aware suggestions (auto-fetch location weather)
- [ ] Outfit history and favorites
- [ ] Share outfit as image

---

*Part of the [Cultivate](https://github.com/GabrielleHandy/Cultivate) project.*
