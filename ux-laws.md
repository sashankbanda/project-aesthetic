# UX Laws — Rules for UI & Frontend Work

These are the UX principles that should guide **all UI and frontend code generated in this project**. They are adapted from the Laws of UX into concrete, actionable rules for an AI coding assistant. Before building any interface — a component, a page, a flow, a layout — consult the relevant laws below and apply their rules. When two rules tension against each other (e.g. simplicity vs. familiarity), favor the user's ease of completing their goal, and note the tradeoff. Treat these as defaults, not dogma: they exist to reduce the user's cognitive and physical effort, build on what users already know, and make interfaces feel fast, clear, and trustworthy.

## Table of Contents

1. [Aesthetic-Usability Effect](#aesthetic-usability-effect)
2. [Choice Overload](#choice-overload)
3. [Chunking](#chunking)
4. [Cognitive Bias](#cognitive-bias)
5. [Cognitive Load](#cognitive-load)
6. [Doherty Threshold](#doherty-threshold)
7. [Fitts's Law](#fittss-law)
8. [Flow](#flow)
9. [Goal-Gradient Effect](#goal-gradient-effect)
10. [Hick's Law](#hicks-law)
11. [Jakob's Law](#jakobs-law)
12. [Law of Common Region](#law-of-common-region)
13. [Law of Proximity](#law-of-proximity)
14. [Law of Prägnanz](#law-of-prägnanz)
15. [Law of Similarity](#law-of-similarity)
16. [Law of Uniform Connectedness](#law-of-uniform-connectedness)
17. [Mental Model](#mental-model)
18. [Miller's Law](#millers-law)
19. [Occam's Razor](#occams-razor)
20. [Paradox of the Active User](#paradox-of-the-active-user)
21. [Pareto Principle](#pareto-principle)
22. [Parkinson's Law](#parkinsons-law)
23. [Peak-End Rule](#peak-end-rule)
24. [Postel's Law](#postels-law)
25. [Selective Attention](#selective-attention)
26. [Serial Position Effect](#serial-position-effect)
27. [Tesler's Law](#teslers-law)
28. [Von Restorff Effect](#von-restorff-effect)
29. [Working Memory](#working-memory)
30. [Zeigarnik Effect](#zeigarnik-effect)

---

## Aesthetic-Usability Effect

**Principle** — Users perceive good-looking interfaces as easier to use, and forgive minor flaws when a design looks polished.

**Rules for me to follow**

- Treat visual polish (spacing, typography, alignment, consistent color) as a functional requirement, not decoration.
- Never let attractive styling become an excuse to ship broken behavior — verify the interaction actually works.
- Be aware that a pretty mockup can hide usability problems, so test flows on their merits, not their looks.
- Keep visual quality consistent across the whole UI so trust built on one screen isn't broken on the next.

---

## Choice Overload

**Principle** — Presenting too many options at once overwhelms users and degrades both their decisions and their satisfaction.

**Rules for me to follow**

- Limit the number of options shown at any one moment; reveal secondary choices progressively.
- Highlight a recommended or default option to give users an easy starting point.
- When users must compare items (e.g. pricing tiers), lay them out side by side for easy evaluation.
- Provide search, filtering, and sorting up front so users can narrow large sets before deciding.

---

## Chunking

**Principle** — Breaking information into small, meaningful groups makes it far easier to scan, process, and remember.

**Rules for me to follow**

- Group related content into visually distinct blocks rather than presenting one undifferentiated wall of text or fields.
- Split long forms, articles, and number strings (phone, card, code) into logical segments.
- Give each chunk a clear heading or label so users can jump straight to what they need.
- Use hierarchy and whitespace to signal where one group ends and the next begins.

---

## Cognitive Bias

**Principle** — Users rely on mental shortcuts that systematically skew their perception and decisions, often without their awareness.

**Rules for me to follow**

- Design honestly: don't exploit biases (false urgency, dark patterns, misleading defaults) to manipulate users.
- Account for confirmation bias by presenting information clearly and neutrally rather than only reinforcing expectations.
- Use sensible, user-friendly defaults, knowing users tend to stick with whatever is preselected.
- Watch for your own biases when guessing what users want — validate assumptions against real behavior.

---

## Cognitive Load

**Principle** — Every interface demands mental effort; when that effort exceeds what users can spare, tasks fail and people feel overwhelmed.

**Rules for me to follow**

- Strip out extraneous load: remove decorative clutter, redundant elements, and anything that doesn't help the user's task.
- Offload memory and effort onto the system — autofill, sensible defaults, carrying context between steps.
- Surface only the information relevant to the current step; defer the rest.
- Use familiar patterns so users spend effort on their goal, not on learning the interface.

---

## Doherty Threshold

**Principle** — Productivity and engagement climb when the system responds fast enough (under ~400ms) that users never wait on it.

**Rules for me to follow**

- Aim for system feedback in under 400ms; acknowledge every user action immediately, even before work finishes.
- Use perceived-performance techniques — skeleton screens, optimistic UI, instant visual response — to reduce the feeling of waiting.
- Show progress indicators or progress bars for operations that genuinely take time.
- Use animation purposefully to keep users engaged during background processing, without slowing the actual task.

---

## Fitts's Law

**Principle** — The time to hit a target depends on its size and distance, so larger, closer targets are faster and more accurate.

**Rules for me to follow**

- Make interactive targets (buttons, links, icons) large enough to select accurately, especially on touch devices — aim for at least ~44px touch targets.
- Place primary actions close to where the user's attention or cursor already is.
- Give clickable elements ample spacing so users don't hit the wrong one.
- Exploit screen edges and corners for high-value actions, since they're easy to acquire.

---

## Flow

**Principle** — Users do their best work in a state of focused, enjoyable immersion that comes from matching challenge to their skill.

**Rules for me to follow**

- Remove unnecessary friction and interruptions that break concentration mid-task.
- Give clear, immediate feedback so users always know what they did and what happened.
- Match complexity to the user's skill: simplify for novices, expose power for experts (progressive disclosure).
- Keep relevant features and content discoverable so users stay engaged rather than getting stuck.

---

## Goal-Gradient Effect

**Principle** — Motivation to finish increases the closer users get to a goal.

**Rules for me to follow**

- Show clear, visible progress toward completion (step counters, progress bars, checklists).
- Give users a head start when possible (e.g. a loyalty card with the first stamps pre-filled) to boost momentum.
- Break long tasks into stages so each completed stage signals tangible advancement.
- Make the final step feel close and easy to encourage users to finish.

---

## Hick's Law

**Principle** — The more options and the more complex they are, the longer it takes a user to decide.

**Rules for me to follow**

- Minimize the number of choices when speed matters (checkout, key navigation, first-run screens).
- Break complex tasks into smaller sequential steps to reduce decision load.
- Highlight recommended options instead of presenting everything as equal.
- Use progressive onboarding to introduce features gradually rather than all at once.
- Don't oversimplify to the point that options become vague or hard to understand.

---

## Jakob's Law

**Principle** — Users spend most of their time on other sites and expect yours to work the same way as the ones they already know.

**Rules for me to follow**

- Use established, conventional patterns for common UI (navigation, search, cart, forms) rather than inventing new ones.
- Leverage existing mental models so users can apply prior knowledge instead of learning from scratch.
- Only break a convention when the gain clearly outweighs the cost of the surprise.
- When changing a familiar interface, let users opt into the new version or ease the transition rather than forcing abrupt change.

---

## Law of Common Region

**Principle** — Elements inside a shared, clearly bounded area are perceived as a group.

**Rules for me to follow**

- Use cards, panels, or bordered containers to visually bundle related controls and content.
- Add a shared background or boundary to signal that elements belong together.
- Separate unrelated groups by giving each its own region rather than relying on spacing alone.
- Use common region to clarify structure on dense screens (dashboards, settings, forms).

---

## Law of Proximity

**Principle** — Objects placed near each other are perceived as related.

**Rules for me to follow**

- Position related items close together and push unrelated ones apart using whitespace.
- Keep labels tight to their corresponding inputs, and captions tight to their images.
- Use spacing — not just lines or boxes — as the primary tool for grouping content.
- Ensure gaps between groups are clearly larger than gaps within a group.

---

## Law of Prägnanz

**Principle** — People interpret ambiguous or complex visuals as the simplest form possible, because simplicity costs the least mental effort.

**Rules for me to follow**

- Favor simple, clean shapes and layouts over ornate or visually noisy ones.
- Reduce complex graphics and icons to their clearest essential form.
- Keep layouts orderly and predictable so users grasp them at a glance.
- Avoid visual complexity that forces users to work to understand structure.

---

## Law of Similarity

**Principle** — Elements that look alike are perceived as related or sharing the same function.

**Rules for me to follow**

- Style elements with the same purpose consistently (all primary buttons look alike, all links share one treatment).
- Use color, shape, and size deliberately to communicate which items belong together.
- Make interactive elements visually distinct from static text so users can tell what's clickable.
- Avoid styling unrelated elements identically, which falsely implies a connection.

---

## Law of Uniform Connectedness

**Principle** — Elements that are visually connected feel more related than elements that merely sit near each other.

**Rules for me to follow**

- Visually tie related items together with shared containers, lines, frames, or background color.
- Use explicit connectors (lines, arrows) to show relationships in flows, steps, or diagrams.
- Connect labels, controls, and their actions so their relationship is unmistakable.
- Use connection to emphasize and prioritize a related set of items over surrounding content.

---

## Mental Model

**Principle** — Users carry an internal model of how things work and expect new systems to behave in line with it.

**Rules for me to follow**

- Match interface behavior to users' existing expectations for that type of product (e-commerce, mail, settings).
- Reuse familiar conventions and patterns so knowledge transfers from other products.
- Use terminology, icons, and flows that reflect how users think, not how the system is built internally.
- When research or feedback reveals a mismatch, adjust the design toward the user's model rather than forcing them to adopt yours.

---

## Miller's Law

**Principle** — The average person can hold only about 7 (±2) items in working memory at once.

**Rules for me to follow**

- Chunk content into small, digestible groups instead of long undivided lists.
- Don't force users to remember information across steps — display it when and where it's needed.
- Keep menus, option sets, and groupings reasonably short rather than exhaustive.
- Don't cite "seven items" as a hard cap to justify arbitrary limits; chunk based on meaning and context.

---

## Occam's Razor

**Principle** — Among designs that work equally well, the one with the fewest elements and assumptions is best.

**Rules for me to follow**

- Remove every element that isn't essential to the task, without harming function.
- Prefer the simplest solution that fully meets the requirement.
- Question each added control, field, or step — justify it or cut it.
- Consider a design finished only when nothing more can be removed.

---

## Paradox of the Active User

**Principle** — Users dive straight into using software and won't read manuals or documentation first, even though doing so might help.

**Rules for me to follow**

- Design so users can succeed immediately without reading instructions first.
- Embed guidance in context — inline tips, tooltips, empty states — instead of separate docs.
- Make help available at the moment of need, along whatever path the user takes.
- Ensure default behavior is safe and forgiving for users who skip setup and just start.

---

## Pareto Principle

**Principle** — Roughly 80% of outcomes come from 20% of causes, so a small set of features drives most of the value.

**Rules for me to follow**

- Identify and prioritize the few features and flows users rely on most, and make them excellent.
- Spend effort where it benefits the largest number of users, not on rarely used edge features.
- Don't let low-impact functionality clutter or slow down the high-impact core.
- Use real usage data to decide what to refine, surface, or de-emphasize.

---

## Parkinson's Law

**Principle** — A task expands to fill the time available, so reducing the time a task takes improves the experience.

**Rules for me to follow**

- Minimize the steps and time required to complete core tasks.
- Use autofill, smart defaults, and saved data to speed up forms and checkouts.
- Remove unnecessary friction so a task finishes faster than the user expected.
- Set and meet fast completion expectations rather than letting flows drag out.

---

## Peak-End Rule

**Principle** — People judge an experience mainly by its most intense moment and its ending, not the average of all moments.

**Rules for me to follow**

- Identify the emotional peaks of a flow and design those moments to delight (success states, key confirmations).
- Make endings memorable and positive — order confirmations, completion screens, sign-offs.
- Smooth out potential negative peaks (errors, waits) since people remember bad moments more vividly.
- Add tasteful moments of personality or reward at high-value points rather than spreading effort evenly.

---

## Postel's Law

**Principle** — Be liberal in what you accept from users and conservative in what you send — tolerate varied input, return reliable, clear output.

**Rules for me to follow**

- Accept input in flexible formats (dates, phone numbers, spacing, casing) and normalize it for the user.
- Anticipate a wide range of user actions, inputs, and capabilities, and handle them gracefully.
- Define clear input boundaries and give immediate, helpful feedback when something's off.
- Build resilience and accessibility in from the start so the interface holds up under unexpected use.

---

## Selective Attention

**Principle** — Users focus on a subset of stimuli tied to their goals and filter out the rest, including things that look like ads.

**Rules for me to follow**

- Guide attention to the most important content and actions through clear visual hierarchy.
- Don't style important content to look like ads, and keep it out of ad-like positions, to avoid banner blindness.
- Make significant changes (errors, updates) noticeable with strong cues so they aren't missed (change blindness).
- Reduce competing distractions so the user's goal stays the most prominent thing on screen.

---

## Serial Position Effect

**Principle** — Users best remember the first and last items in a series, and recall the middle least well.

**Rules for me to follow**

- Place the most important navigation items and actions at the start and end of a list or bar.
- Put less critical items in the middle, where they're least likely to be remembered.
- Lead with key information and close with a clear call to action or summary.
- Order menus and lists intentionally rather than arbitrarily, given position affects recall.

---

## Tesler's Law

**Principle** — Every system has an irreducible amount of complexity; the only question is who absorbs it — the system or the user.

**Rules for me to follow**

- Absorb inherent complexity in the design and code so the user doesn't have to handle it.
- Don't push avoidable complexity onto users (e.g. asking them for data the system can derive).
- Design for real, sometimes irrational behavior, not an idealized perfectly logical user.
- Provide in-context guidance for the complexity that genuinely can't be removed.

---

## Von Restorff Effect

**Principle** — When several similar items are shown, the one that stands out is the one most likely to be remembered.

**Rules for me to follow**

- Make the single most important action or piece of information visually distinct (the primary button, a highlighted plan).
- Use emphasis sparingly — if everything stands out, nothing does.
- Don't rely on color alone to signal importance; pair it with shape, size, or label for color-blind and low-vision users.
- Be cautious using motion for emphasis, and respect reduced-motion preferences for motion-sensitive users.

---

## Working Memory

**Principle** — Working memory temporarily holds only a few chunks of information for a short time, and favors recognition over recall.

**Rules for me to follow**

- Keep the information a user must hold in mind to a minimum at each step.
- Favor recognition over recall — show options and prior context instead of making users remember them.
- Mark what's already been seen or done (visited links, breadcrumbs, completed steps).
- Carry needed information across screens (e.g. comparison tables, persistent summaries) so users don't have to memorize it.

---

## Zeigarnik Effect

**Principle** — People remember unfinished or interrupted tasks better than completed ones, which can be used to encourage completion.

**Rules for me to follow**

- Signal that more content or steps exist (peeking content, "next" cues) to invite users to continue.
- Show progress toward completion so the unfinished state motivates users to finish.
- Use endowed progress (a head start on a goal) to increase the drive to complete.
- Let users pause and resume tasks, preserving the sense of an open loop they'll want to close.

---

## Source

These rules are adapted and condensed from **[Laws of UX](https://lawsofux.com/)** by **Jon Yablonski** — a collection of best practices for designers and developers building user interfaces. All principles, names, and underlying research are credited to that work and its cited sources. Text here has been paraphrased into project-specific coding rules and is not a verbatim copy of the original site.
