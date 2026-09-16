/* ==========================================================================
   Khalid Ounzar — Capabilities: four cards arriving
   --------------------------------------------------------------------------
   Reference: tympanus.net/Development/Unwoven — an infinite LEFTWARD drift in
   which cards travel along one horizontal axis and pass across one another.

   Two things carry over. The axis: every card comes from off the right edge
   and moves left. And the crossing: all four launch from the SAME point beyond
   the right edge and arrive right-to-left — 04 first, 01 last — so each card
   sweeps over the ones already in place. Giving every card its own equal
   offset, as the previous version did, makes them slide in parallel and cross
   nothing.

   The whole card is the moving object: background, border, shadow and content
   together. This file only measures the launch distance, sets each card's
   delay and stacking order, and fires the arrival. The motion is a CSS
   transition.
   ========================================================================== */

(function () {
  "use strict";

  var cards = Array.prototype.slice.call(document.querySelectorAll("[data-cap]"));
  var row = document.querySelector("[data-loom]");
  if (!cards.length || !row) return;

  if (document.documentElement.classList.contains("rm")) return;  /* CSS has it */

  var DUR = 1000;
  var STAGGER = 190;
  var small = matchMedia("(max-width: 620px)");

  /* Distance from each card's own slot out to a single launch point past the
     right edge. offsetLeft is a layout value, so it stays correct whatever
     transform the card happens to be carrying at the time. */
  function place() {
    var stacked = small.matches;
    var launch = row.offsetWidth + 70;
    cards.forEach(function (c, i) {
      /* stacked on a phone, every card shares one column and there is nothing
         to cross; there the throw is a shorter slide in reading order */
      var order = stacked ? i : (cards.length - 1 - i);
      if (stacked) c.style.removeProperty("--fx");
      else c.style.setProperty("--fx", (launch - c.offsetLeft) + "px");
      c.style.setProperty("--d", (order * STAGGER) + "ms");
      c.style.setProperty("--dur", DUR + "ms");
      /* whichever card is still travelling rides over the ones already down */
      c.style.setProperty("--z", String(order + 1));
    });
  }

  place();
  cards.forEach(function (c) { c.style.willChange = "transform, opacity"; });

  /* The reference plays on its own rather than following the scrollbar, so
     this does too. The trigger is the row's top crossing 78% of the viewport
     height — a bottom root margin rather than an area threshold, because on a
     phone the row is one tall column and an area ratio may never be reached. */
  var fired = false;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting || fired) return;
      fired = true;
      io.disconnect();
      /* The heading above is still assembling itself word by word. Two
         readings competing for the same moment is worse than either alone,
         so the row waits for the heading to say it has settled. */
      whenHeadingSettled(launch);
    });
  }, { rootMargin: "0px 0px -22% 0px", threshold: 0 });

  function whenHeadingSettled(go) {
    if (window.__seqDone) return go();
    var done = false;
    var run = function () { if (done) return; done = true; go(); };
    document.addEventListener("seq:done", run, { once: true });
    /* If the heading never reports — no such heading on the page, or it was
       already past when the script loaded — the row still arrives. */
    setTimeout(run, 1600);
  }

  function launch() {
    cards.forEach(function (c) { c.classList.add("is-in"); });
    /* Hover only takes over once every card has landed. A shorter transition
       declared any earlier becomes the one the arrival itself uses, and
       silently discards its per-card delay — which is exactly what made all
       four cards move as one in the previous version. */
    setTimeout(function () {
      cards.forEach(function (c) {
        c.style.willChange = "auto";
        c.classList.add("is-done");
      });
    }, DUR + STAGGER * (cards.length - 1) + 150);
  }

  io.observe(row);

  /* Re-measure on a width change: the launch distance comes from layout, and a
     column that changed width would throw the card the wrong distance. */
  var lastW = innerWidth;
  addEventListener("resize", function () {
    if (innerWidth === lastW || fired) return;
    lastW = innerWidth;
    place();
  }, { passive: true });
})();
