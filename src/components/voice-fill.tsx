"use client";
// Mic button for hands-typing-free set entry — say "60 kilos, 8 reps".
// Web Speech API only (free, on-device UI): renders nothing where
// unsupported, so it's a bonus input, never a dependency.
import { useEffect, useRef, useState } from "react";
import { Mic } from "lucide-react";
import { haptic } from "@/lib/fx";
import { parseSetSpeech } from "@/lib/voice";

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: { results: { 0: { transcript: string } }[] }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
}

function getRecognizer(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export default function VoiceFill({
  onFill,
}: {
  onFill: (result: { weight?: number; reps?: number }) => void;
}) {
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState("");
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  useEffect(() => () => recRef.current?.stop(), []);

  const Ctor = getRecognizer();
  if (!Ctor) return null;

  const start = () => {
    if (listening) {
      recRef.current?.stop();
      return;
    }
    haptic();
    const rec = new Ctor();
    recRef.current = rec;
    rec.lang = navigator.language || "en-IN";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      const transcript = e.results[0]?.[0]?.transcript ?? "";
      setHeard(transcript);
      const parsed = parseSetSpeech(transcript);
      if (parsed.weight !== undefined || parsed.reps !== undefined) {
        haptic([40, 30, 40]);
        onFill(parsed);
      }
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.start();
    setListening(true);
    setHeard("");
  };

  return (
    <div className="flex items-center gap-2.5" data-tour="train-voice">
      <button
        onClick={start}
        aria-label={listening ? "stop listening" : "speak weight and reps"}
        className={`pressable grid h-11 w-11 shrink-0 place-items-center rounded-xl border transition ${
          listening ? "animate-pulse border-accent/50 bg-accent/15 text-accent" : "border-line bg-elev text-dim"
        }`}
      >
        <Mic size={16} />
      </button>
      <span className="min-w-0 flex-1 truncate text-[11px] text-faint">
        {listening ? "Listening… say “60 kilos, 8 reps”" : heard ? `Heard: “${heard}”` : "Or say it: “60 kilos, 8 reps”"}
      </span>
    </div>
  );
}
