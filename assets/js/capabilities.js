/* ==========================================================================
   Khalid Ounzar — Capabilities: the loom, run forwards
   --------------------------------------------------------------------------
   Reference: tympanus.net/Development/Unwoven (three.js / webgl / marquee).
   There, an infinite leftward marquee unravels each card into ~50 horizontal
   threads as it leaves the centre — no entrance, no rotation, no depth, no
   final placement, and the picture is destroyed in the process.

   Here the same mechanism runs the other way: threads start displaced along
   the one horizontal axis and knit together as the card arrives, then lock.
   Cards weave one after another, left to right.

   No library, no second animation loop. The threads are built once, the
   entrance is a CSS transition fired by the same IntersectionObserver pattern
   the rest of the site already uses for .rise.
   ========================================================================== */

(function () {
  "use strict";

  var cards = Array.prototype.slice.call(document.querySelectorAll("[data-cap]"));
  if (!cards.length) return;

  var RM = document.documentElement.classList.contains("rm");
  var small = matchMedia("(max-width: 620px)");

  /* Read off the reference: the fray reads as roughly fifty threads across a
     560px card, so a little under 2% of the card's height each. Fewer on a
     phone, where the card is shorter and the throw is smaller. */
  var STRIPS = small.matches ? 16 : 26;
  var THROW  = small.matches ? 90 : 190;   /* px the furthest thread starts out */
  var DUR    = 900;                        /* per-card weave */
  var STAGGER = 140;                       /* cards arrive one after another */

  /* Deterministic jitter: the reference's threads reach visibly different
     distances, but a random() would make the four cards disagree between
     reloads and make the effect impossible to judge. */
  function jitter(i, seed) {
    var x = Math.sin((i + 1) * 12.9898 + seed * 78.233) * 43758.5453;
    return x - Math.floor(x);
  }

  function build(card, index) {
    var weave = card.querySelector(".cap-weave");
    if (!weave) return;
    weave.textContent = "";

    var frag = document.createDocumentFragment();
    for (var i = 0; i < STRIPS; i++) {
      var s = document.createElement("i");
      var top = (i / STRIPS) * 100;
      var h = (1 / STRIPS) * 100;
      s.style.top = top.toFixed(4) + "%";
      /* a hair of overlap, so no hairline gap shows between threads once the
         card has settled */
      s.style.height = (h + 0.35).toFixed(4) + "%";

      var r = jitter(i, index);
      /* every thread travels the same way — the reference has one axis — but
         a long way apart, which is what makes it read as fabric */
      s.style.setProperty("--tx0", (THROW * (0.28 + r * 0.72)).toFixed(1) + "px");
      s.style.setProperty("--o0", (0.38 + r * 0.34).toFixed(2));
      /* the threads nearest the top and bottom edges arrive last, so the card
         knits from its middle outward rather than as a block */
      var edge = Math.abs(i - (STRIPS - 1) / 2) / ((STRIPS - 1) / 2);
      s.style.setProperty("--d", Math.round(index * STAGGER + edge * 150 + r * 90) + "ms");
      s.style.setProperty("--dur", DUR + "ms");
      frag.appendChild(s);
    }
    weave.appendChild(frag);

    card.style.setProperty("--d", (index * STAGGER) + "ms");
    card.style.setProperty("--dur", DUR + "ms");
  }

  function buildAll() { cards.forEach(build); }

  if (RM) {
    /* nothing to weave: the CSS has already put every card in its settled
       state, and building threads would only add nodes for no reason */
    return;
  }

  buildAll();

  /* Fires automatically when the row enters the viewport — the reference plays
     on its own rather than following the scrollbar, so this does too. Observing
     the row (not each card) is what keeps the four in one sequence instead of
     four independent entrances. */
  var row = document.querySelector("[data-loom]");
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      cards.forEach(function (c) { c.classList.add("is-woven"); });
      io.disconnect();
      /* The threads stay — they are the card's fill, not an overlay, so
         removing them would leave a transparent card. What does get dropped is
         `will-change`, which otherwise keeps 104 layers promoted on the
         compositor for the rest of the session. */
      setTimeout(function () {
        cards.forEach(function (c) { c.classList.add("is-settled"); });
      }, DUR + STAGGER * cards.length + 400);
    });
  }, { rootMargin: "0px 0px -12%" });

  if (row) io.observe(row); else cards.forEach(function (c) { io.observe(c); });

  /* Rebuild only when the breakpoint actually changes — the strip count and
     throw differ either side of it, and rebuilding on every resize tick would
     thrash the DOM for no visible gain. */
  var wasSmall = small.matches;
  addEventListener("resize", function () {
    if (small.matches === wasSmall) return;
    wasSmall = small.matches;
    STRIPS = small.matches ? 16 : 26;
    THROW  = small.matches ? 90 : 190;
    if (cards[0] && cards[0].classList.contains("is-woven")) return;  /* already knitted */
    buildAll();
  }, { passive: true });
})();
