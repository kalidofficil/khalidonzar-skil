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

  /* ── the film ─────────────────────────────────────────────────────────── */
  var film  = document.querySelector("[data-film]");
  var stage = film && film.querySelector(".stage");
  var reel  = document.getElementById("reel");

  if (film && reel) (function () {

    /* Speaking windows, measured off the master's own audio envelope.
       These are master timestamps, not clip offsets. */
    var SPEECH = [
      { id: "intro",   from: 0.25,  to: 4.95,  gate: "click" },  /* Play introduction */
      { id: "contact", from: 27.35, to: 30.20, gate: "auto"  }   /* reached by scrolling */
    ];

    /* Scene labels along the master. */
    var LABELS = [
      { t: 0.0,  n: "01", s: "Introduction"  },
      { t: 9.5,  n: "02", s: "Strategy"      },
      { t: 12.1, n: "03", s: "Execution"     },
      { t: 16.5, n: "04", s: "Collaboration" },
      { t: 26.0, n: "05", s: "Contact"       }
    ];

    /* Crop-aware framing: the master is portrait, the stage is landscape, so
       object-position is keyed along the timeline to keep the subject safe. */
    var FOCUS = [
      { t: 0.0,  y: 33 },  { t: 5.0,  y: 40 },  { t: 9.0,  y: 46 },
      { t: 10.5, y: 38 },  { t: 13.0, y: 48 },  { t: 17.5, y: 46 },
      { t: 23.5, y: 34 },  { t: 27.0, y: 30 },  { t: 30.8, y: 46 },
      { t: 33.6, y: 48 }
    ];

    var SMOOTH = small.matches ? 0.22 : 0.15;   /* lerp factor per frame */
    var SNAP   = 1 / 30;                        /* one frame: below this, snap */
    var SEEK   = 1 / 30;                        /* seek threshold, one frame   */

    var tagNum = film.querySelector(".scene-tag .num");
    var tagName= film.querySelector(".scene-tag .name");
    var bar    = film.querySelector(".track i");
    var knob   = film.querySelector(".track b");
    var clock  = film.querySelector(".clock");
    var profile= film.querySelector(".profile");
    var field  = film.querySelector(".copy-field");
    var closing= film.querySelector(".closing");
    var capBox = film.querySelector(".caption");

    var duration = 0;
    var shown = 0;          /* the time currently displayed */
    var mode = "scrub";     /* "scrub" | "speak" */
    var speaking = null;
    var audioUnlocked = false;
    var capOff = false;
    var visible = false;
    var done = [];

    reel.addEventListener("loadedmetadata", function () {
      duration = reel.duration || 0;
      if (clock) clock.textContent = "00:00 / " + fmt(duration);
    });
    /* With <source> children the media element does not fire `error` itself —
       the sources do, and only NETWORK_NO_SOURCE means every one was exhausted. */
    function markFailed() { if (stage) stage.classList.add("failed"); }
    reel.addEventListener("error", markFailed);
    Array.prototype.forEach.call(reel.querySelectorAll("source"), function (src) {
      src.addEventListener("error", function () {
        if (reel.networkState === 3) markFailed();          /* NETWORK_NO_SOURCE */
      });
    });
    setTimeout(function () {
      if (reel.readyState === 0 && reel.networkState !== 2) markFailed();  /* not LOADING */
    }, 12000);

    function fmt(s) {
      s = Math.max(0, s || 0);
      var m = Math.floor(s / 60), r = Math.floor(s % 60);
      return (m < 10 ? "0" : "") + m + ":" + (r < 10 ? "0" : "") + r;
    }

    function progress() {
      var r = film.getBoundingClientRect();
      var span = film.offsetHeight - innerHeight;
      if (span <= 0) return 0;
      return clamp(-r.top / span, 0, 1);
    }
    function timeToProgress(t) { return duration ? clamp(t / duration, 0, 1) : 0; }

    function pickFocus(t) {
      for (var i = 0; i < FOCUS.length - 1; i++) {
        if (t >= FOCUS[i].t && t <= FOCUS[i + 1].t) {
          var k = (t - FOCUS[i].t) / (FOCUS[i + 1].t - FOCUS[i].t);
          return lerp(FOCUS[i].y, FOCUS[i + 1].y, k);
        }
      }
      return t < FOCUS[0].t ? FOCUS[0].y : FOCUS[FOCUS.length - 1].y;
    }
    function pickLabel(t) {
      var out = LABELS[0];
      for (var i = 0; i < LABELS.length; i++) if (t >= LABELS[i].t) out = LABELS[i];
      return out;
    }

    /* captions come from the real track, painted into a live region */
    var cues = [];
    (function () {
      var tt = reel.textTracks && reel.textTracks[0];
      if (!tt) return;
      tt.mode = "hidden";
      var grab = function () { if (tt.cues) cues = Array.prototype.slice.call(tt.cues); };
      reel.addEventListener("loadeddata", grab);
      setTimeout(grab, 600); setTimeout(grab, 1600);
    })();
    function paintCue(t) {
      if (!capBox) return;
      if (capOff || mode !== "speak") { if (capBox.textContent) capBox.textContent = ""; return; }
      var out = "";
      for (var i = 0; i < cues.length; i++)
        if (t >= cues[i].startTime && t <= cues[i].endTime) { out = cues[i].text; break; }
      if (capBox.textContent !== out) capBox.textContent = out;
    }

    /* ── speaking ─────────────────────────────────────────────────────── */
    function startSpeech(seg, withSound) {
      if (!duration) return;
      mode = "speak"; speaking = seg;
      try { reel.currentTime = seg.from; } catch (e) {}
      shown = seg.from;
      reel.muted = !withSound;
      if (withSound) audioUnlocked = true;
      var sb = film.querySelector('[data-act="sound"]');
      if (sb) sb.hidden = !reel.muted;      /* the silent path still offers sound */
      reel.playbackRate = 1;
      var p = reel.play();
      if (p && p.catch) p.catch(function () {
        reel.muted = true;
        var b = film.querySelector('[data-act="sound"]'); if (b) b.hidden = false;
        var again = reel.play(); if (again && again.catch) again.catch(function () { endSpeech(); });
      });
      syncCtl();
    }
    function endSpeech(natural) {
      if (mode !== "speak") return;
      var seg = speaking;
      if (seg && done.indexOf(seg.id) < 0) done.push(seg.id);
      if (natural && seg && duration) {
        /* the sentence is over; let the journey continue from where it ended
           rather than rewinding to wherever the scroll happens to sit */
        var span = film.offsetHeight - innerHeight;
        var top  = film.getBoundingClientRect().top + scrollY;
        var to   = Math.round(top + span * clamp(seg.to / duration, 0, 1));
        shown = seg.to;
        try { scrollTo({ top: to, behavior: RM ? "auto" : "smooth" }); }
        catch (e) { scrollTo(0, to); }
      }
      mode = "scrub"; speaking = null;
      if (!reel.paused) reel.pause();
      reel.muted = true;
      if (capBox) capBox.textContent = "";
      var b = film.querySelector('[data-act="sound"]'); if (b) b.hidden = true;
      syncCtl();
    }
    reel.addEventListener("timeupdate", function () {
      if (mode !== "speak" || !speaking) return;
      paintCue(reel.currentTime);
      if (reel.currentTime >= speaking.to) endSpeech(true);
    });
    reel.addEventListener("ended", function () { endSpeech(true); });

    function syncCtl() {
      var box = film.querySelector(".stage-ctl"); if (!box) return;
      var pl = box.querySelector('[data-act="play"]');
      var pa = box.querySelector('[data-act="pause"]');
      var rp = box.querySelector('[data-act="replay"]');
      var sp = mode === "speak";
      if (pa) pa.hidden = !sp || reel.paused;
      if (pl) pl.hidden = !sp || !reel.paused;
      if (rp) rp.hidden = !sp;
    }
    reel.addEventListener("play",  syncCtl);
    reel.addEventListener("pause", syncCtl);

    document.addEventListener("click", function (e) {
      var b = e.target.closest("[data-act]"); if (!b) return;
      var a = b.dataset.act;
      if (a === "intro")        startSpeech(SPEECH[0], true);
      else if (a === "play")    { reel.playbackRate = 1; reel.play(); }
      else if (a === "pause")   reel.pause();
      else if (a === "replay")  { if (speaking) startSpeech(speaking, audioUnlocked || !reel.muted); }
      else if (a === "sound")   { reel.muted = false; audioUnlocked = true; b.hidden = true;
                                  if (reel.paused) reel.play(); }
      else if (a === "captions"){ capOff = !capOff; b.setAttribute("aria-pressed", String(!capOff));
                                  if (capOff && capBox) capBox.textContent = ""; }
    });

    /* ── the single loop ──────────────────────────────────────────────── */
    function frame() {
      if (duration && visible) {
        var p = progress();

        if (mode === "speak" && speaking) {
          /* the visitor may scroll away from a speaking moment; let them */
          var lo = timeToProgress(speaking.from) - 0.02;
          var hi = timeToProgress(speaking.to) + 0.05;
          if (p < lo || p > hi) endSpeech();
          else shown = reel.currentTime;
        }

        if (mode === "scrub") {
          var target = p * duration;
          var d = target - shown;
          if (Math.abs(d) < SNAP) shown = target;           /* exact convergence */
          else shown += d * SMOOTH;
          shown = clamp(shown, 0, duration);
          /* the two ends are exact: the first scroll position is frame 0, the
             last is the complete final frame, with no one-frame slack */
          var exact = p <= 0.0005 ? 0 : (p >= 0.9995 ? duration - 0.02 : null);
          if (exact !== null) {
            shown = exact;
            if (reel.readyState >= 1 && Math.abs(reel.currentTime - exact) > 0.004) {
              try { reel.currentTime = exact; } catch (e) {}
            }
          } else if (reel.readyState >= 1 && Math.abs(reel.currentTime - shown) > SEEK) {
            try { reel.currentTime = shown; } catch (e) { /* seek races are harmless */ }
          }
          if (!reel.paused) reel.pause();

          /* the contact line plays itself once the journey reaches it */
          var c = SPEECH[1];
          if (done.indexOf(c.id) < 0 && shown >= c.from - 0.05 && shown < c.to - 0.4) {
            startSpeech(c, audioUnlocked);
          }
        }

        reel.style.setProperty("--focus", pickFocus(shown).toFixed(2) + "%");
        var L = pickLabel(shown);
        if (tagNum && tagNum.textContent !== L.n) tagNum.textContent = L.n;
        if (tagName && tagName.textContent !== L.s) tagName.textContent = L.s;
        if (bar)  bar.style.width = (p * 100).toFixed(2) + "%";
        if (knob) knob.style.left = (p * 100).toFixed(2) + "%";
        if (clock) clock.textContent = fmt(shown) + " / " + fmt(duration);

        if (profile) profile.classList.toggle("on", shown < 5.4);
        if (field)   field.classList.toggle("on", shown < 5.4);

        /* the last moments: hold, fade the interface, name the idea */
        var tail = clamp((shown - (duration - 3.1)) / 2.2, 0, 1);
        if (closing) closing.classList.toggle("on", tail > 0.45);
        film.style.setProperty("--hud", (1 - tail).toFixed(3));
      }
      requestAnimationFrame(frame);
    }

    if (!RM) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) { visible = e.isIntersecting; });
      }, { rootMargin: "-2% 0px -2% 0px" }).observe(film);
      requestAnimationFrame(frame);
    } else {
      reel.controls = true;
      if (profile) profile.classList.add("on");
      if (closing) closing.classList.add("on");
      var tt2 = reel.textTracks && reel.textTracks[0];
      if (tt2) tt2.mode = "showing";
    }
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
