# HANDOFF · SD B2C Mini-Courses → App Integration

**For:** app dev team · **Owner:** Nelle (Product & User Dev)
**Live base:** `https://nelle3549.github.io/b2c-courses/` · **Repo:** `github.com/nelle3549/b2c-courses`
**Last updated:** 2026-07-14

Three self-directed mini-courses as static HTML pages, designed to be iframed inside the app.
Pages carry ZERO navigation: the host owns Back/Next/Exit and progress. Each page is pure
content that talks to its host through a small postMessage contract (§4).

---

## 1 · What's in the repo

```
index.html        reference player. Shows exactly how to drive the pages: slot order,
                  iframing, theme relay, progress bar. NOT shipped to users.
shared/           theme CSS (sd_course_v3_theme.css + v3_addons.css), scoring.js (SDM),
                  interact.js (SDM2), app_bridge.js (SDMB · the integration contract, §4)
c01/  c02/  c03/  one folder per course: 13 pages each (s00 … s12), bank.js + bank.json
                  (assessment bank), stories_register.md (source citations), videos/
                  (poster jpgs only; the mp4s stream from GCS)
```

## 2 · Live page links

Player (reference implementation): https://nelle3549.github.io/b2c-courses/index.html

| Slot | Course 1 · Startup PH | Course 2 · Problem First | Course 3 · Value Crafted |
|---|---|---|---|
| s00 | [intro](https://nelle3549.github.io/b2c-courses/c01/s00_intro.html) | [intro](https://nelle3549.github.io/b2c-courses/c02/s00_intro.html) | [intro](https://nelle3549.github.io/b2c-courses/c03/s00_intro.html) |
| s01 | [section 1](https://nelle3549.github.io/b2c-courses/c01/s01_section_1.html) | [section 1](https://nelle3549.github.io/b2c-courses/c02/s01_section_1.html) | [section 1](https://nelle3549.github.io/b2c-courses/c03/s01_section_1.html) |
| s02 | [apply 1](https://nelle3549.github.io/b2c-courses/c01/s02_apply_1.html) | [apply 1](https://nelle3549.github.io/b2c-courses/c02/s02_apply_1.html) | [apply 1](https://nelle3549.github.io/b2c-courses/c03/s02_apply_1.html) |
| s03 | [section 2](https://nelle3549.github.io/b2c-courses/c01/s03_section_2.html) | [section 2](https://nelle3549.github.io/b2c-courses/c02/s03_section_2.html) | [section 2](https://nelle3549.github.io/b2c-courses/c03/s03_section_2.html) |
| s04 | [apply 2](https://nelle3549.github.io/b2c-courses/c01/s04_apply_2.html) | [apply 2](https://nelle3549.github.io/b2c-courses/c02/s04_apply_2.html) | [apply 2](https://nelle3549.github.io/b2c-courses/c03/s04_apply_2.html) |
| s05 | [section 3](https://nelle3549.github.io/b2c-courses/c01/s05_section_3.html) | [section 3](https://nelle3549.github.io/b2c-courses/c02/s05_section_3.html) | [section 3](https://nelle3549.github.io/b2c-courses/c03/s05_section_3.html) |
| s06 | [apply 3](https://nelle3549.github.io/b2c-courses/c01/s06_apply_3.html) | [apply 3](https://nelle3549.github.io/b2c-courses/c02/s06_apply_3.html) | [apply 3](https://nelle3549.github.io/b2c-courses/c03/s06_apply_3.html) |
| s07 | [section 4](https://nelle3549.github.io/b2c-courses/c01/s07_section_4.html) | [video](https://nelle3549.github.io/b2c-courses/c02/s07_video_explainer.html) | [video](https://nelle3549.github.io/b2c-courses/c03/s07_video_explainer.html) |
| s08 | [video](https://nelle3549.github.io/b2c-courses/c01/s08_video_explainer.html) | [section 4](https://nelle3549.github.io/b2c-courses/c02/s08_section_4.html) | [section 4](https://nelle3549.github.io/b2c-courses/c03/s08_section_4.html) |
| s09 | [apply 4](https://nelle3549.github.io/b2c-courses/c01/s09_apply_4.html) | [apply 4](https://nelle3549.github.io/b2c-courses/c02/s09_apply_4.html) | [apply 4](https://nelle3549.github.io/b2c-courses/c03/s09_apply_4.html) |
| s10 | [reality check](https://nelle3549.github.io/b2c-courses/c01/s10_reality_check.html) | [hypothesis card](https://nelle3549.github.io/b2c-courses/c02/s10_hypothesis_card.html) | [canvas](https://nelle3549.github.io/b2c-courses/c03/s10_canvas.html) |
| s11 | [myth](https://nelle3549.github.io/b2c-courses/c01/s11_myth_callout.html) | [myth](https://nelle3549.github.io/b2c-courses/c02/s11_myth_callout.html) | [myth](https://nelle3549.github.io/b2c-courses/c03/s11_myth_callout.html) |
| s12 | [assessment](https://nelle3549.github.io/b2c-courses/c01/s12_final_mcq.html) | [assessment](https://nelle3549.github.io/b2c-courses/c02/s12_final_mcq.html) | [assessment](https://nelle3549.github.io/b2c-courses/c03/s12_final_mcq.html) |

Serve pages in slot order (s00 → s12). Note the c01 s07/s08 swap above: its mid-lesson video
deliberately follows Section 4. The canonical order also lives in `index.html`'s `COURSES` map;
read it from there rather than hardcoding if you prefer.

Assessment banks (data files, if the app runs its own engine, §5):
[c01/bank.json](https://nelle3549.github.io/b2c-courses/c01/bank.json) ·
[c02/bank.json](https://nelle3549.github.io/b2c-courses/c02/bank.json) ·
[c03/bank.json](https://nelle3549.github.io/b2c-courses/c03/bank.json)

## 3 · Reference player

`index.html` demonstrates a working host: iframe + bottom bar (Exit · progress · Back/Next),
slot map, theme relay. Its `PAGES_BASE` constant is set to the live base, so it embeds the same
public pages the app will. One caveat while it runs cross-origin: its landing status/history
panels don't reflect in-course progress (storage splits by origin). The app should track
progress via bridge events (§4), not localStorage.

## 4 · Integration contract (`shared/app_bridge.js`)

Every course page loads the bridge and needs NO other wiring. Messages use
`postMessage(…, '*')`; validate `event.origin === 'https://nelle3549.github.io'` on your side.

**Page → app:**

| Message | When | Payload |
|---|---|---|
| `{type:'requestTheme'}` | page load | reply with `theme` |
| `{type:'visit', course, slot}` | page load | e.g. `{course:'c01', slot:'s03'}` |
| `{type:'fieldSaved', course, field, value}` | artifact field saved (debounced) | field ids `f1`–`f9` |
| `{type:'attemptSubmitted', course, attempt}` | assessment scored | full attempt: score, per-Bloom breakdown, item ids, timestamps |
| `{type:'printCard', course}` | learner taps Print | see print rules below |

**App → page:**

| Message | Effect |
|---|---|
| `{type:'theme', value:'light'\|'dark'}` | switches page theme instantly |
| `{type:'printHandled'}` | suppresses the page's `window.print()` fallback for that tap |

**Print rules:** on tap the page posts `printCard`, then falls back to `window.print()` after
300ms unless you reply `printHandled`. In a plain web host you may simply ignore `printCard`
(the fallback prints the compiled card; `.no-print` CSS strips everything else). In native
WebViews `window.print()` is a NO-OP, so you MUST intercept `printCard` and run native
print / your PDF API. If you sandbox the iframe, include `allow-modals` (plus `allow-scripts
allow-same-origin`, required for the pages to run at all).

**Minimal host handler:**

```js
const PAGES_ORIGIN = 'https://nelle3549.github.io';
window.addEventListener('message', (e) => {
  if (e.origin !== PAGES_ORIGIN) return;
  const m = e.data || {};
  if (m.type === 'requestTheme')     frame.contentWindow.postMessage({type:'theme', value: appTheme}, PAGES_ORIGIN);
  if (m.type === 'visit')            api.trackProgress(m.course, m.slot);
  if (m.type === 'fieldSaved')       api.saveField(m.course, m.field, m.value);
  if (m.type === 'attemptSubmitted') api.recordAttempt(m.course, m.attempt);
  if (m.type === 'printCard' && isWebView) {
    frame.contentWindow.postMessage({type:'printHandled'}, PAGES_ORIGIN);
    nativePrint(m.course);
  }
});
```

**Storage note:** pages also persist everything to their own localStorage (key
`sd_mini_courses_v2`), which keeps them fully usable offline-ish. Browsers partition
third-party iframe storage per top-level site and WebViews may clear it, so treat the bridge
events as the source of truth for accounts and sync values server-side.

## 5 · Assessments: two options

1. **Use our page (fastest):** iframe `s12_final_mcq.html`; it samples, renders, scores,
   explains, and posts `attemptSubmitted` up. Nothing to build.
2. **Use your engine:** consume `cXX/bank.json` (15 items: stem, 4 options, key, per-option
   explanations, bloom level, learning-objective tag). Reproduce the sampling contract:
   7 items per attempt = 1 remember + 2 understand + 2 apply + 1 analyze + 1 evaluate, with
   objectives lo1–lo4 each covered at least once (reference: `sampleBatch()` in
   `shared/scoring.js`). Show per-option explanations on review; retakes unlimited with a
   fresh sample.

Heads-up: the repo is public, so answer keys are public. Fine for this learning-first design
(unlimited retakes; the explanations ARE the product). If assessments ever become
credit-bearing, serve banks from the app API instead and drop them from the repo.

## 6 · Maintenance rules

- Videos stream from GCS (URLs hard-wired in the pages; tracked in Notion "SP B2C Video
  Tracker"). Never commit video files: `.gitignore` blocks them and GitHub rejects >100MB.
- Keep `.nojekyll`. Paths are case-sensitive on Pages; keep everything lowercase.
- Content standards live outside this repo (`sd_course_build_guide_v1.md`, ask Nelle). The
  three that protect learners: no em-dashes in learner-facing text, founder stories are real
  and cited (see each course's `stories_register.md`), and pages never gain their own navigation.
