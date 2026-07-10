// ============================================================
// Feedback effects — vibration + Web Audio chime. Shared by the
// workout tracker and Gym Mode. Everything feature-detected.
// ============================================================

export const haptic = (pattern: number | number[] = 30) => {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(pattern);
};

let audioCtx: AudioContext | null = null;

/** Must be called from a user gesture (ticking a set) to unlock iOS audio. */
export function unlockAudio() {
  try {
    audioCtx ??= new AudioContext();
    if (audioCtx.state === "suspended") void audioCtx.resume();
  } catch {
    /* no audio available — vibration still fires */
  }
}

/** Two-tone "rest over" chime. */
export function chime() {
  if (!audioCtx || audioCtx.state !== "running") return;
  const t0 = audioCtx.currentTime;
  const notes: [number, number][] = [
    [880, 0], // A5
    [1174.66, 0.18], // D6
  ];
  for (const [freq, dt] of notes) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t0 + dt);
    gain.gain.exponentialRampToValueAtTime(0.35, t0 + dt + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dt + 0.55);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(t0 + dt);
    osc.stop(t0 + dt + 0.6);
  }
}

/** Spoken coach line — SpeechSynthesis is free, offline, and on every phone. */
export function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.05;
    window.speechSynthesis.speak(u);
  } catch {
    /* voice unavailable — the screen still shows everything */
  }
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}
