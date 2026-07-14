# HANDOFF · SD B2C Mini-Courses → App Integration

**For:** app dev team · **Owner:** Nelle (Product & User Dev) · **Status:** repo-ready, awaiting deploy
**Last updated:** 2026-07-14 (live page links pending, see §4)

Three self-directed mini-courses as static HTML pages, designed to be iframed inside the app.
Pages carry ZERO navigation: the host owns Back/Next/Exit and progress. Each page is pure content
that talks to its host through a small postMessage contract (§6).

---

## 1 · The plan

- [ ] **Step 1:** Push this folder to the GitHub repo, enable GitHub Pages (§3)
- [ ] **Step 2:** Get the live links, fill in the tables in §4
- [ ] **Step 3:** Set `PAGES_BASE` in `index.html` to the live base URL so the reference player embeds the public pages (§5)
- [ ] **Step 4:** Commit the updated `index.html` + this HANDOFF with live links

## 2 · What's in the repo

```
index.html        reference player (dev preview). Shows exactly how to drive the pages:
                  slot order, iframing, theme relay, progress bar. NOT shipped to users.
shared/           theme CSS (sd_course_v3_theme.css + v3_addons.css), scoring.js (SDM),
                  interact.js (SDM2), app_bridge.js (SDMB · the integration contract, §6)
c01/  c02/  c03/  one folder per course: 13 pages each (s00_intro … s12_final_mcq),
                  bank.js + bank.json (assessment bank), stories_register.md (source
                  citations), videos/ (poster jpgs only; mp4s stream from GCS, §8)
```

Course slot order (identical for all three, one page per step):

| Slot | File | Role |
|---|---|---|
| s00 | `s00_intro.html` | Hero, intro video, objectives |
| s01/s03/s05 | `s0X_section_N.html` | Content sections 1–3 |
| s02/s04/s06 | `s0X_apply_N.html` | Exercises + artifact fields |
| s07* | `s07_…` | c02/c03: mid-lesson video · c01: Section 4 |
| s08* | `s08_…` | c02/c03: Section 4 · c01: mid-lesson video |
| s09 | `s09_apply_4.html` | Exercises + artifact field |
| s10 | `s10_*.html` | Artifact page (compiled card + Print) |
| s11 | `s11_myth_callout.html` | Myth callout (short) |
| s12 | `s12_final_mcq.html` | Final assessment (7 items sampled from 15) |

*c01 deliberately swaps s07/s08 (its video references the Section-4 map). Always read the
canonical order from the `COURSES` map in `index.html`, don't assume.

## 3 · Deploying to GitHub Pages

1. Repo root = this folder. Keep `.nojekyll` (folders would otherwise be processed by Jekyll).
2. Settings → Pages → deploy from `main` / root.
3. Paths are case-sensitive on Pages; everything here is lowercase, keep it that way.
4. Never commit `.mp4` files (GitHub hard-rejects >100MB; `.gitignore` already blocks them).

## 4 · Live page links (fill after deploy)

**Base URL:** `{BASE}` = `https://ORG.github.io/REPO/` ← *replace after Step 1*

| Course | Landing/player (dev preview) |
|---|---|
| All | `{BASE}index.html` |

