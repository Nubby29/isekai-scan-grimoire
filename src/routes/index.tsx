import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Aperture, BookOpen, Camera, ChevronLeft, Download, RefreshCw, Share2, Sparkles, Upload, Volume2, VolumeX, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Appraisal } from "@/lib/appraisal.server";

type SavedAppraisal = Appraisal & { id: string; date: string; xp: number; thumbnail: string };
type View = "scan" | "codex";
const STORAGE_KEY = "isekai-appraiser-v1";
const ranks: Record<Appraisal["rank"], { glow: string; xp: number }> = {
  Common: { glow: "rank-common", xp: 18 }, Uncommon: { glow: "rank-uncommon", xp: 28 }, Rare: { glow: "rank-rare", xp: 42 },
  Epic: { glow: "rank-epic", xp: 65 }, Legendary: { glow: "rank-legendary", xp: 90 }, Mythic: { glow: "rank-mythic", xp: 130 }, Divine: { glow: "rank-divine", xp: 180 }, Cursed: { glow: "rank-cursed", xp: 160 },
};

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Isekai Appraiser — Reveal Hidden Artifacts" },
    { name: "description", content: "Use your camera to transform everyday objects into anime RPG artifacts, earn EXP, and build your grimoire." },
    { property: "og:title", content: "Isekai Appraiser" },
    { property: "og:description", content: "Reveal the RPG status hidden inside everyday objects." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ]}),
  component: Index,
});

function levelFromXp(xp: number) { return Math.floor(xp / 100) + 1; }
function titleForLevel(level: number) { return level >= 10 ? "Archsage Appraiser" : level >= 6 ? "Rune Scholar" : level >= 3 ? "Adept Appraiser" : "Novice Appraiser"; }

function playTone(enabled: boolean, success = false) {
  if (!enabled) return;
  const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;
  const ctx = new AudioContextClass();
  [0, 0.12, 0.24].forEach((delay, index) => {
    const oscillator = ctx.createOscillator(); const gain = ctx.createGain();
    oscillator.type = success ? "sine" : "triangle"; oscillator.frequency.value = success ? 520 + index * 180 : 180 + index * 90;
    gain.gain.setValueAtTime(0.001, ctx.currentTime + delay); gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + delay + 0.02); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.18);
    oscillator.connect(gain).connect(ctx.destination); oscillator.start(ctx.currentTime + delay); oscillator.stop(ctx.currentTime + delay + 0.2);
  });
}

