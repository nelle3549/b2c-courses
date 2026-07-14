# HANDOFF · SD B2C Mini-Courses → App Integration

**For:** app dev team · **Owner:** Nelle (Product & User Dev)
**Live base:** `https://nelle3549.github.io/b2c-courses/` · **Repo:** `github.com/nelle3549/b2c-courses`
**Last updated:** 2026-07-14 (viewer upgraded to a full LMS shell; assessments now render from `bank.json`)

Three self-directed mini-courses as static HTML pages, designed to be iframed inside the app.
Content pages carry ZERO navigation: the host owns Back/Next/Exit and progress. Each page talks
to its host through a small postMessage contract (§4).

---

## 1 · What's in the repo

```
index.html        the LMS viewer (also the reference implementation): sidebar outline with
                  per-step progress, scroll-gated Next button, native assessment engine fed
                  by bank.json, completion gating, theme toggle, mobile drawer layout.
shared/           theme CSS (sd_course_v3_theme.css + v3_addons.css), scoring.js (SDM:
                  storage, sampling, scoring), interact.js (SDM2), app_bridge.js (SDMB, §4)
c01/  c02/  c03/  one folder per course: 12 content pages (s00_intro … s11_myth_callout),
                  bank.json (assessment bank · single source of truth), bank.js (generated
                  file:// fallback shim of the same data; apps should use bank.json),
                  stories_register.md (source citations), videos/ (poster jpgs; mp4s on GCS)
```

There are no assessment pages: the final assessment is rendered by the host (the viewer does
this natively) from `cXX/bank.json`.

## 2 · Live page links

Viewer / LMS (reference implementation): https://nelle3549.github.io/b2c-courses/index.html

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
| s12 | final assessment: no page; render from [c01/bank.json](https://nelle3549.github.io/b2c-courses/c01/bank.json) | [c02/bank.json](https://nelle3549.github.io/b2c-courses/c02/bank.json) | [c03/bank.json](https://nelle3549.github.io/b2c-courses/c03/bank.json) |

Serve pages in slot order (s00 → s11, then the assessment). Note the c01 s07/s08 swap: its
mid-lesson video deliberately follows Section 4. The canonical order also lives in the
`COURSES` map in `index.html`.

## 3 · The viewer (`index.html`) and its LMS behaviors

The viewer is a complete reference host. Its behaviors define the intended learner experience;
replicate them in the app:

- **Outline sidebar** (drawer on mobile): all 13 steps with done/current/locked states and a
  progress bar. Steps unlock sequentially; a step counts as done once the learner has reached
  the bottom of its page at least once.
- **Scroll-gated Next:** while the current page hasn't been read to the bottom, the primary
  button reads "Scroll ↓" and scrolls the page; after bottom is reached once, it becomes
  "Next →". Short pages count as read immediately.
- **Final assessment** is native to the host: fetched from `cXX/bank.json`, gated until all 12
  content steps are read, required for course completion. "Finish" unlocks only after an
  attempt is submitted.
- **Theme toggle** available at all times (sidebar on desktop, top bar on mobile).

Implementation note: the reading gate is driven by the bridge's `scrollState` messages, so it
works for ANY host, including cross-origin iframes and native WebViews. Gate `Next` on
`scrollState.atBottom === true`, and wire your "Scroll ↓" button to post `scrollBy` back to
the page. The pages themselves enforce nothing; the host decides.

## 4 · Integration contract (`shared/app_bridge.js`)

Every content page loads the bridge and needs NO other wiring. Messages use
`postMessage(…, '*')`; validate `event.origin === 'https://nelle3549.github.io'` on your side.

**Page → app:**

| Message | When | Payload |
|---|---|---|
| `{type:'requestTheme'}` | page load | reply with `theme` |
| `{type:'visit', course, slot}` | page load | e.g. `{course:'c01', slot:'s03'}` |
| `{type:'scrollState', course, slot, atBottom}` | page load, scroll, resize (throttled) | `atBottom: true` once the learner reaches the end of the page; drives a scroll-gated Next button |
| `{type:'fieldSaved', course, field, value}` | artifact field saved (debounced) | field ids `f1`–`f9` |
| `{type:'attemptSubmitted', course, attempt}` | assessment scored | full attempt: score, per-Bloom breakdown, item ids, timestamps. Sent by the viewer too when the viewer itself is iframed. |
| `{type:'printCard', course}` | learner taps Print (s10 card pages) | see print rules below |

**App → page:**

| Message | Effect |
|---|---|
| `{type:'theme', value:'light'\|'dark'}` | switches page theme instantly |
| `{type:'scrollBy', amount?}` | scrolls the page down (host "Scroll ↓" button); defaults to ~85% of the viewport |
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
`sd_mini_courses_v2`). Browsers partition third-party iframe storage per top-level site and
WebViews may clear it, so treat the bridge events as the source of truth for accounts and sync
values server-side.

## 5 · Assessments (JSON contract)

`cXX/bank.json` is the single source of truth: 15 items, each with stem, 4 options, key,
per-option explanations, bloom level, and learning-objective tag. Two integration routes:

1. **Embed the viewer's assessment** by iframing `index.html` (it posts `attemptSubmitted`
   upward), or
2. **Run your own engine** against `bank.json`, reproducing the sampling contract: 7 items per
   attempt = 1 remember + 2 understand + 2 apply + 1 analyze + 1 evaluate, with objectives
   lo1–lo4 each covered at least once (reference: `sampleBatch()` in `shared/scoring.js`).
   Show per-option explanations on review; retakes unlimited with a fresh sample; completion
   of the course requires at least one submitted attempt.

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
