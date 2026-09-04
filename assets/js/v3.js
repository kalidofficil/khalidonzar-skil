/* ==========================================================================
   Khalid Ounzar — Version 3
   One master film, scrubbed by scroll; then the work.

   There is exactly one <video>. It is never unmounted, never replaced, and
   never divided. Scroll progress maps linearly onto the whole master; a single
   requestAnimationFrame loop smooths the displayed time toward that target and
   converges exactly when scrolling stops. The two speaking moments suspend
   scrubbing and play at rate 1 instead.

   One scroll source of truth: window.scrollY. No Lenis, no ScrollTrigger, so
   nothing can disagree about progress.
   ========================================================================== */
(function () {
  "use strict";

  var CONTACT_EMAIL = "ounzar.khalid1999@gmail.com";

  document.documentElement.classList.add("js");
  var reduce = matchMedia("(prefers-reduced-motion: reduce)");
  var small  = matchMedia("(max-width: 900px)");
  var RM = reduce.matches;
  if (RM) document.documentElement.classList.add("rm");

  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var lerp  = function (a, b, t) { return a + (b - a) * t; };

  /* ── the film ─────────────────────────────────────────────────────────
     Three states, one video element, one loop.

       gate    the opening card is opaque; the film is preloading behind it
       intro   the spoken introduction plays once at rate 1, with sound
       scroll  scroll drives the playhead over the SILENT range only

     Timestamps were read off the master frame by frame, not guessed:
       REVEAL   0.867 s (frame 26) — the first composed frame after the
                wide-open-mouth stretch that runs frames 6-23
       INTRO_END 4.880 s — where the voice stops and the shot cuts
     Scroll therefore owns 4.880 s -> the final frame, and can never reach
     the speech however far it is reversed.
     ------------------------------------------------------------------ */
  var film  = document.querySelector("[data-film]");
  var stage = film && film.querySelector(".stage");
  var reel  = document.getElementById("reel");

  if (film && reel) (function () {

    var REVEAL    = 0.867;
    var INTRO_END = 4.880;
    var TAIL      = 0.02;          /* stop a hair short of duration */

    var LABELS = [
      { t: 4.88, s: "Introduction"  }, { t: 9.5,  s: "Strategy" },
      { t: 12.1, s: "Execution"     }, { t: 16.5, s: "Collaboration" },
      { t: 26.0, s: "Contact"       }
    ];
    var FOCUS = [
      { t: 0.0,  y: 33 }, { t: 5.0,  y: 40 }, { t: 9.0,  y: 46 },
      { t: 10.5, y: 38 }, { t: 13.0, y: 48 }, { t: 17.5, y: 46 },
      { t: 23.5, y: 34 }, { t: 27.0, y: 30 }, { t: 30.8, y: 46 },
      { t: 33.6, y: 48 }
    ];

    var SMOOTH = small.matches ? 0.22 : 0.15;
    var SNAP   = 1 / 30;
    var SEEK   = 1 / 30;

    var gate   = document.getElementById("gate");
    var unlock = document.getElementById("unlock");
    var loadEl = document.getElementById("gateLoad");
    var veil   = film.querySelector(".veil");
    var tagName= film.querySelector(".scene-tag .name");
    var cue    = document.getElementById("cue");
    var closing= film.querySelector(".closing");
    var capBox = film.querySelector(".caption");

    var phase = "gate";            /* gate | intro | scroll */
    var duration = 0, shown = INTRO_END;
    var audioUnlocked = false, capOff = false, visible = false;
    var scrollLocked = false, lockY = 0;

    /* The page must not move until the introduction has had its turn.
       overflow:hidden stops the wheel and touch, but not programmatic
       scrollTo, anchor jumps or the keyboard — so a guard re-pins the
       scroll position for anything that gets past it. */
    function lockScroll(on) {
      if (on === scrollLocked) return;
      scrollLocked = on;
      if (on) { lockY = scrollY; document.body.style.overflow = "hidden"; }
      else    { document.body.style.overflow = ""; }
    }
    addEventListener("scroll", function () {
      if (scrollLocked && Math.abs(scrollY - lockY) > 1) scrollTo(0, lockY);
    }, { passive: true });
    addEventListener("wheel",     function (e) { if (scrollLocked) e.preventDefault(); }, { passive: false });
    addEventListener("touchmove", function (e) { if (scrollLocked) e.preventDefault(); }, { passive: false });
    addEventListener("keydown",   function (e) {
      if (!scrollLocked) return;
      if (/^(Arrow(Up|Down)|Page(Up|Down)|Home|End| )$/.test(e.key) &&
          !/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) e.preventDefault();
    });
    if (!RM) lockScroll(true);

    reel.addEventListener("loadedmetadata", function () { duration = reel.duration || 0; });

    /* With <source> children the element does not fire `error` itself. */
    var failed = false;
    function markFailed() {
      if (failed) return;
      failed = true;
      if (stage) stage.classList.add("failed");
      if (gate) { gate.classList.add("gone"); }
      lockScroll(false);
    }
    reel.addEventListener("error", markFailed);
    /* With <source> children the element does not fire `error` itself, and the
       children's own error events are not dependable once the browser has
       already given up on the whole list — so watch networkState instead.
       NETWORK_NO_SOURCE (3) means every candidate has been tried and failed. */
    (function watchSources(waited) {
      if (failed || reel.readyState > 0) return;
      if (reel.networkState === 3) return markFailed();
      if (waited >= 14000) return markFailed();
      setTimeout(function () { watchSources(waited + 300); }, 300);
    })(0);

    /* ── gate ─────────────────────────────────────────────────────────── */
    function ready() {
      /* enough of the opening to play through the reveal without stalling */
      if (reel.readyState >= 3) return true;
      for (var i = 0; i < reel.buffered.length; i++) {
        if (reel.buffered.start(i) <= 0.05 && reel.buffered.end(i) >= REVEAL + 1.6) return true;
      }
      return false;
    }
    function pollReady() {
      if (!unlock || !unlock.disabled) return;
      if (ready()) {
        unlock.disabled = false;
        if (loadEl) loadEl.hidden = true;
      } else setTimeout(pollReady, 220);
    }
    ["loadeddata", "canplay", "canplaythrough", "progress"].forEach(function (e) {
      reel.addEventListener(e, pollReady);
    });
    setTimeout(pollReady, 300);

    function startIntro() {
      if (phase !== "gate") return;
      phase = "intro";
      audioUnlocked = true;
      reel.muted = false;
      reel.playbackRate = 1;
      try { reel.currentTime = 0; } catch (e) {}
      var pr = reel.play();
      if (pr && pr.catch) pr.catch(function () {
        reel.muted = true;
        var b = film.querySelector('[data-act="sound"]'); if (b) b.hidden = false;
        var again = reel.play(); if (again && again.catch) again.catch(function () { finishIntro(); });
      });
      syncCtl();
      /* the gate stays opaque until a frame worth showing arrives */
      var watch = setInterval(function () {
        if (reel.currentTime >= REVEAL || reel.ended) {
          clearInterval(watch);
          if (gate) {
            gate.classList.add("lifting");
            setTimeout(function () { gate.classList.add("gone"); }, 820);
          }
        }
      }, 40);
    }
    if (unlock) unlock.addEventListener("click", startIntro);

    function finishIntro() {
      if (phase !== "intro") return;
      phase = "scroll";
      if (!reel.paused) reel.pause();
      reel.muted = true;
      shown = INTRO_END;
      try { reel.currentTime = INTRO_END; } catch (e) {}
      if (capBox) capBox.textContent = "";
      lockScroll(false);
      setCue(RM ? "Scroll on to the work." : "Scroll to enter the experience");
      syncCtl();
    }
    reel.addEventListener("timeupdate", function () {
      if (phase !== "intro") return;
      paintCue(reel.currentTime);
      if (reel.currentTime >= INTRO_END) finishIntro();
    });
    reel.addEventListener("ended", function () { if (phase === "intro") finishIntro(); });

    function setCue(text) {
      if (!cue) return;
      if (cue.textContent !== text) cue.textContent = text;
      cue.classList.toggle("on", !!text);
    }

    /* ── captions ─────────────────────────────────────────────────────── */
    var cues = [];
    (function () {
      var tt = reel.textTracks && reel.textTracks[0];
      if (!tt) return;
      tt.mode = "hidden";
      var grab = function () { if (tt.cues) cues = Array.prototype.slice.call(tt.cues); };
      reel.addEventListener("loadeddata", grab);
      setTimeout(grab, 600); setTimeout(grab, 1800);
    })();
    function paintCue(t) {
      if (!capBox) return;
      if (capOff || (phase !== "intro" && !RM)) { if (capBox.textContent) capBox.textContent = ""; return; }
      var out = "";
      for (var i = 0; i < cues.length; i++)
        if (t >= cues[i].startTime && t <= cues[i].endTime) { out = cues[i].text; break; }
      if (capBox.textContent !== out) capBox.textContent = out;
    }

    /* ── the few controls that remain ─────────────────────────────────── */
    function syncCtl() {
      var box = film.querySelector(".stage-ctl"); if (!box) return;
      var pl = box.querySelector('[data-act="play"]');
      var pa = box.querySelector('[data-act="pause"]');
      var rp = box.querySelector('[data-act="replay"]');
      var inIntro = phase === "intro" || RM;
      if (pa) pa.hidden = !inIntro || reel.paused;
      if (pl) pl.hidden = !inIntro || !reel.paused;
      if (rp) rp.hidden = phase === "gate" && !RM;
    }
    reel.addEventListener("play", syncCtl);
    reel.addEventListener("pause", syncCtl);

    document.addEventListener("click", function (e) {
      var b = e.target.closest("[data-act]"); if (!b) return;
      var a = b.dataset.act;
      if (a === "play")        {
        if (phase === "gate") { startIntro(); }
        else { reel.playbackRate = 1; reel.play(); }
      }
      else if (a === "pause")  reel.pause();
      else if (a === "replay") {
        phase = "intro"; setCue("");
        reel.muted = !audioUnlocked; reel.playbackRate = 1;
        try { reel.currentTime = 0; } catch (err) {}
        if (!RM) {
          /* back to the top of the film first, then pin it there */
          scrollTo({ top: film.getBoundingClientRect().top + scrollY, behavior: "instant" });
          lockScroll(true);
        }
        reel.play(); syncCtl();
      }
      else if (a === "sound")  { reel.muted = false; audioUnlocked = true; b.hidden = true;
                                 if (reel.paused && phase === "intro") reel.play(); }
      else if (a === "captions"){ capOff = !capOff; b.setAttribute("aria-pressed", String(!capOff));
                                  if (capOff && capBox) capBox.textContent = ""; }
    });
    addEventListener("keydown", function (e) {
      if (e.key === "Escape" && scrollLocked) { lockScroll(false); setCue("Scroll to enter the experience"); }
    });

    /* ── helpers ──────────────────────────────────────────────────────── */
    function pickFocus(t) {
      for (var i = 0; i < FOCUS.length - 1; i++)
        if (t >= FOCUS[i].t && t <= FOCUS[i + 1].t) {
          var k = (t - FOCUS[i].t) / (FOCUS[i + 1].t - FOCUS[i].t);
          return lerp(FOCUS[i].y, FOCUS[i + 1].y, k);
        }
      return t < FOCUS[0].t ? FOCUS[0].y : FOCUS[FOCUS.length - 1].y;
    }
    function pickLabel(t) {
      var out = LABELS[0];
      for (var i = 0; i < LABELS.length; i++) if (t >= LABELS[i].t) out = LABELS[i];
      return out;
    }
    function progress() {
      var r = film.getBoundingClientRect();
      var span = film.offsetHeight - innerHeight;
      if (span <= 0) return 0;
      return clamp(-r.top / span, 0, 1);
    }

    /* ── the single loop ──────────────────────────────────────────────── */
    function frame() {
      if (duration) {
        if (phase === "intro") {
          shown = reel.currentTime;
        } else if (phase === "scroll" && visible) {
          var lo = INTRO_END, hi = duration - TAIL;
          var p = progress();
          var target = lo + p * (hi - lo);          /* the silent range only */
          var d = target - shown;
          if (Math.abs(d) < SNAP) shown = target;   /* exact when scrolling stops */
          else shown += d * SMOOTH;
          shown = clamp(shown, lo, hi);
          /* One seek in flight at a time. Asking for a new frame while the
             decoder is still resolving the last one queues work it then
             throws away, which is what makes a scrub stall; letting each
             seek land keeps the picture moving. */
          var exact = p <= 0.0005 ? lo : (p >= 0.9995 ? hi : null);
          if (exact !== null) shown = exact;
          var want = exact !== null ? exact : shown;
          var tol  = exact !== null ? 0.004 : SEEK;
          if (reel.readyState >= 1 && !reel.seeking &&
              Math.abs(reel.currentTime - want) > tol) {
            try { reel.currentTime = want; } catch (e) { /* seek races are harmless */ }
          }
          if (!reel.paused) reel.pause();
          if (!reel.muted) reel.muted = true;

          if (p > 0.012) setCue("");
          var tail = clamp((shown - (hi - 3.1)) / 2.2, 0, 1);
          if (closing) closing.classList.toggle("on", tail > 0.45);
          film.style.setProperty("--hud", (1 - tail).toFixed(3));
        }

        reel.style.setProperty("--focus", pickFocus(shown).toFixed(2) + "%");
        var L = pickLabel(shown);
        if (tagName && tagName.textContent !== L.s) tagName.textContent = L.s;
      }
      requestAnimationFrame(frame);
    }

    if (!RM) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) { visible = e.isIntersecting; });
      }, { rootMargin: "-2% 0px -2% 0px" }).observe(film);
      requestAnimationFrame(frame);
    } else {
      /* reduced motion: a still hero, the introduction on request, no scrubbing */
      lockScroll(false);
      if (gate) gate.classList.add("gone");
      var rmPlay = film.querySelector('[data-act="play"]');
      if (rmPlay) rmPlay.hidden = false;
      if (closing) closing.classList.add("on");
      setCue("Press play for the introduction, or scroll to the work.");
      syncCtl();
    }

    /* skip must always leave the page usable */
    document.querySelectorAll("[data-skip]").forEach(function (b) {
      b.addEventListener("click", function () {
        if (!reel.paused) reel.pause();
        reel.muted = true;
        phase = "scroll";
        lockScroll(false);
        if (gate) gate.classList.add("gone");
        setCue("");
      });
    });
  })();

  /* ── skip ─────────────────────────────────────────────────────────────── */
  document.querySelectorAll("[data-skip]").forEach(function (b) {
    b.addEventListener("click", function () {
      if (reel && !reel.paused) reel.pause();
      var t = document.querySelector(b.dataset.skip || "#work");
      if (t) t.scrollIntoView({ behavior: RM ? "auto" : "smooth", block: "start" });
    });
  });

  /* ── card systems ─────────────────────────────────────────────────────── */
  if (!RM) (function () {
    var TILT   = small.matches ? 2 : 4;     /* degrees, grid cards */
    var STACK_RX = small.matches ? 2 : 6;   /* degrees, entering stack card */

    /* grid cards: rise, then sit perfectly flat while being read */
    var flat = Array.prototype.slice.call(document.querySelectorAll(".card,.step"));
    var liveFlat = [];
    var io1 = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var i = liveFlat.indexOf(e.target);
        if (e.isIntersecting && i < 0) liveFlat.push(e.target);
        if (!e.isIntersecting && i > -1) { liveFlat.splice(i, 1); e.target.style.transform = ""; }
      });
    }, { rootMargin: "14% 0px 14% 0px" });
    flat.forEach(function (c) { io1.observe(c); });

    /* stacked cards: rise from below, settle on top, the one beneath recedes */
    var cards = Array.prototype.slice.call(document.querySelectorAll(".stack-card"));
    var liveStack = [];
    var io2 = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var i = liveStack.indexOf(e.target);
        if (e.isIntersecting && i < 0) liveStack.push(e.target);
        if (!e.isIntersecting && i > -1) liveStack.splice(i, 1);
      });
    }, { rootMargin: "40% 0px 40% 0px" });
    cards.forEach(function (c) { io2.observe(c); });

    function tick() {
      var h = innerHeight, mid = h / 2;

      for (var i = 0; i < liveFlat.length; i++) {
        var el = liveFlat[i], r = el.getBoundingClientRect();
        var d = clamp(((r.top + r.height / 2) - mid) / (h / 2), -1, 1);
        var away = Math.abs(d) < 0.16 ? 0 : (Math.abs(d) - 0.16) / 0.84;
        var sign = d < 0 ? -1 : 1;
        var cx = (r.left + r.width / 2) / innerWidth - 0.5;
        el.style.transform = "rotateX(" + (-sign * away * TILT).toFixed(2) + "deg) rotateY(" +
          (cx * away * TILT * 0.6).toFixed(2) + "deg) translateZ(" + (-away * 14).toFixed(1) + "px)";
        el.style.setProperty("--sheen", (away * 0.85).toFixed(2));
      }

      for (var k = 0; k < liveStack.length; k++) {
        var c = liveStack[k], cr = c.getBoundingClientRect();
        var slot = c.parentElement;
        var sr = slot.getBoundingClientRect();

        /* entrance: 0 while the card is still below the fold, 1 once settled */
        var enter = clamp(1 - (cr.top - h * 0.11) / (h * 0.82), 0, 1);
        /* cover: how far the following slot has climbed over this one */
        var cover = clamp((h * 0.5 - sr.bottom) / (h * 0.62), 0, 1);

        var ty = (1 - enter) * 70;                       /* vh */
        var sc = lerp(0.92, 1, enter) * lerp(1, 0.96, cover);
        var rx = lerp(STACK_RX, 0, enter);
        var op = lerp(0.75, 1, enter);
        var tz = -cover * 46;
        var bl = (cover * 2).toFixed(2);
        var br = lerp(1, 0.74, cover);

        c.style.transform = "translate3d(0," + ty.toFixed(2) + "vh,0) scale(" + sc.toFixed(4) +
                            ") rotateX(" + rx.toFixed(2) + "deg) translateZ(" + tz.toFixed(1) + "px)";
        c.style.opacity = op.toFixed(3);
        c.style.filter = cover > 0.004 ? "blur(" + bl + "px) brightness(" + br.toFixed(3) + ")" : "";
        c.style.setProperty("--sheen", ((1 - enter) * 0.9).toFixed(2));
        c.style.zIndex = String(10 + k);
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  })();

  /* ── entrances, bars, nav ─────────────────────────────────────────────── */
  var riseIO = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); riseIO.unobserve(e.target); } });
  }, { rootMargin: "0px 0px -8%" });
  document.querySelectorAll(".rise").forEach(function (el) { riseIO.observe(el); });

  var barIO = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.querySelectorAll(".bar i").forEach(function (i) { i.style.width = i.dataset.w; });
      barIO.unobserve(e.target);
    });
  }, { rootMargin: "0px 0px -14%" });
  document.querySelectorAll(".gap").forEach(function (g) { barIO.observe(g); });

  var nav = document.querySelector(".nav");
  var links = Array.prototype.slice.call(document.querySelectorAll(".nav-links a[href^='#']"));
  var sections = Array.prototype.slice.call(document.querySelectorAll("main > section[id], main > div[id]"));
  function paintNav() {
    if (!sections.length) return;
    var line = 32, under = null;
    for (var i = 0; i < sections.length; i++) {
      var r = sections[i].getBoundingClientRect();
      if (r.top <= line && r.bottom > line) under = sections[i];
    }
    if (!under) return;
    if (nav) nav.classList.toggle("on-light", under.classList.contains("light"));
    for (var k = 0; k < links.length; k++) {
      if (links[k].getAttribute("href") === "#" + under.id) links[k].setAttribute("aria-current", "true");
      else links[k].removeAttribute("aria-current");
    }
  }
  addEventListener("scroll", paintNav, { passive: true });
  addEventListener("resize", paintNav);
  paintNav();

  /* ── contact ──────────────────────────────────────────────────────────── */
  var copy = document.querySelector("[data-copy]");
  if (copy) copy.addEventListener("click", function () {
    var done2 = function () {
      var old = copy.textContent; copy.textContent = "Copied";
      setTimeout(function () { copy.textContent = old; }, 1800);
    };
    if (navigator.clipboard) navigator.clipboard.writeText(CONTACT_EMAIL).then(done2, done2); else done2();
  });

  var form = document.getElementById("enquiry");
  if (form) form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!form.reportValidity()) return;
    var d = new FormData(form);
    var body = "Name: " + d.get("name") + "\n" + "Email: " + d.get("email") + "\n" +
               "Monthly ad spend: " + (d.get("budget") || "not given") + "\n\n" + d.get("message");
    location.href = "mailto:" + CONTACT_EMAIL +
      "?subject=" + encodeURIComponent("Portfolio enquiry — " + d.get("name")) +
      "&body=" + encodeURIComponent(body);
    var note = document.getElementById("formNote");
    note.className = "f-note ok";
    note.textContent = "Opening your email app with the message ready to send.";
  });
})();
