// SD Mini-Courses · app bridge (SDMB)
// The contract between course pages (iframed) and the host app.
// Load AFTER scoring.js and interact.js.
//
// Outbound (page → app):
//   {type:'requestTheme'}                          sent by every page on load (existing)
//   {type:'visit',   course, slot}                 page opened
//   {type:'fieldSaved', course, field, value}      artifact field saved
//   {type:'attemptSubmitted', course, attempt}     assessment attempt scored (full attempt object)
//   {type:'printCard', course}                     learner tapped Print
//
// Inbound (app → page):
//   {type:'theme', value:'light'|'dark'}           handled by every page (existing)
//   {type:'printHandled'}                          app took over printing; suppresses the
//                                                  window.print() fallback for that tap
//
// Print behavior: standalone → window.print() directly. Embedded → post printCard first;
// if the app doesn't reply printHandled within 300ms, fall back to window.print()
// (a no-op in native WebViews, so the app MUST intercept printCard there).
(function () {
  'use strict';
  var embedded = window.parent !== window;

  function post(msg) {
    if (!embedded) return false;
    try { window.parent.postMessage(msg, '*'); return true; } catch (e) { return false; }
  }

  // ---- print ----
  var printAcked = false;
  window.addEventListener('message', function (e) {
    if (e.data && e.data.type === 'printHandled') printAcked = true;
  });
  function requestPrint(courseId) {
    if (!embedded) { window.print(); return; }
    printAcked = false;
    post({ type: 'printCard', course: courseId });
    setTimeout(function () {
      if (!printAcked) { try { window.print(); } catch (e) {} }
    }, 300);
  }

  // ---- event relay (no page code changes needed) ----
  if (window.SDM && typeof window.SDM.markVisit === 'function') {
    var origVisit = window.SDM.markVisit;
    window.SDM.markVisit = function (courseId, slot) {
      post({ type: 'visit', course: courseId, slot: slot });
      return origVisit.apply(this, arguments);
    };
  }
  if (window.SDM && typeof window.SDM.makeAttempt === 'function') {
    var origAttempt = window.SDM.makeAttempt;
    window.SDM.makeAttempt = function (courseId) {
      var attempt = origAttempt.apply(this, arguments);
      post({ type: 'attemptSubmitted', course: courseId, attempt: attempt });
      return attempt;
    };
  }
  document.addEventListener('sdm:fieldsaved', function (e) {
    var d = e.detail || {};
    var value = '';
    try { value = (window.SDM2 && window.SDM2.readField(d.courseId, d.fieldId)) || ''; } catch (err) {}
    post({ type: 'fieldSaved', course: d.courseId, field: d.fieldId, value: value });
  });

  window.SDMB = { post: post, requestPrint: requestPrint, embedded: embedded };
})();
