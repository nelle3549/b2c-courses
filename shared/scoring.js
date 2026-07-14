// SD Mini-Courses · shared scoring + sampling module
// Used by the final assessment page and index.html
// localStorage schema: see /sd_mini_courses_plan.md §7
(function () {
  'use strict';

  const STORAGE_KEY = 'sd_mini_courses_v2'; // v2 pilot: separate key so v1 data is untouched
  const COURSE_IDS = ['c01', 'c02', 'c03'];

  // ------- Storage helpers -------

  function readStore() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultStore();
      const parsed = JSON.parse(raw);
      // shallow validation
      if (!parsed.courses) return defaultStore();
      return parsed;
    } catch (e) {
      return defaultStore();
    }
  }

  function writeStore(store) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
      return true;
    } catch (e) {
      return false;
    }
  }

  function defaultStore() {
    const courses = {};
    COURSE_IDS.forEach(id => {
      courses[id] = { last_section: null, last_viewed: null, attempts: [], qc: {}, artifact: {}, plan: null };
    });
    return { courses, settings: { theme: 'light' } };
  }

  function resetStore() {
    writeStore(defaultStore());
  }

  function markVisit(courseId, sectionSlot) {
    const store = readStore();
    if (!store.courses[courseId]) return;
    store.courses[courseId].last_section = sectionSlot;
    store.courses[courseId].last_viewed = new Date().toISOString();
    writeStore(store);
  }

  // ------- Sampling -------

  // Bank items shape:
  // { id, bloom: 'remember'|'understand'|'apply'|'analyze'|'evaluate', lo: 'lo1'|'lo2'|'lo3'|'lo4'|null, stem, options:{A,B,C,D}, key:'A'|'B'|'C'|'D', explanation }

  const BATCH_SPEC = [
    { bloom: 'remember',   count: 1, mustCoverLO: null },
    { bloom: 'understand', count: 2, mustCoverLO: 'lo1' },
    { bloom: 'apply',      count: 2, mustCoverLO: 'lo2' },
    { bloom: 'analyze',    count: 1, mustCoverLO: 'lo3' },
    { bloom: 'evaluate',   count: 1, mustCoverLO: 'lo4' }
  ];

  function randomPick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function shuffle(arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function sampleBatch(bank) {
    const batch = [];
    for (const spec of BATCH_SPEC) {
      let pool = bank.filter(i => i.bloom === spec.bloom);
      const chosen = [];
      if (spec.mustCoverLO) {
        const loItems = pool.filter(i => i.lo === spec.mustCoverLO);
        if (loItems.length > 0) {
          const first = randomPick(loItems);
          chosen.push(first);
          pool = pool.filter(i => i.id !== first.id);
        }
      }
      while (chosen.length < spec.count && pool.length > 0) {
        const next = randomPick(pool);
        chosen.push(next);
        pool = pool.filter(i => i.id !== next.id);
      }
      batch.push(...chosen);
    }
    return shuffle(batch);
  }

  // ------- Scoring -------

  function scoreAttempt(batch, responses) {
    let correct = 0;
    const perBloom = {
      remember:   { n: 0, correct: 0 },
      understand: { n: 0, correct: 0 },
      apply:      { n: 0, correct: 0 },
      analyze:    { n: 0, correct: 0 },
      evaluate:   { n: 0, correct: 0 }
    };
    batch.forEach(item => {
      perBloom[item.bloom].n += 1;
      if (responses[item.id] === item.key) {
        correct += 1;
        perBloom[item.bloom].correct += 1;
      }
    });
    return {
      correct_count: correct,
      total: batch.length,
      score_pct: batch.length > 0 ? correct / batch.length : 0,
      per_bloom: perBloom
    };
  }

  function saveAttempt(courseId, attempt) {
    const store = readStore();
    if (!store.courses[courseId]) return false;
    store.courses[courseId].attempts.push(attempt);
    return writeStore(store);
  }

  function makeAttempt(courseId, batch, responses, startedAt) {
    const result = scoreAttempt(batch, responses);
    const attempt = {
      attempt_id: 'att_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
      started_at: startedAt,
      submitted_at: new Date().toISOString(),
      item_ids: batch.map(i => i.id),
      responses: responses,
      correct_count: result.correct_count,
      total: result.total,
      score_pct: result.score_pct,
      per_bloom: result.per_bloom
    };
    saveAttempt(courseId, attempt);
    return attempt;
  }

  // ------- Bank loader -------

  async function loadBank(url) {
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error('Failed to load bank: ' + res.status);
    return await res.json();
  }

  // ------- Theme (parity with Atelier lessons) -------

  function applyStoredTheme() {
    const store = readStore();
    const theme = (store.settings && store.settings.theme) || 'light';
    document.documentElement.setAttribute('data-theme', theme);
  }

  function setTheme(theme) {
    if (theme !== 'light' && theme !== 'dark') return;
    const store = readStore();
    store.settings = store.settings || {};
    store.settings.theme = theme;
    writeStore(store);
    document.documentElement.setAttribute('data-theme', theme);
  }

  // ------- Public API -------

  window.SDM = {
    STORAGE_KEY,
    COURSE_IDS,
    readStore,
    writeStore,
    resetStore,
    markVisit,
    sampleBatch,
    scoreAttempt,
    saveAttempt,
    makeAttempt,
    loadBank,
    applyStoredTheme,
    setTheme
  };
})();
