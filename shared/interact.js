// SD Mini-Courses · v2 pilot interaction engine (playbook v1.0)
// Requires scoring.js (window.SDM) loaded first.
// Provides: predict-reveal, classify rows, generate+compare, hotspot phrases,
// artifact fields (localStorage), plan prompt, quick-check recorder/renderer.
(function () {
  'use strict';

  function store() { return window.SDM.readStore(); }
  function save(s) { return window.SDM.writeStore(s); }

  function ensureCourse(s, courseId) {
    if (!s.courses[courseId]) s.courses[courseId] = { last_section: null, last_viewed: null, attempts: [] };
    const c = s.courses[courseId];
    if (!c.qc) c.qc = {};
    if (!c.artifact) c.artifact = {};
    if (!c.plan) c.plan = null;
    return c;
  }

  // ---------- Artifact fields ----------

  function saveField(courseId, fieldId, value) {
    const s = store();
    const c = ensureCourse(s, courseId);
    c.artifact[fieldId] = { value: value, updated: new Date().toISOString() };
    save(s);
  }

  function readField(courseId, fieldId) {
    const s = store();
    const c = ensureCourse(s, courseId);
    return (c.artifact[fieldId] && c.artifact[fieldId].value) || '';
  }

  function readAllFields(courseId) {
    const s = store();
    const c = ensureCourse(s, courseId);
    const out = {};
    Object.keys(c.artifact).forEach(k => { out[k] = c.artifact[k].value; });
    return out;
  }

  function initArtifactFields(root) {
    (root || document).querySelectorAll('.af-input[data-af]').forEach(el => {
      const ref = el.getAttribute('data-af').split('.'); // "c02.f1"
      const courseId = ref[0], fieldId = ref[1];
      el.value = readField(courseId, fieldId);
      let t = null;
      const savedTag = el.closest('.af-block, .phc-field');
      const tag = savedTag ? savedTag.querySelector('.af-saved') : null;
      el.addEventListener('input', () => {
        clearTimeout(t);
        t = setTimeout(() => {
          saveField(courseId, fieldId, el.value.trim());
          if (tag) { tag.classList.add('show'); setTimeout(() => tag.classList.remove('show'), 1500); }
          document.dispatchEvent(new CustomEvent('sdm:fieldsaved', { detail: { courseId, fieldId } }));
        }, 400);
      });
    });
  }

  // ---------- Field echoes (read-only guidance pulled from earlier fields) ----------

  function renderEcho(el) {
    const ref = el.getAttribute('data-af-echo').split('.'); // "c03.f3"
    const label = el.getAttribute('data-echo-label') || '';
    const val = readField(ref[0], ref[1]);
    const escd = v => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    el.innerHTML = '<p class="af-echo-label">' + escd(label) + '</p>' +
      (val
        ? '<div class="af-echo-lines">' + escd(val) + '</div>'
        : '<div class="af-echo-lines af-echo-empty">Nothing here yet. Fill it on the earlier page and it will appear.</div>');
  }

  function initEchoes(root) {
    const els = (root || document).querySelectorAll('[data-af-echo]');
    els.forEach(renderEcho);
    if (els.length) document.addEventListener('sdm:fieldsaved', () => els.forEach(renderEcho));
  }

  // ---------- Multi-answer fields (one input per item, stored as numbered lines) ----------

  function initMultiFields(root) {
    (root || document).querySelectorAll('[data-af-multi]').forEach(box => {
      const ref = box.getAttribute('data-af-multi').split('.'); // "c02.f2"
      const courseId = ref[0], fieldId = ref[1];
      const inputs = Array.from(box.querySelectorAll('.af-input'));
      if (!inputs.length) return;
      const holder = box.closest('.af-block, .phc-field') || box.parentElement;
      const tag = holder ? holder.querySelector('.af-saved') : null;
      const stored = readField(courseId, fieldId);
      if (stored) {
        const lines = stored.split('\n');
        const numbered = lines.some(l => /^\s*\d+[.)]\s/.test(l));
        if (numbered) {
          // restore each answer to its original slot, even with gaps
          lines.forEach(l => {
            const m = l.match(/^\s*(\d+)[.)]\s*(.*)$/);
            if (m) {
              const i = parseInt(m[1], 10) - 1;
              if (inputs[i]) inputs[i].value = m[2].trim();
            }
          });
        } else {
          // legacy freeform data from the old single textarea
          inputs.forEach((el, i) => { el.value = (lines[i] || '').trim(); });
        }
      }
      let t = null;
      const save = () => {
        const joined = inputs
          .map(el => el.value.trim())
          .map((v, i) => v ? (i + 1) + '. ' + v : '')
          .filter(Boolean).join('\n');
        saveField(courseId, fieldId, joined);
        if (tag) { tag.classList.add('show'); setTimeout(() => tag.classList.remove('show'), 1500); }
        document.dispatchEvent(new CustomEvent('sdm:fieldsaved', { detail: { courseId, fieldId } }));
      };
      inputs.forEach(el => el.addEventListener('input', () => { clearTimeout(t); t = setTimeout(save, 400); }));
    });
  }

  // ---------- Plan prompt ----------

  function initPlanPrompt(root) {
    (root || document).querySelectorAll('.plan-block[data-course]').forEach(block => {
      const courseId = block.getAttribute('data-course');
      const opts = block.querySelectorAll('.plan-opt');
      const s = store(); const c = ensureCourse(s, courseId);
      if (c.plan) {
        block.classList.add('done');
        opts.forEach(o => { if (o.getAttribute('data-plan') === c.plan) o.classList.add('picked'); });
      }
      opts.forEach(o => {
        o.addEventListener('click', () => {
          const s2 = store(); const c2 = ensureCourse(s2, courseId);
          c2.plan = o.getAttribute('data-plan');
          save(s2);
          opts.forEach(x => x.classList.remove('picked'));
          o.classList.add('picked');
          block.classList.add('done');
        });
      });
    });
  }

  // ---------- Predict-then-reveal ----------

  function initPredict(root) {
    (root || document).querySelectorAll('.pv-block').forEach(block => {
      const opts = block.querySelectorAll('.pv-opt');
      opts.forEach(o => {
        o.addEventListener('click', () => {
          if (block.classList.contains('done')) return;
          o.classList.add('picked');
          block.classList.add('done');
          opts.forEach(x => {
            x.disabled = true;
            if (x.hasAttribute('data-good')) x.classList.add('is-good', 'revealed');
          });
        });
      });
    });
  }

  // ---------- Classify rows ----------

  function initClassify(root) {
    (root || document).querySelectorAll('.cl-row').forEach(row => {
      const answer = row.getAttribute('data-answer');
      row.querySelectorAll('.cl-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (row.classList.contains('answered')) return;
          // dual-class: 'hit/miss/answered' feed the v2 stylesheet,
          // 'correct/incorrect/revealed' feed theme v3; both stay in sync
          row.classList.add('answered', 'revealed');
          const val = btn.getAttribute('data-val');
          if (val === answer) {
            btn.classList.add('hit', 'correct');
          } else {
            btn.classList.add('miss', 'incorrect');
            row.querySelectorAll('.cl-btn').forEach(b => {
              if (b.getAttribute('data-val') === answer) b.classList.add('hit', 'correct');
            });
          }
        });
      });
    });
  }

  // ---------- Generate + compare ----------

  function initGenerate(root) {
    (root || document).querySelectorAll('.gen-block').forEach(block => {
      const input = block.querySelector('.gen-input');
      const btn = block.querySelector('.gen-btn');
      if (!input || !btn) return;
      const gate = () => { btn.disabled = input.value.trim().length < 8; };
      gate();
      input.addEventListener('input', gate);
      btn.addEventListener('click', () => { block.classList.add('done'); btn.disabled = true; });
    });
  }

  // ---------- Hotspot phrases ----------

  function initHotspots(root) {
    (root || document).querySelectorAll('.hs-wrap').forEach(wrap => {
      const flaws = wrap.querySelectorAll('.hs-phrase[data-flaw]');
      const status = wrap.querySelector('.hs-status');
      let found = 0;
      const update = () => {
        if (status) status.textContent = found + ' of ' + flaws.length + ' found' + (found === flaws.length ? ': nice. All three would have bent your data.' : '');
      };
      update();
      wrap.querySelectorAll('.hs-phrase').forEach(ph => {
        ph.addEventListener('click', () => {
          if (ph.classList.contains('found') || ph.classList.contains('clean-hit')) return;
          const note = ph.parentElement.querySelector('.hs-note[data-for="' + ph.getAttribute('data-id') + '"]');
          if (ph.hasAttribute('data-flaw')) {
            ph.classList.add('found');
            found += 1;
          } else {
            ph.classList.add('clean-hit');
          }
          if (note) note.classList.add('show');
          update();
        });
      });
    });
  }

  // ---------- Quick-check render + record ----------

  function recordQC(courseId, qcId, picked, correct) {
    const s = store();
    const c = ensureCourse(s, courseId);
    c.qc[qcId] = { picked: picked, correct: correct, at: new Date().toISOString() };
    save(s);
  }

  function getMissedQC(courseId) {
    const s = store();
    const c = ensureCourse(s, courseId);
    return Object.keys(c.qc).filter(k => c.qc[k] && c.qc[k].correct === false);
  }

  // Renders an MCQ item with per-option explanations into `container`.
  // item: { id, stem, options:{A..D}, key, explanations:{A..D}, encouragement? }
  // opts: { record: bool, courseId, meta: string }
  function renderQC(container, item, opts) {
    opts = opts || {};
    const card = document.createElement('article');
    card.className = 'mcq-card';
    const letters = ['A', 'B', 'C', 'D'];
    card.innerHTML =
      '<div class="mcq-meta"><span>' + (opts.meta || 'Quick check · formative · not scored') + '</span></div>' +
      '<p class="mcq-stem">' + item.stem + '</p>' +
      '<ul class="mcq-options" role="radiogroup">' +
      letters.map(L =>
        '<li><button class="mcq-option" data-letter="' + L + '">' +
        '<span class="mcq-letter">' + L + '</span><span>' + item.options[L] + '</span></button></li>'
      ).join('') +
      '</ul>' +
      '<div class="mcq-feedback" aria-live="polite"></div>';
    container.appendChild(card);

    const fb = card.querySelector('.mcq-feedback');
    const opts_ = card.querySelectorAll('.mcq-option');
    opts_.forEach(btn => {
      btn.addEventListener('click', () => {
        if (card.dataset.answered) return;
        card.dataset.answered = '1';
        const picked = btn.getAttribute('data-letter');
        const correct = picked === item.key;
        btn.classList.add(correct ? 'correct' : 'incorrect');
        if (!correct) {
          opts_.forEach(x => { if (x.getAttribute('data-letter') === item.key) x.classList.add('correct'); });
        }
        let html = '';
        if (correct) {
          html += '<strong>Correct: ' + item.key + '.</strong> ' + (item.explanations[item.key] || '');
        } else {
          html += '<strong>' + (item.encouragement || 'Good miss: this distractor is the popular one.') + '</strong><br/>' +
                  '<strong>You picked ' + picked + ':</strong> ' + (item.explanations[picked] || '') + '<br/>' +
                  '<strong>The key is ' + item.key + ':</strong> ' + (item.explanations[item.key] || '');
        }
        fb.innerHTML = html;
        fb.classList.add('show');
        if (opts.record && opts.courseId) recordQC(opts.courseId, item.id, picked, correct);
        if (typeof opts.onAnswer === 'function') opts.onAnswer(correct, picked);
      });
    });
    return card;
  }


  // ---------- init ----------

  function initAll(root) {
    initArtifactFields(root);
    initMultiFields(root);
    initEchoes(root);
    initPlanPrompt(root);
    initPredict(root);
    initClassify(root);
    initGenerate(root);
    initHotspots(root);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initAll(document));
  } else {
    initAll(document);
  }

  window.SDM2 = {
    saveField, readField, readAllFields,
    recordQC, getMissedQC, renderQC,
    initAll
  };
})();
