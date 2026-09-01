/* ==========================================================================
   Khalid Ounzar — Version 2
   One film, then the work.

   The film is a single scroll-mapped timeline. Nine scenes live on eight media
   files (scenes 4 and 5 are two halves of one clip, so that join does not
   exist). Scenes 1 and 8 carry speech and are never scrubbed: the timeline
   holds while they play at rate 1, then hands control back to the scroll.
   ========================================================================== */
(function () {
  "use strict";

  var CONTACT_EMAIL = "ounzar.khalid1999@gmail.com";

  document.documentElement.classList.add("js");
  var reduce = matchMedia("(prefers-reduced-motion: reduce)");
  var small  = matchMedia("(max-width: 900px)");
  var RM = reduce.matches;
  if (RM) document.documentElement.classList.add("rm");

  var MP4_OK = (function () {
    var t = document.createElement("video");
    return t.canPlayType('video/mp4; codecs="avc1.640028"') !== "" ||
           t.canPlayType('video/mp4; codecs="avc1.42E01E"') !== "";
  })();

  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var lerp  = function (a, b, t) { return a + (b - a) * t; };
  var smooth = function (t) { return t * t * (3 - 2 * t); };

  /* ── the film ─────────────────────────────────────────────────────────── */

  var film = document.querySelector("[data-film]");
  if (film) (function () {

    var reel  = film.querySelector(".reel");
    var mulli = film.querySelector(".mullion");
    var media = Array.prototype.slice.call(reel.querySelectorAll("video"));
    var byKey = {};
    media.forEach(function (v) { byKey[v.dataset.key] = { v: v, loaded: false, t: 0 }; });

    /* nine scenes, declared once. `weight` is how much scroll each one buys. */
    var SCENES = Array.prototype.slice.call(film.querySelectorAll("[data-scene]")).map(function (el, i) {
      return {
        i: i,
        key:    el.dataset.key,
        label:  el.dataset.label,
        from:   parseFloat(el.dataset.from || 0),      /* seconds into its file */
        to:     parseFloat(el.dataset.to   || 0),
        weight: parseFloat(el.dataset.weight),
        speaks: el.hasAttribute("data-speaks"),
        join:   el.dataset.join || "dissolve",
        played: false
      };
    });

    var total = SCENES.reduce(function (a, s) { return a + s.weight; }, 0);
    var acc = 0;
    SCENES.forEach(function (s) { s.a = acc / total; acc += s.weight; s.b = acc / total; });

    film.style.setProperty("--reels", total.toFixed(2));

    var tagNum   = film.querySelector(".scene-tag .num");
    var tagName  = film.querySelector(".scene-tag .name");
    var bar      = film.querySelector(".track i");
    var knob     = film.querySelector(".track b");
    var ticks    = Array.prototype.slice.call(film.querySelectorAll(".ticks span"));
    var profile  = film.querySelector(".profile");
    var closing  = film.querySelector(".closing");
    var field    = film.querySelector(".copy-field");
    var capBox   = film.querySelector(".caption");
    var active   = -1, visible = false, lastP = 0;

    function load(s) {
      var m = byKey[s.key];
      if (m.loaded) return;
      m.loaded = true;
      var d = m.v.dataset;
      var src = MP4_OK ? ((small.matches ? d.srcM : d.srcD) || d.srcD)
                       : ((small.matches && d.srcWm) ? d.srcWm : (d.srcW || d.srcD));
      if (d.poster && !m.v.poster) m.v.poster = d.poster;
      m.v.src = src;
      m.v.load();
    }

    function sweep() {
      if (!mulli || RM || !mulli.animate) return;
      mulli.animate(
        [ { transform: "translateX(-110%)", opacity: 1 },
          { transform: "translateX(0%)",    opacity: 1 },
          { transform: "translateX(110%)",  opacity: 1 } ],
        { duration: 620, easing: "cubic-bezier(.7,0,.3,1)" });
    }

    function setScene(n) {
      if (n === active || n < 0) return;
      var prev = active; active = n;
      var s = SCENES[n], m = byKey[s.key];

      media.forEach(function (v) {
        var on = v.dataset.key === s.key;
        v.classList.toggle("live", on);
        if (!on && !v.paused) v.pause();
      });
      load(s);
      if (SCENES[n + 1]) load(SCENES[n + 1]);

      /* the join only fires when the media itself changes */
      if (prev > -1 && SCENES[prev].key !== s.key) {
        if (s.join === "wipe") sweep();
        var fade = s.join === "cut" ? 80 : s.join === "wipe" ? 620 : 260;
        m.v.style.transition = "opacity " + fade + "ms linear";
      }

      if (tagNum)  tagNum.textContent  = String(n + 1).padStart(2, "0");
      if (tagName) tagName.textContent = s.label;
      ticks.forEach(function (t, i) {
        t.classList.toggle("done", i < n);
        t.classList.toggle("now",  i === n);
      });
      if (profile) profile.classList.toggle("on", n === 0);
      if (field) field.classList.toggle("on", n === 0);

      if (s.speaks) speakEnter(s);
      if (prev > -1 && SCENES[prev].speaks && SCENES[prev].key !== s.key) speakStop(SCENES[prev]);
    }

    /* speaking scenes: the timeline holds, the clip plays on its own clock */
    var speaker = null;
    function speakEnter(s) {
      var m = byKey[s.key];
      showCtl(true);
      if (!s.played && s.i > 0) { s.played = true; play(m.v, true); }
      speaker = m.v;
      bindCues(m.v);
    }
    function speakStop(s) {
      var m = byKey[s.key];
      if (!m.v.paused) m.v.pause();
      if (capBox) capBox.textContent = "";
      if (speaker === m.v) speaker = null;
    }
    function play(v, wantSound) {
      v.classList.add("live");
      if (wantSound) v.muted = false;
      var p = v.play();
      if (p && p.catch) p.catch(function () {
        v.muted = true;
        var b = film.querySelector('[data-act="sound"]'); if (b) b.hidden = false;
        var again = v.play(); if (again && again.catch) again.catch(function () {});
      });
    }

    var cueSets = {};
    function bindCues(v) {
      if (cueSets[v.dataset.key]) return;
      var tt = v.textTracks && v.textTracks[0];
      if (!tt) return;
      tt.mode = "hidden";
      var grab = function () {
        var list = tt.cues; if (!list) return;
        cueSets[v.dataset.key] = Array.prototype.slice.call(list);
      };
      v.addEventListener("loadeddata", grab); setTimeout(grab, 700);
    }
    function paintCue(v) {
      var cues = cueSets[v.dataset.key];
      if (!cues || !capBox || capOff) return;
      var t = v.currentTime, out = "";
      for (var i = 0; i < cues.length; i++)
        if (t >= cues[i].startTime && t <= cues[i].endTime) { out = cues[i].text; break; }
      if (capBox.textContent !== out) capBox.textContent = out;
    }

    function showCtl(on) {
      var box = film.querySelector(".stage-ctl"); if (!box) return;
      var pl = box.querySelector('[data-act="play"]');
      var pa = box.querySelector('[data-act="pause"]');
      var rp = box.querySelector('[data-act="replay"]');
      var v  = speaker || byKey[SCENES[0].key].v;
      if (rp) rp.hidden = !on;
      if (pl) pl.hidden = !on || !v.paused;
      if (pa) pa.hidden = !on || v.paused;
    }

    var capOff = false;
    film.addEventListener("click", function (e) {
      var b = e.target.closest("[data-act]"); if (!b) return;
      var a = b.dataset.act, v = speaker || byKey[SCENES[0].key].v;
      if (a !== "captions") speaker = v;
      if (a === "play")        { SCENES[0].played = true; play(v, true); }
      else if (a === "pause")  { v.pause(); }
      else if (a === "replay") { v.currentTime = 0; play(v, true); }
      else if (a === "sound")  { v.muted = false; b.hidden = true; if (v.paused) play(v, true); }
      else if (a === "captions") { capOff = !capOff; b.setAttribute("aria-pressed", String(!capOff));
                                   if (capOff && capBox) capBox.textContent = ""; }
    });

    media.forEach(function (v) {
      v.addEventListener("timeupdate", function () { if (v === speaker) paintCue(v); });
      v.addEventListener("play",  function () { showCtl(true); });
      v.addEventListener("pause", function () { showCtl(true); });
      v.addEventListener("ended", function () { if (capBox) capBox.textContent = ""; showCtl(true); });
      v.addEventListener("error", function () { reel.classList.add("failed"); });
    });

    function progress() {
      var r = film.getBoundingClientRect();
      var span = film.offsetHeight - innerHeight;
      if (span <= 0) return 0;
      return clamp(-r.top / span, 0, 1);
    }

    function tick() {
      if (!visible) return;
      var p = progress();
      var n = 0;
      for (var i = 0; i < SCENES.length; i++) if (p >= SCENES[i].a) n = i;
      setScene(n);

      var s = SCENES[n], m = byKey[s.key];
      var local = clamp((p - s.a) / Math.max(s.b - s.a, 1e-6), 0, 1);

      if (!s.speaks) {
        var span = s.to - s.from;
        if (span > 0) {
          var e = lerp(local, smooth(local), 0.45);         /* accelerate, settle */
          var target = s.from + e * (span - 1 / 30);
          m.t = lerp(m.t, target, 0.2);
          if (!m.v.paused) m.v.pause();
          if (m.v.readyState >= 2 && Math.abs(m.v.currentTime - m.t) > 1 / 40) {
            try { m.v.currentTime = m.t; } catch (err) { /* seek races are harmless */ }
          }
        }
      }

      if (bar)  bar.style.width = (p * 100).toFixed(2) + "%";
      if (knob) knob.style.left = (p * 100).toFixed(2) + "%";

      /* the closing line arrives once the aerial has settled */
      var last = SCENES[SCENES.length - 1];
      if (closing) closing.classList.toggle("on", n === last.i && local > 0.62);
      var fadeHud = n === last.i ? clamp((local - 0.55) / 0.3, 0, 1) : 0;
      film.style.setProperty("--hud-fade", (1 - fadeHud).toFixed(3));

      lastP = p;
    }

    if (!RM) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) { visible = e.isIntersecting; });
      }, { rootMargin: "-4% 0px -4% 0px" }).observe(film);

      (function loop() { tick(); requestAnimationFrame(loop); })();
    } else {
      /* reduced motion: the film becomes its poster frames, in order */
      SCENES.forEach(function (s, i) {
        var m = byKey[s.key];
        if (m.v.dataset.poster && !m.v.poster) m.v.poster = m.v.dataset.poster;
        if (i === 0) m.v.classList.add("live");
      });
      if (profile) profile.classList.add("on");
      if (closing) closing.classList.add("on");
      showCtl(true);
    }

    /* the intro clip is what the first screen shows, so it is ready up front */
    load(SCENES[0]);
    if (!RM) showCtl(true);
  })();

  /* ── skip ─────────────────────────────────────────────────────────────── */
  document.querySelectorAll("[data-skip]").forEach(function (b) {
    b.addEventListener("click", function () {
      document.querySelectorAll("video").forEach(function (v) { if (!v.paused) v.pause(); });
      var t = document.querySelector(b.dataset.skip || "#work");
      if (t) t.scrollIntoView({ behavior: RM ? "auto" : "smooth", block: "start" });
    });
  });

  /* ── the card system ──────────────────────────────────────────────────── */
  if (!RM) (function () {
    var cards = Array.prototype.slice.call(document.querySelectorAll(".card,.step"));
    if (!cards.length) return;
    var live = [];
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var i = live.indexOf(e.target);
        if (e.isIntersecting && i < 0) live.push(e.target);
        if (!e.isIntersecting && i > -1) { live.splice(i, 1); e.target.style.transform = ""; }
      });
    }, { rootMargin: "12% 0px 12% 0px" });
    cards.forEach(function (c) { io.observe(c); });

    var MAXX = small.matches ? 2 : 4;      /* degrees */
    var MAXY = small.matches ? 1.4 : 2.6;
    var DEPTH = small.matches ? 6 : 14;

    function frame() {
      var h = innerHeight, mid = h / 2;
      for (var i = 0; i < live.length; i++) {
        var el = live[i], r = el.getBoundingClientRect();
        var d = ((r.top + r.height / 2) - mid) / (h / 2);      /* -1 above … +1 below */
        d = clamp(d, -1, 1);
        var flat = Math.abs(d) < 0.15 ? 0 : (Math.abs(d) - 0.15) / 0.85;   /* settles flat to read */
        var sign = d < 0 ? -1 : 1;
        var rx = -sign * flat * MAXX;
        var cx = (r.left + r.width / 2) / innerWidth - 0.5;
        var ry = cx * flat * MAXY;
        var z  = -flat * DEPTH;
        el.style.transform = "rotateX(" + rx.toFixed(2) + "deg) rotateY(" + ry.toFixed(2) +
                             "deg) translateZ(" + z.toFixed(1) + "px)";
        el.style.setProperty("--sheen-o", (flat * 0.9).toFixed(2));
        el.style.setProperty("--sheen", (d < 0 ? 180 : 0) + "deg");
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  })();

  /* ── entrances, nav ground, bars ──────────────────────────────────────── */
  var riseIO = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); riseIO.unobserve(e.target); } });
  }, { rootMargin: "0px 0px -10%" });
  document.querySelectorAll(".rise").forEach(function (el) { riseIO.observe(el); });

  var barIO = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.querySelectorAll(".bar i").forEach(function (i) { i.style.width = i.dataset.w; });
      barIO.unobserve(e.target);
    });
  }, { rootMargin: "0px 0px -18%" });
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
    if (nav) nav.classList.toggle("on-light", under.classList.contains("light") || under.classList.contains("light-2"));
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
    var done = function () {
      var old = copy.textContent; copy.textContent = "Copied";
      setTimeout(function () { copy.textContent = old; }, 1800);
    };
    if (navigator.clipboard) navigator.clipboard.writeText(CONTACT_EMAIL).then(done, done); else done();
  });

  var form = document.getElementById("enquiry");
  if (form) form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!form.reportValidity()) return;
    var d = new FormData(form);
    var body = "Name: " + d.get("name") + "\n" +
               "Email: " + d.get("email") + "\n" +
               "Monthly ad spend: " + (d.get("budget") || "not given") + "\n\n" + d.get("message");
    location.href = "mailto:" + CONTACT_EMAIL +
      "?subject=" + encodeURIComponent("Portfolio enquiry — " + d.get("name")) +
      "&body=" + encodeURIComponent(body);
    var note = document.getElementById("formNote");
    note.className = "f-note ok";
    note.textContent = "Opening your email app with the message ready to send.";
  });
})();
