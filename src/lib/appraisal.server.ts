import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

export type Appraisal = {
  object: string;
  title: string;
  trueName: string;
  rank: "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary" | "Mythic" | "Divine" | "Cursed";
  grade: "F" | "E" | "D" | "C" | "B" | "A" | "S" | "EX";
  durability: number;
  mana: number;
  gold: number;
  silver: number;
  elements: string[];
  lore: string;
  traits: string[];
  secret: string;
};

const fallback: Appraisal = {
  object: "Unknown relic",
  title: "Nameless Relic Beyond the Veil",
  trueName: "Uncatalogued Mundane Vessel",
  rank: "Rare",
  grade: "D",
  durability: 62,
  mana: 48,
  gold: 12,
  silver: 40,
  elements: ["Aether", "Mystery"],
  lore: "Its purpose is obscured by a stubborn veil. The Guild insists this usually means either destiny or poor lighting.",
  traits: ["Veil-Touched", "Pocket Dimension Adjacent"],
  secret: "Blessing: grants +1 curiosity to its bearer.",
};

function normalize(raw: unknown): Appraisal {
  if (!raw || typeof raw !== "object") return fallback;
  const data = raw as Partial<Appraisal>;
  const ranks = ["Common", "Uncommon", "Rare", "Epic", "Legendary", "Mythic", "Divine", "Cursed"] as const;
  const rank = ranks.includes(data.rank as (typeof ranks)[number]) ? data.rank as Appraisal["rank"] : "Rare";
  const gradeMap: Record<Appraisal["rank"], Appraisal["grade"]> = { Common: "F", Uncommon: "E", Rare: "D", Epic: "C", Legendary: "B", Mythic: "A", Divine: "S", Cursed: "EX" };
  const strings = (value: unknown, backup: string[]) => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").slice(0, 4) : backup;
  const number = (value: unknown, max: number) => Math.max(0, Math.min(max, Number(value) || 0));
  return {
    object: typeof data.object === "string" ? data.object : fallback.object,
    title: typeof data.title === "string" ? data.title : fallback.title,
    trueName: typeof data.trueName === "string" ? data.trueName : fallback.trueName,
    rank,
    grade: gradeMap[rank],
    durability: number(data.durability, 100),
    mana: number(data.mana, 100),
    gold: number(data.gold, 9999),
    silver: number(data.silver, 99),
    elements: strings(data.elements, fallback.elements),
    lore: typeof data.lore === "string" ? data.lore : fallback.lore,
    traits: strings(data.traits, fallback.traits),
    secret: typeof data.secret === "string" ? data.secret : fallback.secret,
  };
}

export async function appraiseImage(image: string) {
  const key = process.env['LOVABLE_API_KEY'];
  if (!key) throw new Error("The appraisal crystal is not configured.");
  if (!image.startsWith("data:image/")) throw new Error("Please provide a valid image.");

  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey: key,
    headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
  });
  const result = streamText({
    model: provider.responses("openai/gpt-6-astra"),
    messages: [{
      role: "user",
      content: [
        { type: "text", text: "Identify the main real-world object. Return ONLY compact valid JSON with keys: object, title, trueName, rank, durability, mana, gold, silver, elements, lore, traits, secret. rank must be one of Common, Uncommon, Rare, Epic, Legendary, Mythic, Divine, Cursed. Numbers durability/mana 0-100, silver 0-99. elements and traits are arrays of 2-4 short strings. Give it witty, dramatic isekai RPG lore and an amusing blessing or curse. No markdown." },
        { type: "image", image },
      ],
    }],
    providerOptions: { openai: { forceReasoning: true, reasoningEffort: "low", reasoningSummary: "auto", store: false, include: ["reasoning.encrypted_content"] } },
  });
  const text = await result.text;
  try {
    const cleaned = text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
    return normalize(JSON.parse(cleaned));
  } catch {
    return fallback;
  }
}