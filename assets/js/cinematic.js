/* ==========================================================================
   Khalid Ounzar — cinematic portfolio controller
   No dependencies. Three cooperating pieces:
     1. Journey   — pinned stages whose environmental footage is scroll-linked
     2. Speaker   — the two speaking scenes, which play at normal speed, always
     3. Page      — nav state, reveals, contact form
   Reduced motion replaces (1) with a stack of poster frames and real copy.
   ========================================================================== */
(function () {
  "use strict";

  var CONTACT_EMAIL = "ounzar.khalid1999@gmail.com";

  document.documentElement.classList.add("js");

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var smallScreen = window.matchMedia("(max-width: 900px)");
  var coarse = window.matchMedia("(hover: none) and (pointer: coarse)");
  var RM = reduce.matches;
  if (RM) document.documentElement.classList.add("rm");

  /* Prefer H.264: universal, and hardware-decoded on the devices that matter.
     Fall back to VP9 for builds shipped without the proprietary codecs. */
  var MP4_OK = (function () {
    var t = document.createElement("video");
    return t.canPlayType('video/mp4; codecs="avc1.640028"') !== "" ||
           t.canPlayType('video/mp4; codecs="avc1.42E01E"') !== "";
  })();

  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var smooth = function (t) { return t * t * (3 - 2 * t); };

  /* ── 1. the journey ──────────────────────────────────────────────────── */

  function Chapter(video, journey) {
    this.v = video;
    this.journey = journey;
    this.from = parseFloat(video.dataset.from);
    this.to = parseFloat(video.dataset.to);
    this.join = video.dataset.join || "fade";
    this.speaks = video.dataset.speak || null;
    this.loaded = false;
    this.time = 0;          /* the smoothed playhead we drive */
    this.target = 0;
    this.played = false;    /* speaking chapters fire once */
    var h = video.dataset.hold;
    this.hold = h ? h.split(",").map(parseFloat) : null;
  }

  Chapter.prototype.poster = function () {
    if (this.v.dataset.poster && !this.v.poster) this.v.poster = this.v.dataset.poster;
  };
  Chapter.prototype.load = function () {
    this.poster();
    if (this.loaded) return;
    this.loaded = true;
    var d = this.v.dataset;
    var src = MP4_OK ? ((smallScreen.matches ? d.srcM : d.srcD) || d.srcD) : ((smallScreen.matches && d.srcWm) ? d.srcWm : (d.srcW || d.srcD));
    this.v.src = src;
    this.v.load();
  };

  /* scroll position inside the chapter -> position in the footage */
  Chapter.prototype.mediaFraction = function (local) {
    var m = local;
    if (this.hold) {
      var h0 = this.hold[0], h1 = this.hold[1], live = 1 - (h1 - h0);
      if (live <= 0) return 0;
      if (local <= h0) m = local / live;
      else if (local < h1) m = h0 / live;
      else m = (local - (h1 - h0)) / live;
    }
    m = clamp(m, 0, 1);
    /* a partial ease so each camera move accelerates and settles */
    return lerp(m, smooth(m), 0.4);
  };

  function Journey(section) {
    this.el = section;
    this.videos = Array.prototype.slice.call(section.querySelectorAll("video[data-from]"));
    this.chapters = this.videos.map(function (v) { return new Chapter(v, this); }, this);
    this.beats = Array.prototype.slice.call(section.querySelectorAll(".beat"));
    this.steps = Array.prototype.slice.call(section.querySelectorAll(".ladder li"));
    this.portal = section.querySelector(".portal");
    this.wipe = section.querySelector(".wipe");
    this.active = -1;
    this.p = 0;
    this.lastP = 0;
    this.visible = false;
  }

  Journey.prototype.progress = function () {
    var r = this.el.getBoundingClientRect();
    var span = this.el.offsetHeight - window.innerHeight;
    if (span <= 0) return 0;
    return clamp(-r.top / span, 0, 1);
  };

  Journey.prototype.setActive = function (i) {
    if (i === this.active || i < 0) return;
    var prev = this.active;
    this.active = i;
    var ch = this.chapters[i];

    for (var k = 0; k < this.chapters.length; k++) {
      var c = this.chapters[k];
      c.v.classList.toggle("is-live", k === i);
      if (k !== i && !c.v.paused) c.v.pause();
    }
    ch.load();
    if (this.chapters[i + 1]) this.chapters[i + 1].load();

    /* an architectural wipe only where the two clips do not frame-match */
    if (prev > -1 && ch.join === "wipe" && this.wipe && !RM && this.wipe.animate) {
      this.wipe.animate(
        [
          { transform: "translateX(-104%)", opacity: 1 },
          { transform: "translateX(0%)", opacity: 1 },
          { transform: "translateX(104%)", opacity: 1 }
        ],
        { duration: 700, easing: "cubic-bezier(.65,0,.35,1)" }
      );
    }
    if (ch.join === "none") ch.v.style.transition = "none";

    if (ch.speaks) this.enterSpeaking(ch);

    /* leaving a speaking chapter silences it immediately */
    if (prev > -1) {
      var was = this.chapters[prev];
      if (was.speaks && window.KO.speakers[was.speaks]) window.KO.speakers[was.speaks].stop();
    }
  };

  Journey.prototype.enterSpeaking = function (ch) {
    var sp = window.KO.speakers[ch.speaks];
    if (!sp) return;
    sp.show();
    if (!ch.played && this.p >= this.lastP) { ch.played = true; sp.autoplay(); }
  };

  Journey.prototype.tick = function () {
    if (!this.visible) return;
    var p = this.progress();
    this.p = p;

    /* which chapter owns this scroll position */
    var idx = 0;
    for (var i = 0; i < this.chapters.length; i++) {
      if (p >= this.chapters[i].from) idx = i;
    }
    this.setActive(idx);

    var ch = this.chapters[idx];
    if (!ch.speaks) {
      var local = clamp((p - ch.from) / Math.max(ch.to - ch.from, 1e-6), 0, 1);
      var d = ch.v.duration;
      if (d && isFinite(d)) {
        ch.target = ch.mediaFraction(local) * (d - 1 / 30);
        ch.time = lerp(ch.time, ch.target, 0.22);
        if (!ch.v.paused) ch.v.pause();
        if (Math.abs(ch.v.currentTime - ch.time) > 1 / 40 && ch.v.readyState >= 2) {
          try { ch.v.currentTime = ch.time; } catch (e) { /* seek races are harmless */ }
        }
      }
    }

    for (var b = 0; b < this.beats.length; b++) {
      var el = this.beats[b];
      var on = p >= parseFloat(el.dataset.in) && p <= parseFloat(el.dataset.out);
      el.classList.toggle("is-on", on);
    }
    for (var s = 0; s < this.steps.length; s++) {
      var st = this.steps[s];
      st.classList.toggle("is-on", p >= parseFloat(st.dataset.at));
    }
    this.lastP = p;
  };

  /* ── 2. the speaking scenes ──────────────────────────────────────────── */

  function Speaker(root) {
    var self = this;
    this.root = root;
    this.v = document.querySelector(root.dataset.video);
    this.box = root.dataset.captions ? document.querySelector(root.dataset.captions) : null;
    this.state = root.querySelector(".vstate");
    this.gate = root.classList.contains("gate") ? root : root.querySelector(".gate");
    this.cues = [];
    this.soundBlocked = false;

    this.v.addEventListener("loadedmetadata", function () { self.v.classList.add("is-live"); });
    this.v.addEventListener("error", function () {
      var portal = root.querySelector(".portal");
      if (portal) portal.classList.add("has-failed");
      self.say("Video unavailable");
    });
    this.v.addEventListener("play", function () { self.say("Playing"); self.sync("play"); });
    this.v.addEventListener("pause", function () { if (!self.v.ended) { self.say("Paused"); self.sync("pause"); } });
    this.v.addEventListener("ended", function () {
      self.say("Finished"); self.sync("ended"); self.caption("");
      if (self.onEnd) self.onEnd();
    });
    this.v.addEventListener("timeupdate", function () { self.paint(); });

    /* captions are read from the real <track>, then painted into a live region
       so they can be styled and still reach assistive technology */
    var t = this.v.textTracks && this.v.textTracks[0];
    if (t) {
      t.mode = "hidden";
      var grab = function () {
        self.cues = [];
        var list = t.cues; if (!list) return;
        for (var i = 0; i < list.length; i++) self.cues.push(list[i]);
      };
      this.v.addEventListener("loadeddata", grab);
      setTimeout(grab, 800);
    }

    this.key = root.dataset.speaker;
    document.addEventListener("click", function (e) {
      var b = e.target.closest("[data-act]"); if (!b) return;
      var owner = b.closest("[data-speaker]");
      var mine = owner === root || b.dataset.speakerFor === self.key;
      if (!mine) return;
      var a = b.dataset.act;
      if (a === "play") self.play();
      else if (a === "pause") self.v.pause();
      else if (a === "replay") { self.v.currentTime = 0; self.play(); }
      else if (a === "sound") self.unmute();
      else if (a === "captions") self.toggleCaptions(b);
    });
  }

  Speaker.prototype.say = function (s) { if (this.state) this.state.textContent = s; };
  Speaker.prototype.sync = function (st) {
    var p = this.root.querySelector('[data-act="play"]'), q = this.root.querySelector('[data-act="pause"]');
    if (p) p.hidden = st === "play";
    if (q) q.hidden = st !== "play";
  };
  Speaker.prototype.caption = function (s) { if (this.box && this.capOn !== false) this.box.textContent = s; };
  Speaker.prototype.toggleCaptions = function (btn) {
    this.capOn = this.capOn === false;
    btn.setAttribute("aria-pressed", String(this.capOn !== false));
    if (this.capOn === false) this.box.textContent = "";
  };
  Speaker.prototype.paint = function () {
    if (!this.cues.length || this.capOn === false) return;
    var t = this.v.currentTime, out = "";
    for (var i = 0; i < this.cues.length; i++) {
      if (t >= this.cues[i].startTime && t <= this.cues[i].endTime) { out = this.cues[i].text; break; }
    }
    if (this.box.textContent !== out) this.box.textContent = out;
  };
  Speaker.prototype.play = function () {
    var self = this;
    this.v.classList.add("is-live");
    var pr = this.v.play();
    if (pr && pr.catch) pr.catch(function () {
      /* the browser refused sound without a gesture — never fail silently */
      self.v.muted = true;
      self.soundBlocked = true;
      self.showSound(true);
      var again = self.v.play();
      if (again && again.catch) again.catch(function () { self.say("Press play"); });
    });
  };
  Speaker.prototype.autoplay = function () {
    this.v.muted = false;
    this.play();
  };
  Speaker.prototype.unmute = function () {
    this.v.muted = false; this.soundBlocked = false; this.showSound(false);
    if (this.v.paused) this.play();
  };
  Speaker.prototype.showSound = function (on) {
    var b = this.root.querySelector('[data-act="sound"]'); if (b) b.hidden = !on;
  };
  Speaker.prototype.show = function () {
    if (!this.gate) return;
    this.gate.classList.add("is-on");
    var p = this.gate.closest(".portal"); if (p) p.classList.add("has-gate");
  };
  Speaker.prototype.stop = function () {
    if (!this.v.paused) this.v.pause();
    this.caption("");
    if (this.gate) {
      this.gate.classList.remove("is-on");
      var p = this.gate.closest(".portal"); if (p) p.classList.remove("has-gate");
    }
  };

  /* ── 3. page wiring ──────────────────────────────────────────────────── */

  window.KO = { speakers: {} };

  document.querySelectorAll("[data-speaker]").forEach(function (el) {
    if (document.querySelector(el.dataset.video)) {
      window.KO.speakers[el.dataset.speaker] = new Speaker(el);
    }
  });

  var journeys = Array.prototype.slice.call(document.querySelectorAll("[data-journey]")).map(function (s) {
    return new Journey(s);
  });

  if (!RM && journeys.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        journeys.forEach(function (j) { if (j.el === e.target) j.visible = e.isIntersecting; });
      });
    }, { rootMargin: "-6% 0px -6% 0px" });
    journeys.forEach(function (j) { io.observe(j.el); });

    var rail = document.querySelector(".rail"), railBar = rail && rail.querySelector("i");
    var skipbar = document.querySelector(".skipbar");
    var ticking = false;
    var loop = function () {
      ticking = false;
      var holding = false, best = 0, mid = window.innerHeight / 2;
      journeys.forEach(function (j) {
        j.tick();
        var r = j.el.getBoundingClientRect();
        if (r.top <= mid && r.bottom >= mid) { holding = true; best = j.p; }
      });
      var anyVisible = holding;
      if (rail) {
        rail.classList.toggle("is-on", anyVisible);
        if (railBar) railBar.style.height = (best * 100).toFixed(1) + "%";
      }
      if (skipbar) skipbar.classList.toggle("is-on", anyVisible);
    };
    var request = function () { if (!ticking) { ticking = true; requestAnimationFrame(loop); } };
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    /* keep easing toward the target even when the wheel stops */
    (function idle() { loop(); requestAnimationFrame(idle); })();
  } else if (RM) {
    /* reduced motion: posters only, nothing seeks, nothing autoplays */
    document.querySelectorAll("video[data-from]").forEach(function (v) {
      if (v.dataset.poster) v.poster = v.dataset.poster;   /* the still IS the scene here */
      v.classList.add("is-live");
      v.removeAttribute("autoplay");
      v.preload = "none";
    });
  }

  /* nav ground + current section */
  var nav = document.querySelector(".nav");
  var links = Array.prototype.slice.call(document.querySelectorAll(".nav-links a[href^='#']"));
  var sections = Array.prototype.slice.call(document.querySelectorAll("main > section[id]"));

  function paintNav() {
    if (!sections.length) return;
    var line = 34, under = null;
    for (var i = 0; i < sections.length; i++) {
      var r = sections[i].getBoundingClientRect();
      if (r.top <= line && r.bottom > line) under = sections[i];
    }
    if (!under) return;
    if (nav) nav.classList.toggle("is-paper", under.classList.contains("paper"));
    for (var k = 0; k < links.length; k++) {
      if (links[k].getAttribute("href") === "#" + under.id) links[k].setAttribute("aria-current", "true");
      else links[k].removeAttribute("aria-current");
    }
  }
  window.addEventListener("scroll", paintNav, { passive: true });
  window.addEventListener("resize", paintNav);
  paintNav();

  /* editorial reveals */
  var riseIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); riseIO.unobserve(e.target); } });
  }, { rootMargin: "0px 0px -12%" });
  document.querySelectorAll(".rise").forEach(function (el) { riseIO.observe(el); });

  /* skip cinematic — always available, keyboard reachable */
  document.querySelectorAll("[data-skip]").forEach(function (b) {
    b.addEventListener("click", function () {
      Object.keys(window.KO.speakers).forEach(function (k) { window.KO.speakers[k].stop(); });
      var t = document.querySelector(b.dataset.skip || "#work");
      if (t) t.scrollIntoView({ behavior: RM ? "auto" : "smooth", block: "start" });
    });
  });

  /* contact */
  var copyBtn = document.querySelector("[data-copy]");
  if (copyBtn) {
    copyBtn.addEventListener("click", function () {
      var done = function () {
        var old = copyBtn.textContent; copyBtn.textContent = "Copied";
        setTimeout(function () { copyBtn.textContent = old; }, 1800);
      };
      if (navigator.clipboard) navigator.clipboard.writeText(CONTACT_EMAIL).then(done, done);
      else done();
    });
  }

  var form = document.getElementById("enquiry");
  if (form) {
    var status = document.getElementById("formStatus");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var d = new FormData(form);
      var body =
        "Name: " + d.get("name") + "\n" +
        "Email: " + d.get("email") + "\n" +
        "Monthly ad spend: " + (d.get("budget") || "not given") + "\n\n" +
        d.get("message");
      window.location.href =
        "mailto:" + CONTACT_EMAIL +
        "?subject=" + encodeURIComponent("Portfolio enquiry — " + d.get("name")) +
        "&body=" + encodeURIComponent(body);
      status.className = "f-status ok";
      status.textContent = "Opening your email app with the message ready to send.";
    });
  }

  /* a video that never arrives must not leave a hole in the page */
  document.querySelectorAll(".portal video").forEach(function (v) {
    v.addEventListener("error", function () {
      var p = v.closest(".portal"); if (p) p.classList.add("has-failed");
    });
  });

})();