| Slot | Course 1 · Startup PH | Course 2 · Problem First | Course 3 · Value Crafted |
|---|---|---|---|
| s00 | `{BASE}c01/s00_intro.html` | `{BASE}c02/s00_intro.html` | `{BASE}c03/s00_intro.html` |
| s01 | `{BASE}c01/s01_section_1.html` | `{BASE}c02/s01_section_1.html` | `{BASE}c03/s01_section_1.html` |
| s02 | `{BASE}c01/s02_apply_1.html` | `{BASE}c02/s02_apply_1.html` | `{BASE}c03/s02_apply_1.html` |
| s03 | `{BASE}c01/s03_section_2.html` | `{BASE}c02/s03_section_2.html` | `{BASE}c03/s03_section_2.html` |
| s04 | `{BASE}c01/s04_apply_2.html` | `{BASE}c02/s04_apply_2.html` | `{BASE}c03/s04_apply_2.html` |
| s05 | `{BASE}c01/s05_section_3.html` | `{BASE}c02/s05_section_3.html` | `{BASE}c03/s05_section_3.html` |
| s06 | `{BASE}c01/s06_apply_3.html` | `{BASE}c02/s06_apply_3.html` | `{BASE}c03/s06_apply_3.html` |
| s07 | `{BASE}c01/s07_section_4.html` | `{BASE}c02/s07_video_explainer.html` | `{BASE}c03/s07_video_explainer.html` |
| s08 | `{BASE}c01/s08_video_explainer.html` | `{BASE}c02/s08_section_4.html` | `{BASE}c03/s08_section_4.html` |
| s09 | `{BASE}c01/s09_apply_4.html` | `{BASE}c02/s09_apply_4.html` | `{BASE}c03/s09_apply_4.html` |
| s10 | `{BASE}c01/s10_reality_check.html` | `{BASE}c02/s10_hypothesis_card.html` | `{BASE}c03/s10_canvas.html` |
| s11 | `{BASE}c01/s11_myth_callout.html` | `{BASE}c02/s11_myth_callout.html` | `{BASE}c03/s11_myth_callout.html` |
| s12 | `{BASE}c01/s12_final_mcq.html` | `{BASE}c02/s12_final_mcq.html` | `{BASE}c03/s12_final_mcq.html` |

Assessment banks (data files, for the app's own assessment engine if preferred, §7):
`{BASE}c01/bank.json` · `{BASE}c02/bank.json` · `{BASE}c03/bank.json`

## 5 · The reference player (`index.html`)

`index.html` is the working example of a host: read its `COURSES` map for slot order and
labels, and its player section for the iframe + bottom-bar pattern. It has a `PAGES_BASE`
constant (top of the inline script): `''` for local preview; set it to `{BASE}` after deploy
so the same file demonstrates embedding the live public pages.

Caveat once `PAGES_BASE` is cross-origin: the landing's status/history panels stop reflecting
in-course progress, because pages then write localStorage on the Pages origin while the landing
reads its own. Expected; the app should track progress via bridge events (§6), not localStorage.

## 6 · Integration contract (`shared/app_bridge.js`)

Every course page loads the bridge and needs NO other wiring. Messages use
`postMessage(…, '*')`; validate `event.origin` against the Pages origin on your side.

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
print / your PDF API. If you sandbox the iframe, include `allow-modals` (and `allow-scripts
allow-same-origin`, required for the pages to run at all).

**Minimal host handler:**

```js
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
`sd_mini_courses_v2`), which keeps them fully offline-usable. Browsers partition third-party
iframe storage per top-level site and WebViews may clear it, so treat the bridge events as the
source of truth for accounts and sync the values server-side.

## 7 · Assessments: two options

1. **Use our page (fastest):** iframe `s12_final_mcq.html`; it samples, renders, scores,
   explains, and posts `attemptSubmitted` up. Nothing to build.
2. **Use your engine:** consume `cXX/bank.json` (15 items: stem, 4 options, key, per-option
   explanations, bloom level, learning-objective tag). You must reproduce the sampling
   contract: 7 items per attempt = 1 remember + 2 understand + 2 apply + 1 analyze +
   1 evaluate, with objectives lo1–lo4 each covered at least once (reference implementation:
   `sampleBatch()` in `shared/scoring.js`). Show the per-option explanation on review;
   retakes unlimited with a fresh sample.

Heads-up: a public repo makes the answer keys public. Fine for this learning-first design
(unlimited retakes, explanations ARE the product). If assessments ever become credit-bearing,
serve banks from the app API instead and drop them from the repo.

## 8 · Videos

The six mp4s stream from GCS (`https://storage.googleapis.com/startupreneurship/courses/b2c-courses/videos/…`),
already hard-wired into the pages with percent-encoded URLs. Poster jpgs are local. Source
links are tracked in Notion ("SP B2C Video Tracker"). Don't add video files to the repo.

## 9 · House rules for anyone touching content

Content standards live outside this repo (`sd_course_build_guide_v1.md`, ask Nelle). The three
that protect learners: no em-dashes anywhere in learner-facing text, founder stories are real
and cited (see each course's `stories_register.md`), and pages never gain their own navigation.