function Index() {
  const videoRef = useRef<HTMLVideoElement>(null); const fileRef = useRef<HTMLInputElement>(null); const streamRef = useRef<MediaStream | null>(null);
  const [view, setView] = useState<View>("scan"); const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [cameraError, setCameraError] = useState(""); const [preview, setPreview] = useState(""); const [phase, setPhase] = useState<"idle" | "charging" | "revealed">("idle");
  const [charge, setCharge] = useState(0); const [result, setResult] = useState<SavedAppraisal | null>(null); const [error, setError] = useState("");
  const [sound, setSound] = useState(true); const [items, setItems] = useState<SavedAppraisal[]>([]); const [xp, setXp] = useState(0);
  const [rankFilter, setRankFilter] = useState("All"); const [elementFilter, setElementFilter] = useState("All"); const [dateFilter, setDateFilter] = useState("All time");

  useEffect(() => { const raw = localStorage.getItem(STORAGE_KEY); if (raw) { try { const saved = JSON.parse(raw) as { items: SavedAppraisal[]; xp: number }; setItems(saved.items || []); setXp(saved.xp || 0); } catch { /* ignore corrupt local save */ } } }, []);
  useEffect(() => { if (items.length || xp) localStorage.setItem(STORAGE_KEY, JSON.stringify({ items, xp })); }, [items, xp]);

  const startCamera = useCallback(async () => {
    streamRef.current?.getTracks().forEach((track) => track.stop()); setCameraError("");
    try { const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing }, audio: false }); streamRef.current = stream; if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); } }
    catch { setCameraError("Camera sealed. Allow access or choose a photo from your library."); }
  }, [facing]);
  useEffect(() => { if (view === "scan" && phase === "idle" && !preview) void startCamera(); return () => streamRef.current?.getTracks().forEach((track) => track.stop()); }, [startCamera, view, phase, preview]);

  const capture = () => {
    if (preview) { void appraise(preview); return; }
    const video = videoRef.current; if (!video || !video.videoWidth) { fileRef.current?.click(); return; }
    const canvas = document.createElement("canvas"); const max = 1280; const scale = Math.min(1, max / video.videoWidth); canvas.width = video.videoWidth * scale; canvas.height = video.videoHeight * scale;
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height); const image = canvas.toDataURL("image/jpeg", 0.78); setPreview(image); void appraise(image);
  };
  const appraise = async (image: string) => {
    setError(""); setResult(null); setPhase("charging"); setCharge(8); playTone(sound);
    const timer = window.setInterval(() => setCharge((value) => Math.min(value + Math.ceil((96 - value) / 8), 96)), 180);
    try {
      const response = await fetch("/api/appraise", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image }) });
      const data = await response.json() as Appraisal & { error?: string }; if (!response.ok) throw new Error(data.error || "The appraisal crystal went dark.");
      const earned = ranks[data.rank].xp; const saved: SavedAppraisal = { ...data, id: crypto.randomUUID(), date: new Date().toISOString(), xp: earned, thumbnail: image.length < 900_000 ? image : "" };
      setCharge(100); setResult(saved); setItems((current) => [saved, ...current]); setXp((current) => current + earned); playTone(sound, true); setTimeout(() => setPhase("revealed"), 300);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "The appraisal spell failed."); setPhase("idle"); }
    finally { window.clearInterval(timer); }
  };
  const onFile = (file?: File) => { if (!file) return; const reader = new FileReader(); reader.onload = () => { const image = String(reader.result); setPreview(image); void appraise(image); }; reader.readAsDataURL(file); };
  const reset = () => { setPreview(""); setResult(null); setPhase("idle"); setCharge(0); setError(""); };
  const share = async (item: SavedAppraisal) => {
    const canvas = document.createElement("canvas"); canvas.width = 1080; canvas.height = 1350; const ctx = canvas.getContext("2d"); if (!ctx) return;
    ctx.fillStyle = "#071111"; ctx.fillRect(0, 0, 1080, 1350); ctx.strokeStyle = "#4ee8d1"; ctx.lineWidth = 5; ctx.strokeRect(48, 48, 984, 1254); ctx.fillStyle = "#dbc376"; ctx.font = "34px Georgia"; ctx.fillText("GUILD APPRAISAL • 鑑定", 90, 125);
    ctx.fillStyle = "#f3f1e8"; ctx.font = "bold 68px Georgia"; wrapText(ctx, item.title, 90, 260, 900, 82); ctx.fillStyle = "#4ee8d1"; ctx.font = "32px sans-serif"; ctx.fillText(`${item.rank.toUpperCase()}  [${item.grade}]`, 90, 470);
    ctx.fillStyle = "#a9b8b4"; ctx.font = "28px sans-serif"; ctx.fillText(`TRUE NAME  ${item.trueName}`, 90, 545); ctx.fillStyle = "#f3f1e8"; ctx.font = "30px sans-serif"; wrapText(ctx, item.lore, 90, 650, 900, 44);
    ctx.fillStyle = "#dbc376"; ctx.fillText(`DUR ${item.durability}   MANA ${item.mana}   VALUE ${item.gold}G ${item.silver}S`, 90, 1035); ctx.fillStyle = "#4ee8d1"; ctx.fillText(item.elements.join("  •  "), 90, 1110); ctx.fillStyle = "#a9b8b4"; ctx.font = "24px sans-serif"; ctx.fillText("ISEKAI APPRAISER GUILD", 90, 1240);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png")); if (!blob) return; const file = new File([blob], `${item.title}.png`, { type: "image/png" });
    if (navigator.share && navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: item.title }); else { const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = file.name; link.click(); URL.revokeObjectURL(link.href); }
  };
  const level = levelFromXp(xp); const filtered = items.filter((item) => rankFilter === "All" || item.rank === rankFilter).filter((item) => elementFilter === "All" || item.elements.includes(elementFilter)).filter((item) => dateFilter === "All time" || Date.now() - new Date(item.date).getTime() < (dateFilter === "Today" ? 86_400_000 : 604_800_000));
  const elements = Array.from(new Set(items.flatMap((item) => item.elements)));

  return <main className="app-shell">
    <header className="topbar"><div className="brand"><span className="brand-mark">鑑</span><div><p>OTHERWORLD GUILD</p><h1>Isekai Appraiser</h1></div></div><div className="level-chip"><span>LV. {level}</span><small>{titleForLevel(level)}</small></div></header>
    <div className="xp-track"><i style={{ width: `${xp % 100}%` }} /><span>{xp % 100} / 100 EXP</span></div>
    {view === "scan" ? <section className="scanner">
      <div className="camera-stage">
        {preview ? <img src={preview} alt="Object selected for appraisal" className="camera-feed" /> : <video ref={videoRef} playsInline muted className="camera-feed" />}
        <div className="vignette" /><div className="scanline" /><div className={`magic-seal ${phase === "charging" ? "is-charging" : ""}`}><span>ᚠ</span><span>ᚱ</span><span>ᛉ</span><span>ᛟ</span></div>
        <div className="reticle"><i /><i /><i /><i /><span /></div>
        <div className="camera-hud"><span>ARCANE LENS • {facing === "environment" ? "REAR" : "FRONT"}</span><span className="live-dot">MANA LINK</span></div>
        {cameraError && <div className="camera-message"><Camera /><p>{cameraError}</p><Button onClick={() => fileRef.current?.click()}><Upload /> Choose photo</Button></div>}
        {phase === "charging" && <div className="charge-overlay"><div className="kanji">鑑定</div><p>ANALYZING AETHERIC SIGNATURE</p><div className="mana-bar"><i style={{ width: `${charge}%` }} /></div><strong>{charge}%</strong></div>}
        <div className="camera-actions"><Button variant="ghost" size="icon" aria-label="Toggle sound" title="Toggle sound" onClick={() => setSound(!sound)}>{sound ? <Volume2 /> : <VolumeX />}</Button><Button variant="ghost" size="icon" aria-label="Upload photo" title="Upload photo" onClick={() => fileRef.current?.click()}><Upload /></Button><Button className="appraise-button" aria-label="Appraise object" onClick={capture} disabled={phase === "charging"}><span><Aperture />鑑定<small>APPRAISE</small></span></Button><Button variant="ghost" size="icon" aria-label="Switch camera" title="Switch camera" onClick={() => setFacing((value) => value === "environment" ? "user" : "environment")}><RefreshCw /></Button><Button variant="ghost" size="icon" aria-label="Clear photo" title="Clear photo" onClick={reset}><X /></Button></div>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={(event) => onFile(event.target.files?.[0])} />
      </div>
      {error && <p className="error-banner">{error}</p>}
      {phase === "idle" && !cameraError && <div className="scan-prompt"><Sparkles /><div><strong>Center an object in the seal</strong><span>The Guild recognizes artifacts, tools, provisions, and suspicious relics.</span></div></div>}
    </section> : <Codex items={filtered} allItems={items} rankFilter={rankFilter} setRankFilter={setRankFilter} elementFilter={elementFilter} setElementFilter={setElementFilter} elements={elements} dateFilter={dateFilter} setDateFilter={setDateFilter} onOpen={(item) => { setResult(item); setPreview(item.thumbnail); setPhase("revealed"); setView("scan"); }} />}
    {result && phase === "revealed" && <ResultSheet item={result} level={level} onClose={reset} onShare={() => void share(result)} />}
    <nav className="bottom-nav"><Button variant="ghost" className={view === "scan" ? "active" : ""} onClick={() => setView("scan")}><Camera /><span>Appraise</span></Button><Button variant="ghost" className={view === "codex" ? "active" : ""} onClick={() => setView("codex")}><BookOpen /><span>Grimoire</span><b>{items.length}</b></Button></nav>
  </main>;
}

