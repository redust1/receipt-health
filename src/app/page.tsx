"use client";

import { useRef, useState } from "react";
import { Camera, Upload, AlertTriangle, CheckCircle, XCircle, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import { LogoMark } from "@/components/LogoMark";

type Warning = "green" | "yellow" | "red";
type Category = "飲料" | "食品" | "日用品";

interface AnalyzedItem {
  name: string;
  category: Category;
  warning: Warning;
  reason: string;
  ingredients?: string[];
}

interface AnalysisResult {
  healthScore: number;
  summary: string;
  items: AnalyzedItem[];
}

type AppState = "idle" | "preview" | "loading" | "result" | "error";

const WARNING_CONFIG = {
  green: { icon: CheckCircle, color: "text-[#4CAF50]", bg: "bg-[#E8F5E9]", border: "border-[#A5D6A7]", label: "良好" },
  yellow: { icon: AlertTriangle, color: "text-[#F59E0B]", bg: "bg-amber-50", border: "border-amber-200", label: "注意" },
  red: { icon: XCircle, color: "text-[#F44336]", bg: "bg-red-50", border: "border-red-200", label: "要注意" },
};

function ScoreRing({ score }: { score: number }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const progress = circ - (score / 100) * circ;
  const color = score >= 70 ? "#4CAF50" : score >= 40 ? "#FFC107" : "#F44336";

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#E8F5E9" strokeWidth="12" />
        <circle
          cx="70" cy="70" r={r} fill="none"
          stroke={color} strokeWidth="12"
          strokeDasharray={circ}
          strokeDashoffset={progress}
          strokeLinecap="round"
          transform="rotate(-90 70 70)"
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
        <text x="70" y="65" textAnchor="middle" fontSize="32" fontWeight="bold" fill={color}>{score}</text>
        <text x="70" y="85" textAnchor="middle" fontSize="13" fill="#666">健康スコア</text>
      </svg>
    </div>
  );
}

