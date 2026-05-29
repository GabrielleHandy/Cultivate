# Screenshot & recording capture checklist

Drop captures in this folder, then the README table renders automatically. Use the **exact filenames** below so the README links resolve with no edits.

## Required for README (3 stills)

- [ ] `wardrobe.png` — Wardrobe tab with several real items, category sections visible. Shows the structured-wardrobe payoff.
- [ ] `outfit.png` — Outfits screen with a generated suggestion + reason + the occasion/weather context visible. **This is the money shot — make the suggestion specific and flattering.**
- [ ] `theme.png` — An AI-generated custom theme applied (e.g. "Dark Academia"), so the palette difference from the default WearIt look is obvious.

## Highest-impact asset (do this one if you do nothing else)

- [ ] `demo.gif` (or `demo.mp4`) — 20–30s screen recording of the core loop:
  **photograph an item → Claude auto-tags it → open Outfits → get a suggestion.**
  This single clip sells the product better than any paragraph.

## Nice-to-have (deepen the engineering story)

- [ ] `gap-analysis.png` — wishlist item detail showing "what you own that works / what's missing".
- [ ] `settings-model.png` — Settings showing the configurable fallback model (proves the provider-agnostic claim).
- [ ] `offline.png` — a suggestion produced by a local model with AI cloud off (proves "runs on-device").

## Capture tips

- **Device frame:** iOS Simulator (`npx expo run:ios`) gives clean, consistent frames. Crop the status bar or use a fake clean status bar.
- **Real data:** populate the wardrobe with 8–12 actual items first — empty/placeholder states read as unfinished.
- **Consistent size:** capture all stills at the same device resolution so the README table aligns.
- **GIF size:** keep under ~10MB so GitHub renders it inline. Tools: macOS screen record → convert with `ffmpeg`/Gifski, or [Kap](https://getkap.co/).
- **App Store:** these same captures (at required store resolutions) cover most of the store-listing screenshot requirement too.

Once `wardrobe.png`, `outfit.png`, `theme.png` exist here, swap the placeholder cells in `README.md`:

```md
| Wardrobe | Outfit suggestion | AI-generated theme |
|---|---|---|
| ![Wardrobe](assets/screenshots/wardrobe.png) | ![Outfit](assets/screenshots/outfit.png) | ![Theme](assets/screenshots/theme.png) |
```