function ResultSheet({ item, level, onClose, onShare }: { item: SavedAppraisal; level: number; onClose: () => void; onShare: () => void }) {
  return <div className="result-backdrop"><article className={`status-window ${ranks[item.rank].glow}`}><div className="status-top"><Button variant="ghost" size="icon" aria-label="Close result" onClick={onClose}><ChevronLeft /></Button><span>APPRAISAL COMPLETE</span><Button variant="ghost" size="icon" aria-label="Share appraisal" onClick={onShare}><Share2 /></Button></div><div className="rarity"><Sparkles /><span>{item.rank}</span><b>[{item.grade}]</b></div><h2>{item.title}</h2><p className="true-name">TRUE NAME · {item.trueName}</p><div className="stat-grid"><Stat label="Durability" value={item.durability} suffix="/100" /><Stat label="Mana potency" value={item.mana} suffix="/100" /><div><span>MARKET VALUE</span><strong>{item.gold}<small> G</small> {item.silver}<small> S</small></strong></div><div><span>AFFINITIES</span><strong className="elements">{item.elements.join(" · ")}</strong></div></div><div className="lore"><span>GUILD ARCHIVE</span><p>{item.lore}</p></div><div className="traits"><span>TRAITS & ENCHANTMENTS</span>{item.traits.map((trait) => <b key={trait}>{trait}</b>)}</div>{level >= 3 ? <div className="secret"><span>{item.secret.toLowerCase().includes("curse") ? "HIDDEN CURSE" : "HIDDEN BLESSING"}</span><p>{item.secret}</p></div> : <div className="secret locked"><span>HIDDEN PROPERTY</span><p>Reach Appraisal Lv. 3 to pierce the veil.</p></div>}<footer><span>+{item.xp} EXP ACQUIRED</span><Button onClick={onShare}><Download /> Share relic card</Button></footer></article></div>;
}
function Stat({ label, value, suffix }: { label: string; value: number; suffix: string }) { return <div><span>{label}</span><strong>{value}<small>{suffix}</small></strong><i><em style={{ width: `${value}%` }} /></i></div>; }
function Codex(props: { items: SavedAppraisal[]; allItems: SavedAppraisal[]; rankFilter: string; setRankFilter: (v: string) => void; elementFilter: string; setElementFilter: (v: string) => void; elements: string[]; dateFilter: string; setDateFilter: (v: string) => void; onOpen: (item: SavedAppraisal) => void }) {
  return <section className="codex"><div className="codex-title"><span>記録</span><div><p>THE APPRAISER'S</p><h2>Grimoire</h2></div><strong>{props.allItems.length} RELICS</strong></div><div className="filters"><select aria-label="Filter by rank" value={props.rankFilter} onChange={(e) => props.setRankFilter(e.target.value)}><option>All</option>{Object.keys(ranks).map((rank) => <option key={rank}>{rank}</option>)}</select><select aria-label="Filter by element" value={props.elementFilter} onChange={(e) => props.setElementFilter(e.target.value)}><option>All</option>{props.elements.map((element) => <option key={element}>{element}</option>)}</select><select aria-label="Filter by date" value={props.dateFilter} onChange={(e) => props.setDateFilter(e.target.value)}><option>All time</option><option>Today</option><option>This week</option></select></div>{props.items.length ? <div className="relic-grid">{props.items.map((item) => <Button variant="ghost" className={`relic-card ${ranks[item.rank].glow}`} key={item.id} onClick={() => props.onOpen(item)}>{item.thumbnail ? <img src={item.thumbnail} alt="" /> : <div className="relic-placeholder">鑑</div>}<div><span>{item.rank} [{item.grade}]</span><h3>{item.title}</h3><p>{item.elements.join(" · ")}</p><small>{new Date(item.date).toLocaleDateString()}</small></div></Button>)}</div> : <div className="empty-codex"><BookOpen /><h3>No relics answer your filters</h3><p>Return to the arcane lens and appraise something worthy.</p></div>}</section>;
}
function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, max: number, height: number) { const words = text.split(" "); let line = ""; words.forEach((word) => { const test = `${line}${word} `; if (ctx.measureText(test).width > max && line) { ctx.fillText(line, x, y); line = `${word} `; y += height; } else line = test; }); ctx.fillText(line, x, y); }