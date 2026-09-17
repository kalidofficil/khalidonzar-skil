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

    var INTRO_END = 4.880;         /* where the voice stops and the shot cuts */

    var LABELS = [
      { t: 0.0,  s: "Introduction"  }, { t: 9.5,  s: "Strategy" },
      { t: 12.1, s: "Execution"     }, { t: 16.5, s: "Collaboration" },
      { t: 26.0, s: "Contact"       }
    ];
    /* The live picture inside the master's 1080x1448 canvas, measured with
       cropdetect. Everything outside it is letterbox baked in by the edit, and
       it is symmetric, so the element only needs the height. */
    var CROP = [
      { t: 0,     h: 1444 }, { t: 12.05, h: 1232 },
      { t: 16.75, h: 1182 }, { t: 21.55, h: 926  }
    ];

    var bg     = document.getElementById("reelBg");
    var bgCtx  = bg && bg.getContext ? bg.getContext("2d", { alpha: false }) : null;
    var wide   = matchMedia("(min-aspect-ratio: 1/1)");
    var bgAt   = -1, bgWhen = 0;
    var capBox = film.querySelector(".caption");
    var cueEl  = document.getElementById("cue");
    var tagName = film.querySelector(".scene-tag .name");
    var ctlBox = film.querySelector(".stage-ctl");
    var bigPlay = film.querySelector(".big-play");
    var note   = document.getElementById("filmNote");

    var capOff = false, failed = false, started = false, userAsked = false;

    /* The `autoplay` attribute is on the element so the film starts at the
       earliest possible moment and still plays with JavaScript off. That also
       means it starts without asking this script — including for a visitor who
       asked not to be moved. Disarm it here, and hold the line with a guard,
       because the attribute can win the race against a deferred script. */
    if (RM) {
      reel.autoplay = false;
      reel.removeAttribute("autoplay");
      reel.addEventListener("play", function () {
        if (!userAsked) { reel.pause(); try { reel.currentTime = 0; } catch (e) {} }
      });
      try { reel.pause(); } catch (e) {}
    }

    function setCue(t) { if (cueEl && cueEl.textContent !== t) cueEl.textContent = t; }

    /* ── framing ──────────────────────────────────────────────────────────
       Stepped, never interpolated: the letterbox changes on a hard cut, so the
       element's shape must change on the same frame rather than easing. The
       film itself is never scaled, tinted or filtered — the crop is the box. */
    var activeH = 0;
    function setCrop(t) {
      var h = CROP[0].h;
      for (var i = 0; i < CROP.length; i++) if (t >= CROP[i].t) h = CROP[i].h;
      if (h === activeH) return;
      activeH = h;
      film.style.setProperty("--active", h);
      film.style.setProperty("--over", (1448 / h).toFixed(4));
      if (bg) { bg.height = Math.round(bg.width * h / 1080); bgAt = -1; }
    }
    setCrop(0);

    /* The room the live picture leaves on a landscape screen is filled with the
       same frame, blurred: a 32px thumbnail refreshed about ten times a second.
       It is out of focus by design, so nothing is lost, and the decoder keeps
       its budget for the film. */
    function paintSurround(now) {
      if (!bgCtx || !wide.matches || reel.readyState < 2) return;
      if (now - bgWhen < 96) return;
      if (Math.abs(reel.currentTime - bgAt) < 0.001) return;
      bgWhen = now;
      bgAt = reel.currentTime;
      var sh = reel.videoHeight * (activeH / 1448);
      var sy = (reel.videoHeight - sh) / 2;
      try { bgCtx.drawImage(reel, 0, sy, reel.videoWidth, sh, 0, 0, bg.width, bg.height); }
      catch (e) { /* not decodable yet */ }
    }

    /* ── captions ─────────────────────────────────────────────────────────
       Painted from the real <track> into the page's own line, so they are
       styled with the site and announced by a live region. The film starts
       muted, which is exactly when captions matter most. */
    var cues = [], track = reel.textTracks && reel.textTracks[0];
    if (track) {
      track.mode = "hidden";
      var readCues = function () {
        if (!track.cues) return;
        cues = [];
        for (var i = 0; i < track.cues.length; i++) cues.push(track.cues[i]);
      };
      readCues();
      track.addEventListener("load", readCues);
      reel.addEventListener("loadeddata", readCues);
    }
    function paintCaption(t) {
      if (!capBox) return;
      if (capOff) { if (capBox.textContent) capBox.textContent = ""; return; }
      var out = "";
      for (var i = 0; i < cues.length; i++)
        if (t >= cues[i].startTime && t <= cues[i].endTime) { out = cues[i].text; break; }
      if (capBox.textContent !== out) capBox.textContent = out;
    }

    /* ── failure ──────────────────────────────────────────────────────────
       With <source> children the element does not fire `error` itself, and the
       children's own error events are not dependable once the browser has
       given up on the whole list — so watch networkState instead.
       NETWORK_NO_SOURCE (3) means every candidate has been tried and failed. */
    function markFailed() {
      if (failed) return;
      failed = true;
      if (stage) stage.classList.add("failed");
      setCue("");
    }
    reel.addEventListener("error", markFailed);
    (function watchSources(waited) {
      if (failed || reel.readyState > 0) return;
      if (reel.networkState === 3) return markFailed();
      if (waited >= 14000) return markFailed();
      setTimeout(function () { watchSources(waited + 300); }, 300);
    })(0);

    /* ── autoplay, and what to do when it is refused ──────────────────────
       The film starts muted at normal speed and nothing holds the visitor
       here: they can scroll away at any moment. A muted autoplay is allowed
       almost everywhere, but not everywhere — Low Power Mode and Data Saver
       both refuse it — so the returned promise is honoured rather than
       assumed, and a refusal puts one obvious control over the poster. */
    function blocked(on) {
      if (stage) stage.classList.toggle("autoplay-blocked", on);
      if (bigPlay) bigPlay.hidden = !on;
      syncCtl();
    }
    function tryPlay() {
      if (RM || failed) return;
      var p = reel.play();
      if (p && p.catch) p.catch(function () { blocked(true); });
      else started = true;
    }
    reel.addEventListener("playing", function () {
      started = true;
      blocked(false);
    });
    if (!RM) {
      if (reel.readyState >= 2) tryPlay();
      reel.addEventListener("loadeddata", tryPlay, { once: true });
      reel.addEventListener("canplay", tryPlay, { once: true });
    }

    /* ── controls ─────────────────────────────────────────────────────── */
    function syncCtl() {
      if (!ctlBox) return;
      var pl = ctlBox.querySelector('[data-act="play"]');
      var pa = ctlBox.querySelector('[data-act="pause"]');
      var sd = ctlBox.querySelector('[data-act="sound"]');
      if (pl) pl.hidden = !reel.paused;
      if (pa) pa.hidden = reel.paused;
      if (sd) {
        sd.textContent = reel.muted ? "Sound on" : "Mute";
        sd.setAttribute("aria-pressed", String(!reel.muted));
      }
    }
    reel.addEventListener("play", syncCtl);
    reel.addEventListener("pause", syncCtl);
    reel.addEventListener("volumechange", syncCtl);
    reel.addEventListener("ended", function () { setCue(""); syncCtl(); });

    document.addEventListener("click", function (e) {
      var b = e.target.closest("[data-act]"); if (!b) return;
      var a = b.dataset.act;
      if (a === "play") {
        userAsked = true;
        blocked(false);
        reel.playbackRate = 1;
        var p = reel.play();
        if (p && p.catch) p.catch(function () { blocked(true); });
      }
      else if (a === "pause") reel.pause();
      else if (a === "replay") {
        userAsked = true;
        try { reel.currentTime = 0; } catch (err) {}
        reel.playbackRate = 1;
        blocked(false);
        reel.play();
      }
      else if (a === "sound") {
        userAsked = true;
        reel.muted = !reel.muted;
        /* The introduction is spoken in the first five seconds. Unmuting after
           that would hand over silence, so say where it is rather than jumping
           the playhead out from under them. */
        if (!reel.muted && reel.currentTime > INTRO_END)
          setCue("The introduction is spoken in the first five seconds — press Replay to hear it.");
        else setCue("");
        if (!reel.muted && reel.paused) reel.play();
        syncCtl();
      }
      else if (a === "captions") {
        capOff = !capOff;
        b.setAttribute("aria-pressed", String(!capOff));
        if (capOff && capBox) capBox.textContent = "";
      }
      else if (a === "info") {
        if (!note) return;
        var open = note.hidden;
        note.hidden = !open;
        b.setAttribute("aria-expanded", String(open));
      }
    });

    /* ── per-frame work, on the page's single loop ────────────────────── */
    var visible = true;
    function frame(now) {
      if (!RM && visible && !failed) {
        var t = reel.currentTime || 0;
        setCrop(t);
        paintSurround(now);
        paintCaption(t);
        var L = LABELS[0];
        for (var i = 0; i < LABELS.length; i++) if (t >= LABELS[i].t) L = LABELS[i];
        if (tagName && tagName.textContent !== L.s) tagName.textContent = L.s;
      }
      requestAnimationFrame(frame);
    }

    if (!RM) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          visible = e.isIntersecting;
          /* Nothing is gained by decoding frames nobody can see, and a paused
             film off-screen leaves the decoder free for the rest of the page. */
          if (!visible && !reel.paused && started) reel.pause();
          else if (visible && reel.paused && started && !reel.ended) reel.play();
        });
      }, { rootMargin: "0px", threshold: 0.15 }).observe(film);
      requestAnimationFrame(frame);
    } else {
      /* reduced motion: a still hero, the introduction only on request */
      setCrop(0);
      syncCtl();
      setCue("Press play for the introduction, or scroll to the work.");
    }
  })();

  /* ── skip ─────────────────────────────────────────────────────────────── */
  document.querySelectorAll("[data-skip]").forEach(function (b) {
    b.addEventListener("click", function (e) {
      /* The anchor's own jump would land instantly and then fight the smooth
         scroll below, so it is taken over rather than allowed to race. */
      if (b.tagName === "A") e.preventDefault();
      if (reel && !reel.paused) reel.pause();
      var t = document.querySelector(b.dataset.skip || "#work");
      if (t) t.scrollIntoView({ behavior: RM ? "auto" : "smooth", block: "start" });
    });
  });

  /* ── the introduction ───────────────────────────────────────────────────
     Three stages driven by the section's own travel through the viewport.
     There is no scroll lock anywhere in here: no preventDefault, no
     scrollTo, no overflow:hidden on the body. The panel is sticky in CSS and
     the page scrolls through it at whatever speed the visitor chooses.

     Each stage gets an enter, a hold and an exit inside its own span, and the
     hold is the largest of the three — the point of the section is that the
     sentence can be read, not that it moves.

     The two halves of stages 1 and 2 travel at different rates and cross
     mid-flight, which is the one movement carried over from the reference
     clip. On a phone they travel together: at that width the crossing reads
     as a collision rather than a composition.
  --------------------------------------------------------------------- */
  (function () {
    var intro = document.querySelector("[data-intro]");
    if (!intro || RM) return;

    var pin   = intro.querySelector(".intro-pin");
    var lines = Array.prototype.slice.call(intro.querySelectorAll(".intro-line"));
    if (!pin || lines.length !== 3) return;

    var narrow = matchMedia("(max-width: 900px)");
    /* Of each stage's own span: a third to arrive, 42% held still, the rest to
       leave. The hold is the biggest share on purpose — the section exists to
       be read, not to move. */
    var ENTER = 0.34, HOLD = 0.76;
    var SPANS = [[0, 0.34], [0.34, 0.66], [0.66, 1]];

    var outCubic = function (t) { return 1 - Math.pow(1 - t, 3); };
    var inCubic  = function (t) { return t * t * t; };

    /* sub-progress within a stage, and which of the three phases it is in */
    function phase(p, i) {
      var a = SPANS[i][0], b = SPANS[i][1];
      var u = clamp((p - a) / (b - a), 0, 1);
      if (u < ENTER) return { k: "in",   t: u / ENTER };
      if (u < HOLD)  return { k: "hold", t: 1 };
      return { k: "out", t: (u - HOLD) / (1 - HOLD) };
    }

    function put(el, x, y, sc, o) {
      el.style.transform = "translate3d(" + x.toFixed(1) + "px," + y.toFixed(1) + "px,0)" +
                           (sc === 1 ? "" : " scale(" + sc.toFixed(3) + ")");
      el.style.opacity = o.toFixed(3);
    }

    var halves = lines.map(function (l) {
      return { a: l.querySelector(".wa"), b: l.querySelector(".wb"), one: l.querySelector(".w") };
    });

    function draw() {
      var r = intro.getBoundingClientRect();
      var travel = intro.offsetHeight - innerHeight;
      if (travel <= 0) return;
      var p = clamp(-r.top / travel, 0, 1);
      var fast = narrow.matches ? 1 : 1.38;   /* the second half's rate */

      for (var i = 0; i < 3; i++) {
        var ph = phase(p, i), h = halves[i], line = lines[i];

        /* Before its turn and after it, a line is off — not merely translated
           out behind its clip. It keeps the transform it will enter from, so
           nothing jumps when its turn comes. */
        var before = p < SPANS[i][0];
        var after  = p >= SPANS[i][1] && i < 2;
        if (before || after) {
          line.style.opacity = "0";
          line.style.transform = "none";
          continue;
        }

        if (ph.k === "hold") {
          line.style.opacity = "1";
          line.style.transform = "none";
          if (h.a) put(h.a, 0, 0, 1, 1);
          if (h.b) put(h.b, 0, 0, 1, 1);
          if (h.one) put(h.one, 0, 0, 1, 1);
          continue;
        }

        if (ph.k === "in") {
          var e  = outCubic(ph.t);
          var ef = outCubic(clamp(ph.t * fast, 0, 1));   /* arrives first, so they cross */
          line.style.opacity = "1";
          line.style.transform = "none";
          if (i === 0) {
            if (h.a) put(h.a, 0, (1 - e) * -64, 1, e);
            if (h.b) put(h.b, (1 - ef) * -170, 0, 1, ef);
          } else if (i === 1) {
            /* both halves rise through their own clip edge */
            if (h.a) put(h.a, 0, (1 - e) * 110, 1, 1);
            if (h.b) put(h.b, 0, (1 - ef) * 110, 1, 1);
          } else {
            if (h.one) put(h.one, 0, (1 - e) * 46, 0.94 + 0.06 * e, e);
          }
          continue;
        }

        /* out: the pair clears at two rates, the way it arrived */
        var x  = inCubic(ph.t);
        var xf = inCubic(clamp(ph.t * 1.3, 0, 1));
        var fade = 1 - clamp(ph.t * 1.25, 0, 1);
        line.style.opacity = "1";
        if (i === 0) {
          if (h.a) put(h.a, 0, x * -90, 1, fade);
          if (h.b) put(h.b, xf * -300, 0, 1, fade);
        } else if (i === 1) {
          if (h.a) put(h.a, x * -220, 0, 1, fade);
          if (h.b) put(h.b, xf * -340, 0, 1, fade);
        } else if (h.one) {
          put(h.one, 0, 0, 1, 1);
        }
      }
    }

    /* Per-frame work goes on the page's one loop, and only while the section
       is actually on screen. */
    var live = false;
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { live = e.isIntersecting; if (live) draw(); });
    }, { rootMargin: "10% 0px 10% 0px" }).observe(intro);

    (window.__csFrame = window.__csFrame || []).push(function () { if (live) draw(); });
    addEventListener("resize", function () { if (live) draw(); }, { passive: true });
    draw();
  })();

  /* ── a heading that arrives one word at a time ──────────────────────────
     The capability cards must not start moving while the heading is still
     assembling, or the two readings compete. The heading announces when it
     has settled and capabilities.js waits for that before it fires.
  --------------------------------------------------------------------- */
  (function () {
    var heads = document.querySelectorAll("[data-seq]");
    if (!heads.length) return;
    /* last word starts at 360ms and runs 520ms, then the row holds 600ms */
    var SETTLED = 360 + 520 + 600;

    function announce() {
      window.__seqDone = true;
      document.dispatchEvent(new CustomEvent("seq:done"));
    }
    if (RM) { heads.forEach(function (h) { h.classList.add("is-in"); }); announce(); return; }

    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-in");
        io.unobserve(e.target);
        if (e.target.closest("#capabilities")) setTimeout(announce, SETTLED);
      });
    }, { rootMargin: "0px 0px -25% 0px", threshold: 0 });
    heads.forEach(function (h) { io.observe(h); });
  })();

  /* ── the laptop cinematic ────────────────────────────────────────────────
     Scroll-controlled, on the page's one loop, with no scroll lock: the panel
     is sticky in CSS and the page moves through it at the visitor's pace.

     The approved clip is never played. Its playhead is driven by the scroll
     position, so the visitor opens the lid themselves, forwards or backwards.
     When the lid has settled the camera pushes toward the screen — on the
     SAME element, so the move continues out of the clip's final frame rather
     than cutting to a second layer — and the screen's HTML contents, pinned
     to the panel measured in the footage, carry us into About.
  --------------------------------------------------------------------- */
  (function () {
    var lap = document.querySelector("[data-lap]");
    if (!lap || RM) return;
    var pin  = lap.querySelector(".lap-pin");
    var cam  = lap.querySelector(".lap-cam");
    var vid  = lap.querySelector("[data-lap-film]");
    var scr  = lap.querySelector(".lap-screen");
    if (!pin || !cam || !vid || !scr) return;

    var IW = 1280, IH = 716;              /* the clip's own frame */

    /* The laptop's panel, measured off the clip's settled frame by sampling
       the lit rectangle rather than eyeballing it: x 0.400-0.598 across,
       0.531-0.715 down. The HTML screen is placed onto exactly this. */
    var SX0 = 0.4000, SX1 = 0.5977, SY0 = 0.5307, SY1 = 0.7151;
    var SCX = (SX0 + SX1) / 2, SCY = (SY0 + SY1) / 2;

    /* The framing anchor: a point between his eyes and the panel, held near
       the middle of the box. `cover` crops a 16:9 clip differently on a phone
       (sides) and on an ultrawide (top and bottom), and a flat 50%/50% loses
       the top of his head on the wide ones. */
    var AX = 0.500, AY = 0.420, WANT_X = 0.50, WANT_Y = 0.46;

    /* How much of the box the panel should fill by the end of the push, and
       the band the resulting scale is kept inside. The footage is soft at the
       far end of that band, which is the point: by then the panel is opaque
       HTML and the footage around it is fading out of focus. */
    var FILL = 0.58, S_MIN = 1.8, S_MAX = 2.9;

    var G = { ox: 0, oy: 0, w: 0, h: 0, max: 2.4 };

    function place() {
      var bw = pin.clientWidth, bh = pin.clientHeight;
      if (!bw || !bh) return;
      var s = Math.max(bw / IW, bh / IH);
      var rw = IW * s, rh = IH * s;
      var px = rw <= bw ? 0.5 : clamp((AX * rw - WANT_X * bw) / (rw - bw), 0, 1);
      var py = rh <= bh ? 0.5 : clamp((AY * rh - WANT_Y * bh) / (rh - bh), 0, 1);
      vid.style.objectPosition = (px * 100).toFixed(2) + "% " + (py * 100).toFixed(2) + "%";

      var left = (bw - rw) * px, top = (bh - rh) * py;
      G.ox = left + SCX * rw;  G.oy = top + SCY * rh;
      G.w  = (SX1 - SX0) * rw; G.h  = (SY1 - SY0) * rh;
      G.max = clamp(FILL * bw / G.w, S_MIN, S_MAX);

      cam.style.transformOrigin = G.ox.toFixed(1) + "px " + G.oy.toFixed(1) + "px";
      scr.style.left   = (G.ox - G.w / 2).toFixed(1) + "px";
      scr.style.top    = (G.oy - G.h / 2).toFixed(1) + "px";
      scr.style.width  = G.w.toFixed(1) + "px";
      scr.style.height = G.h.toFixed(1) + "px";
      scr.style.setProperty("--sw", G.w.toFixed(1) + "px");
    }
    place();

    /* Beat boundaries as fractions of the section's travel. The scrub gets
       most of it: it is the only stretch where the visitor is doing the
       acting, and the push reads better fast. */
    var B = { hold: 0.05, scrub: 0.64, dolly: 0.88 };
    var ease = function (t) { return 1 - Math.pow(1 - t, 3); };
    var span = function (p, a, b) { return clamp((p - a) / (b - a), 0, 1); };

    /* ── the playhead ──────────────────────────────────────────────────
       The same discipline that held the hero's old scrub at zero drift:
       glide toward the target, land exactly when scrolling stops, cut the
       glide short on a jump so it never becomes a wait, and keep one seek
       in flight — asking for a new frame while the decoder is still
       resolving the last one queues work it then throws away, which is
       what makes a scrub stall. */
    var SMOOTH = small.matches ? 0.20 : 0.17;
    var SNAP = 1 / 48, SEEK = 1 / 48, LEAP = 0.8, TAIL = 0.02;
    var dur = 0, shown = 0, warmed = false, wasLit = false;

    function noteDuration() {
      if (dur || !vid.duration || !isFinite(vid.duration)) return;
      dur = vid.duration;
    }
    /* The clip is not wanted at page load — the hero owns the decoder then —
       so it arrives with metadata only and is fetched in full once the
       section is within about a screen and a half. */
    function warm() {
      if (warmed) return;
      warmed = true;
      if (vid.preload !== "auto") { vid.preload = "auto"; try { vid.load(); } catch (e) {} }
    }

    var live = false;
    function draw() {
      var travel = lap.offsetHeight - innerHeight;
      if (travel <= 0) return;
      var p = clamp(-lap.getBoundingClientRect().top / travel, 0, 1);
      var bw = pin.clientWidth, bh = pin.clientHeight;

      /* ── the lid, opened by scroll ── */
      if (!dur) noteDuration();
      if (dur) {
        var hi = Math.max(0, dur - TAIL);
        var q = span(p, B.hold, B.scrub);
        var target = q * hi;
        var d = target - shown;
        if (Math.abs(d) > LEAP) { shown = target - (d > 0 ? LEAP : -LEAP); d = target - shown; }
        if (Math.abs(d) < SNAP) shown = target; else shown += d * SMOOTH;
        shown = clamp(shown, 0, hi);
        /* the two ends are asserted exactly, so the lid is fully shut at the
           top of the section and fully open before the push begins */
        var exact = q <= 0.0005 ? 0 : (q >= 0.9995 ? hi : null);
        if (exact !== null) shown = exact;
        var want = exact !== null ? exact : shown;
        var tol  = exact !== null ? 0.004 : SEEK;
        if (vid.readyState >= 1 && !vid.seeking &&
            Math.abs(vid.currentTime - want) > tol) {
          try { vid.currentTime = want; } catch (e) { /* seek races are harmless */ }
        }
        if (!vid.paused) vid.pause();
        if (!vid.muted) vid.muted = true;
      }

      /* ── the push ──
         Scaling about the panel alone would leave it where it sits, low and
         a little left of centre, so the camera also translates: by the end
         the panel is in the middle of the frame, the way a dolly recentres
         what it is approaching. */
      var dd = ease(span(p, B.scrub, B.dolly));
      var tx = (bw * 0.5 - G.ox) * dd, ty = (bh * 0.5 - G.oy) * dd;

      /* Translating the element can pull its own edge into the box. With the
         origin on the panel, a point P lands at origin + (P - origin) * s + t,
         so these four are the smallest scales that keep each edge outside;
         the push takes whichever is largest. Without it the violet ground
         showed through along one side for most of the move. */
      var ox = G.ox, oy = G.oy;
      var need = Math.max(
        ox > 0.5 ? 1 + tx / ox : 1,
        bw - ox > 0.5 ? 1 - tx / (bw - ox) : 1,
        oy > 0.5 ? 1 + ty / oy : 1,
        bh - oy > 0.5 ? 1 - ty / (bh - oy) : 1
      );
      var sc = Math.max(1 + dd * (G.max - 1), need * 1.005);
      cam.style.transform = "translate3d(" + tx.toFixed(1) + "px," + ty.toFixed(1) + "px,0) " +
                            "scale(" + sc.toFixed(4) + ")";

      /* ── the light off the panel ──
         Keyed to the lid, not to the camera: it rises as the lid opens,
         because that is when the room would actually get brighter. */
      var q2 = span(p, B.hold, B.scrub);
      var b = ease(span(q2, 0.42, 1));
      pin.style.setProperty("--lx", (ox + tx).toFixed(1) + "px");
      pin.style.setProperty("--ly", (oy + ty).toFixed(1) + "px");
      pin.style.setProperty("--bloom", (b * 0.52 * (1 - span(p, B.dolly - 0.04, B.dolly + 0.06))).toFixed(3));
      pin.style.setProperty("--bloom-s", (0.40 + b * 0.55 + dd * 0.7).toFixed(3));

      /* ── the screen turns on ──
         It fades up over the real panel once the lid has settled, so what
         the camera closes on is readable rather than a blank rectangle. */
      var sIn = span(p, B.scrub - 0.02, B.scrub + 0.10);
      var sThru = span(p, B.dolly - 0.02, 1);
      pin.style.setProperty("--scr", sIn.toFixed(3));
      pin.style.setProperty("--scr-s", (0.965 + ease(sIn) * 0.035 + Math.pow(sThru, 2.2) * 6).toFixed(3));
      /* Once we are passing through it, what should fill the frame is the
         screen's own light — not four-foot letterforms sliding past. */
      pin.style.setProperty("--scr-copy", (1 - span(p, B.dolly + 0.005, B.dolly + 0.055)).toFixed(3));

      /* ── focus falls off as the camera closes ──
         Only in the last third of the push, by which point his face has long
         left the frame. Nothing here grades or tints the footage. */
      pin.style.setProperty("--film-o", (1 - span(p, B.dolly + 0.005, B.dolly + 0.07)).toFixed(3));
      /* A vignette belongs to the wide shot. It has to be gone by the time we
         are reading the screen, because its flat tint sits over the panel too
         and was costing the headline four stops of contrast. */
      pin.style.setProperty("--vig", (1 - span(p, B.scrub, B.scrub + (B.dolly - B.scrub) * 0.6)).toFixed(3));

      /* ── the wash, and its retreat upward into About ── */
      /* The wash rises late and retreats immediately, because About is already
         climbing into frame underneath it by p=0.90 (see #about in the
         stylesheet). Held any longer, the two spend half a screen doing
         nothing but being the same colour. */
      var f = span(p, B.dolly, B.dolly + 0.06);
      var out = span(p, 0.945, 1);
      pin.style.setProperty("--flash", (f * (1 - out * 0.15)).toFixed(3));
      pin.style.setProperty("--flash-y", (-out * 100).toFixed(1) + "%");
      pin.style.setProperty("--handover", span(p, B.dolly, 0.97).toFixed(3));
      pin.style.setProperty("--cue", (1 - span(p, 0.03, 0.14)).toFixed(3));

      /* The bar is painted for whatever band is under it, and this section is
         dark — right up until the wash turns its ground white, at which point
         a white bar is white on white. So the section declares itself light
         once the wash has taken the frame, and the bar dips through the
         crossover rather than passing through a moment of 1.1:1. */
      var lit = f > 0.5;
      if (lit !== wasLit) {
        wasLit = lit;
        if (lit) lap.setAttribute("data-nav-light", ""); else lap.removeAttribute("data-nav-light");
        if (window.__csNav) window.__csNav();
      }
      /* The wash crosses from near-black to near-white in about a fifth of
         this section, and measured across that crossover neither bar tone
         clears 4.5:1. So the bar is held out for the whole of it — not just
         the midpoint — and returns once its ground has settled. */
      var dip = Math.min(1, clamp(1 - (f - 0.02) / 0.13, 0, 1) + clamp((f - 0.85) / 0.13, 0, 1));
      document.documentElement.style.setProperty("--nav-dip", dip.toFixed(3));
    }

    new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) warm(); });
    }, { rootMargin: "150% 0px 150% 0px" }).observe(lap);
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { live = e.isIntersecting; if (live) draw(); });
    }, { rootMargin: "12% 0px 12% 0px" }).observe(lap);

    (window.__csFrame = window.__csFrame || []).push(function () { if (live) draw(); });
    addEventListener("resize", function () { place(); if (live) draw(); }, { passive: true });
    vid.addEventListener("loadedmetadata", function () { noteDuration(); place(); draw(); });
    draw();
  })();

  /* ── the process rail ───────────────────────────────────────────────────
     The line fills and each node lights as its step reaches the middle of the
     screen. Scroll-linked, on the page's one loop, and purely decorative —
     the four steps read the same with it switched off.
  --------------------------------------------------------------------- */
  (function () {
    var rail = document.querySelector("[data-rail]");
    if (!rail) return;
    var steps = Array.prototype.slice.call(rail.querySelectorAll(".rail-step"));
    if (!steps.length) return;
    if (RM) { steps.forEach(function (s) { s.classList.add("is-live"); });
              rail.style.setProperty("--rail", "1"); return; }

    var live = false, lastFill = -1;
    function draw() {
      var line = innerHeight * 0.58;          /* the reading line */
      var reached = 0;
      for (var i = 0; i < steps.length; i++) {
        var r = steps[i].getBoundingClientRect();
        var on = r.top <= line;
        steps[i].classList.toggle("is-live", on);
        if (on) reached = i + 1;
      }
      /* the line is drawn to the last node reached, not past it */
      var fill = steps.length < 2 ? (reached ? 1 : 0)
                                  : clamp((reached - 1) / (steps.length - 1), 0, 1);
      if (fill !== lastFill) { lastFill = fill; rail.style.setProperty("--rail", fill.toFixed(3)); }
    }
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { live = e.isIntersecting; if (live) draw(); });
    }, { rootMargin: "20% 0px 20% 0px" }).observe(rail);
    (window.__csFrame = window.__csFrame || []).push(function () { if (live) draw(); });
    draw();
  })();

  /* ── card systems ─────────────────────────────────────────────────────── */
  /* Anything else on the page that needs per-frame work registers here rather
     than starting its own requestAnimationFrame. One loop, one clock — the
     rule the hero was built on. */
  var FRAME = window.__csFrame = window.__csFrame || [];

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

      for (var f = 0; f < FRAME.length; f++) {
        try { FRAME[f](h); } catch (e) { /* one bad guest must not stop the loop */ }
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
  /* The bands live inside <div class="work">, so a direct-child selector only
     ever matched that wrapper — which is why the bar never flipped over a
     light band. Any section with an id, at any depth, is a band. */
  var sections = Array.prototype.slice.call(document.querySelectorAll("main section[id]"));
  function paintNav() {
    if (!sections.length) return;
    var line = 32, under = null;
    for (var i = 0; i < sections.length; i++) {
      var r = sections[i].getBoundingClientRect();
      if (r.top <= line && r.bottom > line) under = sections[i];
    }
    if (!under) return;
    if (nav) {
      /* `data-nav-light` lets a dark section declare that its ground has
         turned light under the bar — the laptop's hand-over wash does. */
      nav.classList.toggle("on-light",
        under.classList.contains("light") || under.hasAttribute("data-nav-light"));
      /* a light band can set its own bar tone: bone is not right over mist */
      var tone = under.getAttribute("data-nav");
      if (tone) nav.setAttribute("data-nav", tone); else nav.removeAttribute("data-nav");
    }
    for (var k = 0; k < links.length; k++) {
      if (links[k].getAttribute("href") === "#" + under.id) links[k].setAttribute("aria-current", "true");
      else links[k].removeAttribute("aria-current");
    }
  }
  addEventListener("scroll", paintNav, { passive: true });
  addEventListener("resize", paintNav);
  window.__csNav = paintNav;
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
