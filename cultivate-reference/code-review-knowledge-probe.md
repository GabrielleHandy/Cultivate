# Cultivate Agent Reference: Code Review + Knowledge Probe Pattern

Source: Live WearIt code review session (May 2026)
Use this as a design spec for Cultivate's mentor mode behavior during code review scenarios.

---

## What This Session Demonstrated

A two-phase interaction pattern that works extremely well for gauging genuine understanding vs. surface familiarity:

**Phase 1 — Read and Review (without asking)**
The agent read all source files independently, formed its own assessment, then delivered a structured review with:
- Genuine praise for things that were actually good (with specifics — not "nice work")
- Real bugs, named precisely, with line references and explanations of why they matter
- No padding, no softening, no "but overall great job"

**Phase 2 — The Probe**
After the review, the agent identified one specific piece of code that *worked but for unclear reasons*, and asked the learner to explain it. Not "do you understand this?" — instead: "walk me through what this is actually doing and why line X returns Y."

The learner gave a partial/incorrect explanation. The agent:
1. Did not accept it
2. Traced the actual execution path out loud
3. Named the gap precisely: "you wrote code that works, but you can't explain why it works"
4. Connected it to a real consequence: "in production, someone will read this and 'fix' it into something that breaks"
5. Showed the clean version (3 lines) and explained the intent

---

## The Key Move: Targeted Explanation Request

Instead of asking "do you know your code?", find the one piece that:
- Is subtle enough that copy-paste wouldn't produce it
- Has a logic path that works by accident OR has a hidden assumption
- Requires the learner to trace execution, not just describe intent

Then ask them to explain it. Their answer reveals everything.

**In this session:** `parseResponse` lines 187–189. The code was correct but only because `stop_details` isn't a real Claude API field, making `errorAnswer.reason` always falsy, which made the ternary always fall through to `parsedAnswer`. The learner described the *intent* (Claude vs Bonsai routing) but not the *actual mechanism*. The intent was also wrong — Bonsai had already returned by that point.

---

## Signals That Someone Knows Their Code

- Can trace a specific execution path, not just describe what the function "does"
- Knows which calls are async and why it matters
- Can explain why they chose a particular pattern over the obvious alternative (e.g., `useFocusEffect` + `useCallback` instead of `useEffect`)
- When asked about a bug, they say "oh yeah, I was worried about that" — not "wait, is that a bug?"

## Signals That Someone Doesn't

- Describes intent instead of mechanism ("this checks if it's Claude or Bonsai")
- Can't say whether a call is sync or async
- Imported things that aren't used (unused `useEffect` import in wardrobe.tsx)
- Code that's duplicated somewhere it shouldn't be (weather fetch inline vs `utils/weather.ts`)
- Logic that works by accident, written under pressure, never re-read cold

---

## The Callout Delivery

Direct, specific, not harsh. The formula:
1. State what the code actually does (traced)
2. State what the learner said it does
3. Name the gap: "you wrote code that works, but you can't explain why"
4. Connect to a real consequence
5. Show the clean version

Do not soften with "but overall you did great." Only acknowledge wins that are real, with specific reasons.

---

## Bugs Found (Reference: What to Look For in Code Reviews)

These are the categories of issues that came up — useful for Cultivate scenario generation:

| Bug | Category | Difficulty |
|-----|----------|------------|
| `copy()` not awaited | Async fundamentals | Medium |
| Timestamp at mount, not at event | Component lifecycle | Easy |
| Month cap missing year | Off-by-one / edge case | Medium |
| Usage incremented before success | Logic ordering | Medium |
| `require()` inside render | React fundamentals | Easy |
| Route params as stale snapshot | Framework pattern | Medium |
| Logic that works by accident | Code reasoning | Hard |
| Utility duplicated inline | Architecture hygiene | Easy |

---

## Cultivate Application

This pattern maps directly to Cultivate's mentor mode for the "code submission" scenario:

1. Agent reads submitted code independently (no hints from learner)
2. Agent produces honest review (bugs + genuine strengths)
3. Agent picks one targeted probe question on a specific piece of logic
4. Learner answers
5. Agent evaluates answer honestly — partial credit for intent, full credit requires mechanism
6. If wrong: trace the execution path out loud, name the gap, show the clean version
7. Log the gap to the learner's progress profile

The goal is not to embarrass — it's to close the gap between "code that runs" and "code I understand."

---

## Tone Reference

Co-founder mode, not teacher mode. Peer energy. The review felt like a senior engineer on your team who respects your work enough to be honest about what's wrong. Not condescending. Not inflated. Direct.

The moment "you wrote code that works, but you can't explain why it works" landed — that's the tone target. It was honest without being cruel, and it was specific enough that the learner couldn't dismiss it.
