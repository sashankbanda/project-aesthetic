# Programming Principles

The evidence-based rules behind every generated workout plan. Each numeric
claim below is cited so any plan the generator produces can be audited against
the literature. Citations are collected in [References](#references).

---

## 1. Progressive Overload

Progressive overload — the gradual increase of stress on the body over time —
is the non-negotiable driver of every plan. Nothing else in this document
matters without it.

The default mechanism is **double progression**: work within a target rep
range, add reps each session until you hit the top of the range on all working
sets, then add load and drop back to the bottom of the range. Reps first, load
second — two levers alternating [(double progression method)][dp].

For **bodyweight** movements, load is fixed, so progression means advancing to a
harder variation (e.g. incline push-up → full push-up → decline push-up). See
[§9](#9-bodyweight-progression-chains). This is the same overload principle
applied through leverage rather than external weight; it is endorsed as a valid
hypertrophy stimulus when sets are taken close to failure [(Schoenfeld et al.
2017, load)][load].

---

## 2. Weekly Volume Landmarks

Volume — hard sets per muscle per week — is the primary dose knob for
hypertrophy. Schoenfeld, Ogborn & Krieger's 2017 dose-response meta-analysis
found a roughly linear relationship, with **10+ weekly sets** per muscle
producing superior growth versus lower volumes [(Schoenfeld et al. 2017,
volume)][vol]. Renaissance Periodization's MEV/MAV/MRV framework operationalizes
this into per-muscle landmarks [(RP volume landmarks)][rp].

| Experience | Sets/muscle/week | Notes |
|------------|------------------|-------|
| Beginner | ~8–10 | Near-maximal response at low doses; build tolerance |
| Intermediate | 10–16 | Core productive range (MEV→MAV) |
| Advanced | 16–20+ | Approaching MRV; requires deload management |

- **MEV** (Minimum Effective Volume): least work that still grows muscle (~8–12 sets for most muscles).
- **MAV** (Maximum Adaptive Volume): range where added sets add growth.
- **MRV** (Maximum Recoverable Volume): the ceiling recovery allows — exceed it and progress stalls.

Start a cycle near MEV, ramp toward MRV, then deload ([§6](#6-deloads)) [(RP volume landmarks)][rp].

---

## 3. Rep Ranges by Goal

Load and rep range are selected by the plan's primary goal. Maximal strength
requires heavy loads; hypertrophy is achievable across a wide spectrum **as long
as sets are taken close to failure** [(Schoenfeld et al. 2017, load)][load];
endurance uses light loads and high reps [(ACSM 2009)][acsm].

| Goal | Reps | Load (%1RM) | Basis |
|------|------|-------------|-------|
| Strength | 3–6 | ~85–100% | Heavy loads maximize strength [(ACSM 2009)][acsm] |
| Hypertrophy | 6–12 | ~67–85% | Classic range; **5–30 reps works if near failure** [(Schoenfeld 2017, load)][load] |
| Endurance / conditioning | 12–20+ | 40–60% | High reps, short rest [(ACSM 2009)][acsm] |

The hypertrophy default is 6–12, but the generator may extend to the broader
5–30 evidence-based range for variation or equipment constraints, provided
proximity to failure is maintained.

---

## 4. Frequency

At **equal weekly volume**, training a muscle **≥2×/week beats 1×/week** for
hypertrophy [(Schoenfeld, Ogborn & Krieger 2016, frequency)][freq]. The
mechanism is volume distribution, not frequency itself — splitting sets across
more sessions keeps per-session quality high.

- Default: each muscle trained **2–3×/week**.
- Allow **~48 h recovery** for a given muscle group before training it hard again.

---

## 5. Rest Intervals

Longer rest supports higher-quality volume. Schoenfeld's 2016 RCT found **3-min
rest produced significantly more strength and hypertrophy than 1-min** in
trained men doing identical work [(Schoenfeld et al. 2016, rest)][rest].

| Context | Rest | Basis |
|---------|------|-------|
| Strength | 2–5 min | Full ATP-PCr recovery for max load [(ACSM 2009)][acsm] |
| Hypertrophy — compounds | ~2–3 min | Longer rest > 1 min for growth [(Schoenfeld 2016, rest)][rest] |
| Hypertrophy — isolations | 60–90 s | Smaller systemic cost |
| Circuits / fat-loss | 30–60 s | Density and metabolic demand [(ACSM 2009)][acsm] |

---

## 6. Deloads

Fatigue accumulates faster than fitness during hard blocks. Schedule a deload
**every 4–8 weeks** (survey average ~5.6 weeks) — or reactively when RPE rises
and performance drops [(deloading review)][deload].

- **Halve working sets** (e.g. 20 → ~10 sets/muscle), or
- **Reduce load ~40–50%** while keeping movement patterns.

Keep most sets at RPE 5–7. Duration: typically one week (5–7 days) [(deloading review)][deload].

---

## 7. Age-Group Rules

### 13–17 (adolescents)
A properly designed, **supervised** resistance program is safe and beneficial
for youth [(NSCA youth position 2009)][nsca].
- **Technique first**: learn each movement with a light load before adding weight.
- **Avoid 1RM maximal testing**; progress via reps and gradual load.
- Requires qualified supervision.

### 45–59 (masters)
- Extended warm-ups ([§11](#11-warm-up-standards)).
- Joint-friendly substitutions (e.g. trap-bar deadlift, neutral-grip pressing, leg press vs deep squat) offered by default.

### 60+ (older adults)
Follow WHO 2020 guidelines [(WHO 2020)][who]:
- **Multicomponent** activity emphasizing **balance + strength ≥3 days/week** for fall prevention.
- Muscle-strengthening for all major groups **≥2 days/week**.
- **150–300 min/week** moderate aerobic (or 75–150 min vigorous).
- Include a **physician-consultation note** before starting.

---

## 8. Sex-Based Programming

**Men and women follow the same fundamental programming.** Roberts et al. (2020)
found no significant sex difference in relative hypertrophy or lower-body
strength gains from identical protocols; if anything, relative upper-body
strength gains slightly favored women [(Roberts et al. 2020)][sex].

Two evidence-based nuances the generator applies:
- Women tend to **recover faster between sets**, so they may tolerate **shorter rest** and slightly **higher relative volume** without quality loss [(sex & fatigue)][fatigue].
- **Emphasis presets** (e.g. glute/lower focus or chest/arm focus) are offered as an explicit **user choice** — never assigned as a stereotyped default based on sex.

---

## 9. Bodyweight Progression Chains

Bodyweight plans follow the r/bodyweightfitness Recommended Routine structure:
paired push/pull exercises, each progressed through a chain of increasingly
difficult variations. Do the hardest variation you can manage for 3×5–8 reps;
when you clear the top of the range, advance to the next variation [(RR)][rr].

Example push-up chain:

```
wall → incline → full → decline → archer push-up
```

Analogous chains exist for rows, squats, hinges, and core. Progression = harder
leverage, the bodyweight equivalent of adding load ([§1](#1-progressive-overload)).

---

## 10. Cardio Integration by Goal

| Goal | Cardio prescription | Basis |
|------|---------------------|-------|
| Fat loss | 2–4 LISS **or** 1–2 HIIT sessions/week alongside lifting | Energy expenditure without excessive interference |
| Strength | Minimal; low-impact, scheduled **away from leg days** | Minimize interference / fatigue |
| General fitness | **150 min/week** moderate aerobic | [(WHO 2020)][who] |
| Endurance | Progressive duration, ramp **~10%/week** (Couch-to-5K style) | 10% rule limits overuse injury [(10% rule)][tenpct] |

The 10%/week ceiling is a guideline; true beginners or higher-risk users should
ramp more conservatively [(10% rule)][tenpct].

---

## 11. Warm-Up Standards

- **5–10 min general** warm-up (raise core temperature, mobilize target joints).
- **Ramp-up sets**: progressively loaded lighter sets before working weight on the first compound of a muscle group.
- **Seniors**: longer, more gradual warm-ups ([§7](#7-age-group-rules)).

---

## References

- [dp]: **Double progression method.** Legion Athletics. <https://legionathletics.com/double-progression/>
- [vol]: **Schoenfeld BJ, Ogborn D, Krieger JW (2017).** Dose-response relationship between weekly resistance training volume and increases in muscle mass: a systematic review and meta-analysis. *J Sports Sci* 35(11):1073–1082. <https://pubmed.ncbi.nlm.nih.gov/27433992/>
- [rp]: **Renaissance Periodization — Volume landmarks (MEV/MAV/MRV).** Israetel et al. <https://rpstrength.com/blogs/articles/training-volume-landmarks-muscle-growth>
- [load]: **Schoenfeld BJ, Grgic J, Ogborn D, Krieger JW (2017).** Strength and hypertrophy adaptations between low- vs. high-load resistance training: a systematic review and meta-analysis. *J Strength Cond Res* 31(12):3508–3523. <https://journals.lww.com/nsca-jscr/fulltext/2017/12000/strength_and_hypertrophy_adaptations_between_low_.31.aspx>
- [acsm]: **ACSM (2009).** Progression models in resistance training for healthy adults (position stand). *Med Sci Sports Exerc* 41(3):687–708. <https://pubmed.ncbi.nlm.nih.gov/19204579/>
- [freq]: **Schoenfeld BJ, Ogborn D, Krieger JW (2016).** Effects of resistance training frequency on measures of muscle hypertrophy: a systematic review and meta-analysis. *Sports Med* 46(11):1689–1697. <https://pubmed.ncbi.nlm.nih.gov/27102172/>
- [rest]: **Schoenfeld BJ, et al. (2016).** Longer interset rest periods enhance muscle strength and hypertrophy in resistance-trained men. *J Strength Cond Res* 30(7):1805–1812. <https://journals.lww.com/nsca-jscr/fulltext/2016/07000/longer_interset_rest_periods_enhance_muscle.3.aspx>
- [deload]: **Bell L, et al. (2024).** Deloading practices in strength and physique sports: a cross-sectional survey / practical review. <https://pmc.ncbi.nlm.nih.gov/articles/PMC10948666/>
- [nsca]: **Faigenbaum AD, et al. (2009).** Youth resistance training: updated position statement paper from the NSCA. *J Strength Cond Res* 23(S5):S60–S79. <https://pubmed.ncbi.nlm.nih.gov/19620931/>
- [who]: **WHO (2020).** Guidelines on physical activity and sedentary behaviour. <https://www.ncbi.nlm.nih.gov/books/NBK566046/>
- [sex]: **Roberts BM, et al. (2020).** Sex differences in resistance training: a systematic review and meta-analysis. *J Strength Cond Res* 34(5):1448–1460. <https://journals.lww.com/nsca-jscr/fulltext/2020/05000/sex_differences_in_resistance_training__a.30.aspx>
- [fatigue]: **The effects of biological sex on fatigue during and recovery from resistance exercise.** *PeerJ.* <https://peerj.com/articles/20542/>
- [rr]: **r/bodyweightfitness Recommended Routine.** <https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine/>
- [tenpct]: **The 10 percent rule.** RunnerClick. <https://runnerclick.com/10-percent-rule/>
