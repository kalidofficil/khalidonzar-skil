/* ==========================================================================
   Khalid Ounzar, "The Gap"

   The hero is scroll-scrubbed, but there is no video to scrub: the scene is
   drawn in SVG and its geometry is driven by scroll progress instead of a
   video's currentTime. Everything else follows the same standard as a
   filmed hero: a dt-normalized lerp on a rAF loop that rests, delta-gated
   DOM writes, bands paced in scroll distance, and the five static-hero
   gates armed and disarmed live.
   ========================================================================== */
(function () {
  "use strict";

  var CONTACT_EMAIL = "ounzar.khalid1999@gmail.com";

  /* ---------------------------------------------------------------- utils */
  var clamp = function (v, lo, hi) { return Math.min(hi, Math.max(lo, v)); };
  var smoothstep = function (p, e0, e1) {
    var t = clamp((p - e0) / (e1 - e0), 0, 1);
    return t * t * (3 - 2 * t);
  };
  function rng(seed) {
    var s = seed >>> 0;
    return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }
  var reduced = function () { return matchMedia("(prefers-reduced-motion:reduce)").matches; };

  var hero = document.getElementById("hero");
  var stage = hero && hero.querySelector(".stage");
  var scene = document.querySelector(".scene");
  var cue = document.getElementById("cue");
  var bandEls = [].slice.call(document.querySelectorAll(".band"));

  /* ================================================================ split
     Words and characters, once at load, with a seeded generator so the
     "random" offsets are identical on every load. */
  function split(band) {
    var fx = band.dataset.fx;
    var target = band.classList.contains("band-settle")
      ? band.querySelector(".settle-h")
      : band;
    var text = target.textContent.trim();
    var rand = rng(text.length * 7919 + 13);
    var spread = parseFloat(band.dataset.spread || "0.45");

    var sr = document.createElement("span");
    sr.className = "sr";
    sr.textContent = text;

    var vis = document.createElement("span");
    vis.setAttribute("aria-hidden", "true");

    var words = text.split(/(\s+)/).filter(function (t) { return t.length; });
    var realWords = words.filter(function (t) { return !/^\s+$/.test(t); });
    var totalChars = text.replace(/\s/g, "").length;
    var charSeen = 0;
    var wordSeen = 0;

    words.forEach(function (token) {
      if (/^\s+$/.test(token)) { vis.appendChild(document.createTextNode(token)); return; }

      var w = document.createElement("span");
      w.className = "w";
      var wi = wordSeen++;

      if (fx === "punch") {
        w.style.setProperty("--th", (wi / Math.max(1, realWords.length) * 0.5).toFixed(3));
        if (band.dataset.em && wi === realWords.length - 1) w.classList.add("em");
      } else if (fx === "drift") {
        w.style.setProperty("--th", (wi / Math.max(1, realWords.length) * 0.48 + rand() * 0.05).toFixed(3));
      } else if (fx === "part") {
        // Two halves pulled toward the centre line, parting outward: the caliper jaws.
        var half = wi < Math.ceil(realWords.length / 2) ? -1 : 1;
        w.style.setProperty("--jx", (half * (46 + rand() * 22)).toFixed(1) + "px");
        w.style.setProperty("--th", (Math.abs(wi - (realWords.length - 1) / 2) / realWords.length * 0.34).toFixed(3));
      } else if (fx === "rise") {
        w.style.setProperty("--th", (wi / Math.max(1, realWords.length) * 0.42).toFixed(3));
      }

      if (fx === "grid") {
        // Characters slide in horizontally, in reading order.
        token.split("").forEach(function (ch) {
          var c = document.createElement("span");
          c.className = "c";
          c.textContent = ch;
          c.style.setProperty("--th", ((charSeen / Math.max(1, totalChars)) * spread + rand() * 0.06).toFixed(3));
          c.style.setProperty("--jx", (-14 - rand() * 20).toFixed(1) + "px");
          charSeen++;
          w.appendChild(c);
        });
      } else {
        w.textContent = token;
      }

      vis.appendChild(w);
    });

    target.textContent = "";
    target.appendChild(sr);
    target.appendChild(vis);
    band.classList.add("fx-" + fx);
  }

  var bands = bandEls.map(function (el) {
    split(el);
    return {
      el: el,
      a: parseFloat(el.dataset.a),
      b: parseFloat(el.dataset.b),
      ramp: el.dataset.ramp ? parseFloat(el.dataset.ramp) : 0,
      op: -1,
      k: -1
    };
  });

  /* ============================================================ scene setup
     Measure the real path lengths so the draw-on maths is exact. */
  if (scene) {
    [["lineRep", "--len-rep"], ["lineReal", "--len-real"]].forEach(function (pair) {
      var p = document.getElementById(pair[0]);
      if (p && p.getTotalLength) scene.style.setProperty(pair[1], Math.ceil(p.getTotalLength()));
    });
    scene.style.setProperty("--len-cal", 186);
  }

  var sceneState = { dRep: -1, dReal: -1, cal: -1 };
  function setSceneVar(name, value) {
    var v = Math.round(value * 1000) / 1000;
    if (Math.abs(sceneState[name] - v) < 0.004) return;   // delta gate
    sceneState[name] = v;
    scene.style.setProperty("--" + name, v);
    if (name === "dReal") scene.style.setProperty("--dRealO", v > 0 ? 1 : 0);
  }

  function updateScene(p) {
    if (!scene) return;
    setSceneVar("dRep", 0.34 + 0.66 * smoothstep(p, 0.00, 0.30));
    setSceneVar("dReal", smoothstep(p, 0.40, 0.62));
    setSceneVar("cal", smoothstep(p, 0.62, 0.84));
  }

  /* ============================================================== captions */
  function updateCaptions(p) {
    for (var i = 0; i < bands.length; i++) {
      var b = bands[i];
      var f = Math.min(0.02, (b.b - b.a) / 3);
      var inRamp = i === 0 ? 1 : smoothstep(p, b.a, b.a + f);
      var outRamp = i === bands.length - 1 ? 1 : (1 - smoothstep(p, b.b - f, b.b));
      var op = Math.round(inRamp * outRamp * 1000) / 1000;

      var k = clamp((p - b.a) / (b.ramp || Math.min(0.025, (b.b - b.a) * 0.35)), 0, 1);
      if (i === 0) k = Math.max(k, loadK);
      k = Math.round(k * 1000) / 1000;

      if (Math.abs(b.op - op) >= 0.004) { b.op = op; b.el.style.setProperty("--o", op); }
      if (Math.abs(b.k - k) >= 0.008) { b.k = k; b.el.style.setProperty("--k", k); }
    }
    if (cue) {
      var c = Math.round((1 - smoothstep(p, 0.01, 0.10)) * 100) / 100;
      if (cue._o !== c) { cue._o = c; cue.style.setProperty("--cueO", c); }
    }
  }

  /* ============================================== the drive (a loop that rests) */
  var target = 0, shown = 0, rafId = null, lastTick = 0;
  var heroOnScreen = true;
  var loadK = 0, loadStart = 0;

  function heroProgress() {
    if (!hero) return 0;
    var range = hero.offsetHeight - window.innerHeight;
    if (range <= 0) return 0;
    return clamp((window.scrollY - hero.offsetTop) / range, 0, 1);
  }

  function tick(now) {
    var dt = Math.min(100, now - (lastTick || now));
    lastTick = now;

    // Band one's one-time load ramp, handing over to scroll.
    if (loadK < 1) {
      if (!loadStart) loadStart = now;
      loadK = clamp((now - loadStart) / 900, 0, 1);
      loadK = loadK * loadK * (3 - 2 * loadK);
    }

    var k = 0.16;
    shown += (target - shown) * (1 - Math.pow(1 - k, dt / 16.667));

    var settled = Math.abs(target - shown) < 0.0005;
    if (settled) { shown = target; }

    updateScene(shown);
    updateCaptions(shown);

    if (settled && loadK >= 1) { rafId = null; lastTick = 0; }
    else rafId = requestAnimationFrame(tick);
  }

  function kick() { if (scrubOn && rafId === null && heroOnScreen) rafId = requestAnimationFrame(tick); }
  function onScroll() { target = heroProgress(); kick(); }

  if (hero && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      heroOnScreen = entries[0].isIntersecting;
      if (heroOnScreen) kick();
    }, { rootMargin: "10px" }).observe(hero);
  }

  /* ========================================== the five static-hero gates
     Character-for-character identical to the media query block in styles.css. */
  var GATES = [
    "(max-width:720px)",
    "(orientation:portrait) and (max-width:1024px)",
    "(orientation:portrait) and (pointer:coarse)",
    "(orientation:landscape) and (pointer:coarse) and (max-height:560px)",
    "(prefers-reduced-motion:reduce)"
  ];
  var scrubOn = false;

  function pinHero() {
    if (!scene) return;
    ["dRep", "dReal", "cal"].forEach(function (n) {
      sceneState[n] = 1;
      scene.style.setProperty("--" + n, 1);
    });
    scene.style.setProperty("--dRealO", 1);
    bands.forEach(function (b) {
      b.op = 1; b.k = 1;
      b.el.style.setProperty("--o", 1);
      b.el.style.setProperty("--k", 1);
    });
  }

  function enableScrub() {
    if (scrubOn) return;
    scrubOn = true;
    bands.forEach(function (b) { b.op = -1; b.k = -1; });
    sceneState.dRep = sceneState.dReal = sceneState.cal = -1;
    loadK = 0; loadStart = 0;
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    updateCaptions(heroProgress());
  }

  function disableScrub() {
    if (scrubOn) {
      scrubOn = false;
      removeEventListener("scroll", onScroll);
      if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
    }
    pinHero();   // unconditional: the first call happens before scrub was ever on
  }

  function applyHeroMode() {
    if (GATES.some(function (q) { return matchMedia(q).matches; })) disableScrub();
    else enableScrub();
  }

  var MQLS = GATES.map(function (q) { return matchMedia(q); });
  MQLS.forEach(function (m) {
    if (m.addEventListener) m.addEventListener("change", applyHeroMode);
    else if (m.addListener) m.addListener(applyHeroMode);
  });

  /* ======================================================= scroll reveals */
  var revealables = [].slice.call(document.querySelectorAll(".reveal, .rule"));
  if ("IntersectionObserver" in window) {
    var revObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        el.classList.add("in");
        revObs.unobserve(el);
        // Retire the stagger on a timer, not on transitionend: an element whose
        // own transition list omits opacity never fires one, and the delay would
        // then lag every hover on it forever.
        var d = parseFloat(el.style.transitionDelay) || 0;
        if (d) setTimeout(function () { el.style.transitionDelay = "0ms"; }, d + 1000);
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });

    revealables.forEach(function (el, i) {
      // Stagger siblings, then retire the delay so hovers never lag afterwards.
      var sibs = el.parentElement ? [].slice.call(el.parentElement.children).filter(function (n) {
        return n.classList && n.classList.contains("reveal");
      }) : [];
      var idx = sibs.indexOf(el);
      if (idx > 0) el.style.transitionDelay = Math.min(idx, 5) * 80 + "ms";
      revObs.observe(el);
    });
  } else {
    revealables.forEach(function (el) { el.classList.add("in"); });
  }

  /* ================================================ nav: aria-current */
  var navLinks = [].slice.call(document.querySelectorAll(".nav-links a"));
  var sections = navLinks.map(function (a) { return document.querySelector(a.getAttribute("href")); });
  if ("IntersectionObserver" in window && sections.every(Boolean)) {
    var current = null;
    var navObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var i = sections.indexOf(e.target);
        if (i < 0 || current === i) return;
        current = i;
        navLinks.forEach(function (a, n) {
          if (n === i) a.setAttribute("aria-current", "true");
          else a.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(function (s) { navObs.observe(s); });
  }

  /* ============================================ the one interactive moment
     Press and hold to run the confirmations. A worked example at typical
     Moroccan COD rates: 1,000 reported, 78% confirmed, 82% of those
     delivered, and the true cost per delivered order counting up as it goes. */
  (function () {
    var pad = document.getElementById("holdPad");
    if (!pad) return;

    var wrap = document.getElementById("hold");
    var fill = document.getElementById("holdFill");
    var label = document.getElementById("holdLabel");
    var done = document.getElementById("holdDone");
    var outRep = document.getElementById("outRep");
    var outConf = document.getElementById("outConf");
    var outDel = document.getElementById("outDel");
    var outCost = document.getElementById("outCost");
    var boxes = ["outConfBox", "outDelBox", "outCostBox"].map(function (id) { return document.getElementById(id); });

    var REPORTED = 1000, CONF_RATE = 0.78, DEL_RATE = 0.82, REPORTED_CPA = 1.5;
    var delivered = Math.round(REPORTED * CONF_RATE * DEL_RATE);   // 640
    var spend = REPORTED * REPORTED_CPA;

    var p = 0, holding = false, raf = null, last = 0, latched = false;
    var lastPaint = -1, lastAt = 0;
    var fmt = function (n) { return Math.round(n).toLocaleString("en-US"); };

    function paint(now) {
      // ~14Hz, and only when the rendered figures actually changed.
      if (now - lastAt < 70 && p !== 0 && p !== 1) return;
      var q = Math.round(p * 200) / 200;
      if (q === lastPaint) return;
      lastPaint = q; lastAt = now;

      var conf = REPORTED - (REPORTED - REPORTED * CONF_RATE) * clamp(p / 0.55, 0, 1);
      var del = REPORTED - (REPORTED - delivered) * clamp((p - 0.25) / 0.75, 0, 1);
      var cost = spend / Math.max(1, del);

      outConf.textContent = fmt(conf);
      outDel.textContent = fmt(del);
      outCost.textContent = "$" + cost.toFixed(2);
      wrap.style.setProperty("--hp", q);
      wrap.style.setProperty("--holdGlow", q);
    }

    function finish() {
      done.style.setProperty("--doneO", 1);
      label.textContent = "Run it again";
      boxes.forEach(function (b, i) {
        setTimeout(function () { b.classList.add("lit"); }, 120 * i);
      });
    }

    function unfinish() {
      done.style.setProperty("--doneO", 0);
      label.textContent = "Press and hold";
      boxes.forEach(function (b) { b.classList.remove("lit"); });
    }

    function loop(now) {
      var dt = Math.min(100, now - (last || now));
      last = now;
      var was = p;
      p = holding ? Math.min(1, p + dt / 1500) : Math.max(0, p - dt / 900);
      paint(now);
      if (p >= 1 && was < 1) { latched = true; finish(); }   // the result stays put once earned
      if (p < 1 && was >= 1) unfinish();
      var running = holding ? p < 1 : (p > 0 && !latched);
      if (running) raf = requestAnimationFrame(loop);
      else { raf = null; last = 0; }
    }

    function start(e) {
      if (e && e.type === "pointerdown" && e.button) return;
      if (reduced()) { p = 1; latched = true; paint(performance.now()); finish(); return; }
      if (latched) { latched = false; p = 0; unfinish(); paint(performance.now()); }  // "Run it again"
      holding = true;
      if (raf === null) raf = requestAnimationFrame(loop);
    }
    function stop() {
      holding = false;
      if (raf === null && p > 0) raf = requestAnimationFrame(loop);
    }

    pad.addEventListener("pointerdown", function (e) { pad.setPointerCapture && pad.setPointerCapture(e.pointerId); start(e); });
    pad.addEventListener("pointerup", stop);
    pad.addEventListener("pointercancel", stop);
    pad.addEventListener("pointerleave", stop);
    pad.addEventListener("keydown", function (e) {
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); start(); }
    });
    pad.addEventListener("keyup", function (e) {
      if (e.key === " " || e.key === "Enter") stop();
    });
    pad.addEventListener("click", function (e) { e.preventDefault(); });

    // Reduced motion gets the finished state with no hold required.
    function pinHold() { p = 1; holding = false; latched = true; paint(performance.now()); finish(); }
    function unpinHold() {
      if (raf !== null) { cancelAnimationFrame(raf); raf = null; }
      p = 0; lastPaint = -1; latched = false;
      outConf.textContent = fmt(REPORTED);
      outDel.textContent = fmt(REPORTED);
      outCost.textContent = "$" + REPORTED_CPA.toFixed(2);
      wrap.style.setProperty("--hp", 0);
      wrap.style.setProperty("--holdGlow", 0);
      unfinish();
    }
    if (reduced()) pinHold();
    window._holdPin = pinHold;
    window._holdUnpin = unpinHold;
    outRep.textContent = fmt(REPORTED);
  })();

  /* ============================================ reduced motion, both ways */
  var rmq = matchMedia("(prefers-reduced-motion:reduce)");
  var onReducedChange = function (e) {
    if (e.matches) {
      disableScrub();
      revealables.forEach(function (el) { el.classList.add("in"); el.style.transitionDelay = "0ms"; });
      if (window._holdPin) window._holdPin();
    } else {
      applyHeroMode();
      if (window._holdUnpin) window._holdUnpin();
    }
  };
  if (rmq.addEventListener) rmq.addEventListener("change", onReducedChange);
  else if (rmq.addListener) rmq.addListener(onReducedChange);

  /* ============================================ pause everything off-tab */
  document.addEventListener("visibilitychange", function () {
    document.body.classList.toggle("paused", document.hidden);
  });

  /* ==================================================== the contact form */
  (function () {
    var form = document.getElementById("contactForm");
    if (!form) return;
    var doneEl = document.getElementById("formDone");

    function fieldOf(input) { return input.closest(".field"); }
    function showErr(input, id, show) {
      var err = document.getElementById(id);
      var f = fieldOf(input);
      if (err) err.hidden = !show;
      if (f) f.classList.toggle("bad", show);
      input.setAttribute("aria-invalid", show ? "true" : "false");
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = form.elements.name, email = form.elements.email, msg = form.elements.message;
      var ok = true;

      var nameBad = !name.value.trim();
      showErr(name, "err-name", nameBad); if (nameBad) ok = false;

      var emailBad = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
      showErr(email, "err-email", emailBad); if (emailBad) ok = false;

      var msgBad = msg.value.trim().length < 4;
      showErr(msg, "err-message", msgBad); if (msgBad) ok = false;

      if (!ok) {
        var first = form.querySelector('.field.bad input, .field.bad textarea');
        if (first) first.focus();
        return;
      }

      var body = [
        "Name: " + name.value.trim(),
        "Email: " + email.value.trim(),
        "Store or brand: " + (form.elements.brand.value.trim() || "not given"),
        "Monthly ad spend: " + (form.elements.spend.value || "not given"),
        "",
        msg.value.trim()
      ].join("\n");

      window.location.href = "mailto:" + CONTACT_EMAIL +
        "?subject=" + encodeURIComponent("Ad account enquiry from " + name.value.trim()) +
        "&body=" + encodeURIComponent(body);

      doneEl.hidden = false;
    });
  })();

  /* ========================================================== small stuff */
  var yr = document.getElementById("year");
  if (yr) yr.textContent = new Date().getFullYear();

  applyHeroMode();
})();
