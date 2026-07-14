// ============================================================
// Tour registry — the ONE place tours are defined.
//
// RULE (enforced by tour-registry.test.ts): every user-facing
// feature gets a `data-tour="<key>"` attribute on its anchor
// element AND a stop here. The test fails if the two ever drift,
// so new features cannot ship untoured.
//
// quick: true → included in the 30-second Quick Tour.
// Stops whose element isn't found (conditional features, desktop
// vs mobile) are skipped automatically by the engine.
// ============================================================

export interface TourStop {
  /** matches the element's data-tour attribute */
  key: string;
  /** the page the target lives on — the engine navigates there */
  path: string;
  title: string;
  text: string;
  quick?: boolean;
}

export const TOUR_STOPS: TourStop[] = [
  // ---------- Home ----------
  {
    key: "hero",
    path: "/",
    quick: true,
    title: "Today, decided for you",
    text: "Your plan puts the right workout here every day. One tap starts it — sets, reps and weights come pre-filled.",
  },
  {
    key: "stats",
    path: "/",
    quick: true,
    title: "Your vitals",
    text: "Streak, weight and protein at a glance. Every 14 clean days banks a 🛡 shield that absorbs one missed day — a sick day won't erase two months.",
  },
  {
    key: "checkin",
    path: "/",
    quick: true,
    title: "Two-second check-ins",
    text: "Water, sleep, steps and mood — everything logs with a single tap, and taps are reversible.",
  },
  // ---------- Train ----------
  {
    key: "train-strip",
    path: "/workout",
    title: "Your session, live",
    text: "Check in to start the clock, watch sets tick up, and use ⋯ to undo anything done by mistake.",
  },
  {
    key: "train-set-timer",
    path: "/workout",
    title: "Time the set itself",
    text: "Tap the stopwatch, lift, then tap ✓ — the set's real duration is recorded and the rest timer starts on its own.",
  },
  {
    key: "train-swap",
    path: "/workout",
    title: "Station taken?",
    text: "Swap any exercise for one that hits the same movement with your equipment — and swap back the same way.",
  },
  {
    key: "train-reorder",
    path: "/workout",
    title: "Dodge the Monday crowd",
    text: "Everyone benches on Monday. Shift which workout opens your week — recovery spacing stays intact.",
  },
  {
    key: "train-own",
    path: "/workout",
    title: "Own exercises",
    text: "Stretching, planks, hangs — pick a name (your history becomes tap-chips) and run the stopwatch.",
  },
  // ---------- Fuel ----------
  {
    key: "fuel-hero",
    path: "/nutrition",
    title: "One number that matters",
    text: "Hit the protein target and nutrition is 90% handled. One-tap foods below, budget-friendly gap fillers included.",
  },
  // ---------- Progress ----------
  {
    key: "photos-compare",
    path: "/photos",
    title: "Day 1 vs day 90",
    text: "Pick any two months and drag the slider — the photos (which never leave your device) tell the truth the mirror hides.",
  },
  {
    key: "share-receipt",
    path: "/analytics",
    title: "Print the receipt",
    text: "Any workout becomes a shareable gym receipt — itemized lifts, PRs starred, volume paid in full.",
  },
  {
    key: "analytics-volume",
    path: "/analytics",
    title: "Where your effort goes",
    text: "Weekly sets per muscle, your recovery map, consistency grid and PRs — the proof it's working.",
  },
  // ---------- More ----------
  {
    key: "more-plan",
    path: "/more",
    title: "Switch goals anytime",
    text: "Rebuild your weekly plan around a new goal in a minute — your history always stays.",
  },
  {
    key: "more-coach",
    path: "/more",
    title: "Your AI coach",
    text: "Weekly check-ins read your actual training data and tell you the one thing to change.",
  },
  {
    key: "more-challenges",
    path: "/more",
    title: "Commit to an arc",
    text: "30, 60 or 90 days — the app counts your adherence so the calendar can't lie to you.",
  },
  // ---------- tab bar (mobile) ----------
  {
    key: "tab-train",
    path: "/",
    quick: true,
    title: "Train",
    text: "Your workout tracker: tick sets, auto rest timer, Gym Mode for barely touching the phone.",
  },
  {
    key: "tab-fuel",
    path: "/",
    quick: true,
    title: "Fuel",
    text: "Protein tracking with one-tap foods — and budget-friendly suggestions to close the gap.",
  },
  {
    key: "tab-progress",
    path: "/",
    quick: true,
    title: "Progress",
    text: "Measurements, progress photos (they never leave your device) and analytics.",
  },
  {
    key: "tab-more",
    path: "/",
    quick: true,
    title: "Everything else",
    text: "AI coach, challenges, plan switching, themes, reminders, backups — and both tours, anytime.",
  },
];