function ItemCard({ item }: { item: AnalyzedItem }) {
  const [open, setOpen] = useState(false);
  const cfg = WARNING_CONFIG[item.warning];
  const Icon = cfg.icon;

  return (
    <div className={`rounded-2xl border ${cfg.border} ${cfg.bg} overflow-hidden`}>
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
        onClick={() => (item.category !== "日用品") && setOpen(!open)}
      >
        <Icon size={18} className={cfg.color} />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-gray-800 truncate">{item.name}</p>
          <p className="text-xs text-gray-500">{item.category}</p>
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.color} bg-white/60`}>{cfg.label}</span>
        {item.category !== "日用品" && (
          open ? <ChevronUp size={16} className="text-gray-400 shrink-0" /> : <ChevronDown size={16} className="text-gray-400 shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-3 text-sm text-gray-700 border-t border-white/50 pt-2 space-y-1">
          <p>{item.reason}</p>
          {item.ingredients && item.ingredients.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {item.ingredients.map((ing) => (
                <span key={ing} className="bg-white/70 text-xs px-2 py-0.5 rounded-full border border-gray-200">{ing}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [state, setState] = useState<AppState>("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const url = URL.createObjectURL(file);
    setPreview(url);
    setSelectedFile(file);
    setState("preview");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("image/")) handleFile(file);
  };

  const compressImage = (file: File): Promise<Blob> =>
    new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const MAX = 1600;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round((height * MAX) / width); width = MAX; }
          else { width = Math.round((width * MAX) / height); height = MAX; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(url);
        canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.82);
      };
      img.src = url;
    });

  const analyze = async () => {
    if (!selectedFile) return;
    setState("loading");

    const compressed = await compressImage(selectedFile);
    const formData = new FormData();
    formData.append("image", compressed, "receipt.jpg");

    try {
      const res = await fetch("/api/analyze", { method: "POST", body: formData });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setResult(data);
      setState("result");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "エラーが発生しました");
      setState("error");
    }
  };

  const reset = () => {
    setState("idle");
    setPreview(null);
    setSelectedFile(null);
    setResult(null);
    setErrorMsg("");
    if (fileRef.current) fileRef.current.value = "";
  };

  if (state === "loading") {
    return (
      <main className="flex flex-col flex-1 items-center justify-center px-6 gap-8 safe-bottom">
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 rounded-full border-4 border-[#E8F5E9]" />
          <div className="absolute inset-0 rounded-full border-4 border-[#4CAF50] border-t-transparent animate-spin-slow" />
          <div className="absolute inset-0 flex items-center justify-center">
            <LogoMark size={36} />
          </div>
        </div>
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold text-gray-800">AIがレシートを読み取り中...</p>
          <p className="text-sm text-gray-500">食品成分を分析しています</p>
        </div>
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2 h-2 rounded-full bg-[#4CAF50] animate-pulse-dot"
              style={{ animationDelay: `${i * 0.3}s` }}
            />
          ))}
        </div>
      </main>
    );
  }

  if (state === "result" && result) {
    const food = result.items.filter((i) => i.category === "食品" || i.category === "飲料");
    const other = result.items.filter((i) => i.category === "日用品");

    return (
      <main className="flex flex-col flex-1 max-w-md mx-auto w-full px-4 pt-6 pb-8 gap-5 safe-bottom safe-top overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-3">
          <LogoMark size={32} />
          <h1 className="text-lg font-bold text-gray-800">健康チェック結果</h1>
          <button onClick={reset} className="ml-auto p-2 -mr-1 rounded-full active:bg-gray-100 touch-manipulation">
            <RotateCcw size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Score */}
        <div className="bg-white rounded-3xl p-6 shadow-sm flex flex-col items-center gap-3">
          <ScoreRing score={result.healthScore} />
          <p className="text-sm text-gray-600 text-center">{result.summary}</p>
        </div>

        {/* Food & Drinks */}
        {food.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-gray-500 px-1">食品・飲料 ({food.length}品)</h2>
            {food.map((item, i) => <ItemCard key={i} item={item} />)}
          </section>
        )}

        {/* Household */}
        {other.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-gray-500 px-1">日用品 ({other.length}品)</h2>
            {other.map((item, i) => <ItemCard key={i} item={item} />)}
          </section>
        )}

        <button
          onClick={reset}
          className="w-full py-4 rounded-2xl border border-[#4CAF50] text-[#4CAF50] font-semibold text-sm active:bg-[#E8F5E9] transition-colors touch-manipulation"
        >
          別のレシートを分析する
        </button>
      </main>
    );
  }

  if (state === "error") {
    return (
      <main className="flex flex-col flex-1 items-center justify-center px-6 gap-6 safe-bottom">
        <XCircle size={48} className="text-red-400" />
        <div className="text-center">
          <p className="font-semibold text-gray-800">エラーが発生しました</p>
          <p className="text-sm text-gray-500 mt-1">{errorMsg}</p>
        </div>
        <button onClick={reset} className="px-8 py-4 rounded-2xl bg-[#4CAF50] text-white font-semibold text-base touch-manipulation">
          もう一度試す
        </button>
      </main>
    );
  }

  // idle / preview
  return (
    <main className="flex flex-col flex-1 max-w-md mx-auto w-full px-4 pt-8 pb-6 gap-7 safe-bottom safe-top">
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <LogoMark size={40} />
        <span className="font-bold text-gray-800 text-xl tracking-tight">Receipt Health</span>
      </div>

      {/* Hero */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900 leading-snug">
          レシートから<br />
          <span className="text-[#4CAF50]">健康を見える化</span>
        </h1>
        <p className="text-sm text-gray-500 leading-relaxed">
          スーパー・コンビニのレシートを撮影するだけで、AIが食品成分を自動分析します。
        </p>
      </div>

      {/* Upload area */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />

      {state === "preview" && preview ? (
        <div className="space-y-3 flex-1 flex flex-col">
          <div className="rounded-3xl overflow-hidden border-2 border-[#4CAF50] shadow-sm flex-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="レシートプレビュー" className="w-full h-full object-contain max-h-64" />
          </div>
          <button
            onClick={analyze}
            className="w-full py-4 rounded-2xl bg-[#4CAF50] text-white font-bold text-base shadow-md active:scale-95 transition-transform touch-manipulation"
          >
            このレシートを分析する →
          </button>
          <button onClick={reset} className="w-full py-2 text-sm text-gray-400 touch-manipulation">
            選び直す
          </button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
          className="flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-[#A5D6A7] bg-[#E8F5E9] py-12 cursor-pointer active:scale-95 transition-transform touch-manipulation select-none"
        >
          <div className="w-16 h-16 rounded-full bg-[#4CAF50] flex items-center justify-center shadow-md">
            <Camera size={30} className="text-white" />
          </div>
          <div className="text-center space-y-1">
            <p className="font-semibold text-gray-700">レシートを撮影 / アップロード</p>
            <p className="text-xs text-gray-400">タップして選択、またはドラッグ＆ドロップ</p>
          </div>
          <div className="flex items-center gap-2 text-[#4CAF50] text-sm font-medium">
            <Upload size={14} />
            <span>写真を選ぶ</span>
          </div>
        </div>
      )}

      {/* Features */}
      <div className="grid grid-cols-3 gap-3 text-center">
        {[
          { emoji: "🛒", label: "食品分類" },
          { emoji: "🧪", label: "成分分析" },
          { emoji: "💚", label: "健康スコア" },
        ].map(({ emoji, label }) => (
          <div key={label} className="bg-white rounded-2xl py-4 shadow-sm">
            <div className="text-2xl">{emoji}</div>
            <div className="text-xs text-gray-500 mt-1">{label}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
