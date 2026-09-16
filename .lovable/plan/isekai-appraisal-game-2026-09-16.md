# Isekai Appraisal Game

## Goal
Build a mobile-first camera game where a real-world object becomes a dramatic anime RPG artifact, then joins a locally saved codex.

## Experience
- Open directly into a full-screen camera view with permission, rear/front toggle, and photo upload fallback.
- Layer the viewfinder with a targeting reticle, rotating runes, scanlines, mana charge feedback, sound toggle, and thumb-friendly appraisal control.
- Run a staged appraisal sequence, then reveal an RPG status window with title, true name, rank, attributes, affinities, lore, traits, blessings, and curses.
- Award EXP after each scan, show level progress, and reveal more detail at higher appraisal levels.
- Add a codex view with rank, element, and date filters; store scans and progression on the current device.
- Add a share/export action that creates a polished appraisal card image.

## Visual Direction
Deep charcoal fantasy interface with spectral cyan rune light, warm gold hierarchy, and rarity-specific accent colors. The camera remains the dominant first-screen visual, with translucent etched-metal panels and restrained anime-style motion.

## Technical Details
- Keep the main experience at `/` and use React state plus browser media APIs for camera capture and uploads.
- Use Lovable AI server-side vision analysis with `openai/gpt-6-astra`; validate and normalize the generated appraisal before rendering.
- Keep photos ephemeral; persist compact appraisal records and progression in local storage.
- Generate the share card in-browser with Canvas, then use native sharing where supported or download the image.
- Use Web Audio for lightweight synthesized cues, respecting mute and reduced-motion preferences.
- Include responsive fallbacks, camera errors, loading, empty codex, and AI failure states.
- Add complete page metadata and verify the experience at mobile and desktop sizes.
