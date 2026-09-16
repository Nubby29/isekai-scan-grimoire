# Isekai Scanner

Build a mobile-first Isekai Appraisal Game web app where players use their camera to scan real-world items and reveal anime/isekai-style RPG status windows.

Key Features & Mechanics:
1. Mobile-First Camera Viewport & HUD:
   - Live rear camera feed with front/back toggle and photo upload fallback.
   - Anime fantasy AR-style overlay: targeting reticle, glowing magic circles/runes, pulsing scanline animations, and fantasy sound effects.
   - Clean, tactile mobile-first UI designed for one-handed thumb interaction.

2. 'Appraisal' (鑑定) Skill Mechanics:
   - Snapping or scanning an item triggers an appraisal sequence (magic circle spins, mana charge bar, rune activation).
   - AI vision analysis identifies the item in the frame and transposes it into an Isekai RPG artifact.
   - Status Window display includes:
     - Fantasy Title & True Name (e.g., 'Elixir Vessel of the Awakening Dawn' for a coffee cup).
     - Rarity / Rank (Common [F], Uncommon [E], Rare [D], Epic [C], Legendary [B], Mythic [A], Divine [S], Cursed [EX]) with distinct glows, animations, and sound effects.
     - RPG Attributes: Durability, Mana Potency, Market Value (in Gold/Silver coins), Elemental Affinities.
     - Lore & Flavor Text: Humorous or epic fantasy lore explaining why the object exists in this realm.
     - Traits, Enchantments, and Hidden Curses/Blessings.

3. Player Progression & Appraisal Level:
   - Player has an Appraisal Skill Level (starts at Lv. 1 'Novice Appraiser').
   - Scanning items grants EXP and ranks up the skill. Higher levels unlock hidden stats, deeper lore, and rare attribute discovery.

4. Item Codex / Grimoire:
   - Gallery/catalog of all previously scanned items saved locally.
   - Filter by rank, element, or scan date.
   - Export/Share card feature to generate a shareable appraisal card.

5. Aesthetics:
   - Deep dark fantasy theme with glowing neon runes, glassmorphic status panels, crisp typography, and anime RPG sound effects.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://isekai-scan-grimoire.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f3b8cf5f-d7e2-4156-b6e7-178de5f7cf86).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
