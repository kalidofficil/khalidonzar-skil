/* ==========================================================================
   Khalid Onzar — portfolio interactions
   Plain ES2019, no dependencies, no build step.
   ========================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── Sticky header state ───────────────────────────────────────────────── */
  var head = document.getElementById("siteHead");
  var onScroll = function () {
    head.classList.toggle("is-stuck", window.scrollY > 12);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ── Mobile navigation ─────────────────────────────────────────────────── */
  var toggle = document.getElementById("navToggle");
  var nav = document.getElementById("primaryNav");

  var closeNav = function () {
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  };

  toggle.addEventListener("click", function () {
    var open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
  });

  nav.addEventListener("click", function (e) {
    if (e.target.closest("a")) closeNav();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeNav();
  });

  /* ── Scroll spy: mark the section the reader is in ─────────────────────── */
  var navLinks = Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]'));
  var sections = navLinks
    .map(function (a) { return document.querySelector(a.getAttribute("href")); })
    .filter(Boolean);

  if ("IntersectionObserver" in window && sections.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) {
          var isCurrent = a.getAttribute("href") === "#" + entry.target.id;
          if (isCurrent) a.setAttribute("aria-current", "true");
          else a.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ── Reveal on scroll, staggered within each group ─────────────────────── */
  var revealables = Array.prototype.slice.call(document.querySelectorAll(".reveal"));

  revealables.forEach(function (el) {
    var step = el.getAttribute("data-reveal-step");
    if (step) { el.style.setProperty("--reveal-i", step); return; }
    var siblings = Array.prototype.slice.call(el.parentNode.children);
    el.style.setProperty("--reveal-i", String(siblings.indexOf(el) % 6));
  });

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealables.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var revealer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        obs.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });
    revealables.forEach(function (el) { revealer.observe(el); });
  }

  /* ── Count-up on the KPI row ───────────────────────────────────────────── */
  var counters = Array.prototype.slice.call(document.querySelectorAll("[data-count-to]"));

  var renderCount = function (el, value) {
    var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
    var prefix = el.getAttribute("data-prefix") || "";
    var suffix = el.getAttribute("data-suffix") || "";
    el.textContent = prefix + value.toFixed(decimals) + suffix;
  };

  var countUp = function (el) {
    var target = parseFloat(el.getAttribute("data-count-to"));
    if (isNaN(target)) return;
    var duration = 1100;
    var start = null;
    var done = false;
    var settle = function () {
      if (done) return;
      done = true;
      renderCount(el, target);
    };
    var frame = function (now) {
      if (done) return;
      if (start === null) start = now;
      var t = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - t, 3);
      renderCount(el, target * eased);
      if (t < 1) requestAnimationFrame(frame);
      else settle();
    };
    requestAnimationFrame(frame);
    setTimeout(settle, duration + 400);
  };

  if (reduceMotion || !("IntersectionObserver" in window)) {
    counters.forEach(function (el) { renderCount(el, parseFloat(el.getAttribute("data-count-to"))); });
  } else {
    var countObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        countUp(entry.target);
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { countObserver.observe(el); });
  }

  /* ── ROAS chart ────────────────────────────────────────────────────────────
     Single series (blended ROAS) against a neutral, directly-labelled target
     rule. One measure, one axis. The series colour is a validated step: it sits
     inside the light-mode lightness band, clears the chroma floor, and holds
     contrast against the paper ground.
     REPLACE: swap `series` for your own monthly figures.
     ───────────────────────────────────────────────────────────────────────── */
  var series = [
    { month: "Sep 25", roas: 2.6 }, { month: "Oct 25", roas: 2.8 },
    { month: "Nov 25", roas: 2.7 }, { month: "Dec 25", roas: 3.1 },
    { month: "Jan 26", roas: 3.3 }, { month: "Feb 26", roas: 3.2 },
    { month: "Mar 26", roas: 3.5 }, { month: "Apr 26", roas: 3.8 },
    { month: "May 26", roas: 3.7 }, { month: "Jun 26", roas: 4.0 },
    { month: "Jul 26", roas: 4.3 }, { month: "Aug 26", roas: 4.6 }
  ];
  var TARGET = 3.0;

  var svg = document.getElementById("roasChart");
  var wrap = svg ? svg.parentNode : null;
  var tooltip = document.getElementById("chartTooltip");
  var NS = "http://www.w3.org/2000/svg";

  var el = function (name, attrs) {
    var node = document.createElementNS(NS, name);
    Object.keys(attrs || {}).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    return node;
  };

  var points = [];

  function drawChart() {
    if (!svg) return;
    var w = Math.max(svg.clientWidth || wrap.clientWidth, 520);
    var h = svg.clientHeight || 300;
    var pad = { t: 26, r: 96, b: 34, l: 40 };

    svg.setAttribute("viewBox", "0 0 " + w + " " + h);

    /* Clear everything but the accessible <title> and <desc> */
    Array.prototype.slice.call(svg.children).forEach(function (node) {
      var keep = node.nodeName === "title" || node.nodeName === "desc";
      if (!keep) svg.removeChild(node);
    });

    var lo = 2.0, hi = 5.0;
    var x = function (i) { return pad.l + (i / (series.length - 1)) * (w - pad.l - pad.r); };
    var y = function (v) { return pad.t + (1 - (v - lo) / (hi - lo)) * (h - pad.t - pad.b); };

    var defs = el("defs");
    var grad = el("linearGradient", { id: "roasFill", x1: "0", y1: "0", x2: "0", y2: "1" });
    grad.appendChild(el("stop", { offset: "0%", "stop-color": "#0B8757", "stop-opacity": "0.22" }));
    grad.appendChild(el("stop", { offset: "100%", "stop-color": "#0B8757", "stop-opacity": "0" }));
    defs.appendChild(grad);
    svg.appendChild(defs);

    /* Recessive grid + y axis */
    [2, 3, 4, 5].forEach(function (v) {
      svg.appendChild(el("line", {
        class: "grid-line", x1: pad.l, x2: w - pad.r, y1: y(v), y2: y(v)
      }));
      var label = el("text", { class: "axis-text", x: 0, y: y(v) + 3.5 });
      label.textContent = v.toFixed(1) + "×";
      svg.appendChild(label);
    });

    /* x axis — every other month, so labels never collide */
    series.forEach(function (d, i) {
      if (i % 2 !== 0 && i !== series.length - 1) return;
      var label = el("text", { class: "axis-text", x: x(i), y: h - 8, "text-anchor": "middle" });
      label.textContent = d.month;
      svg.appendChild(label);
    });

    /* Target rule, directly labelled */
    svg.appendChild(el("line", { class: "target-line", x1: pad.l, x2: w - pad.r, y1: y(TARGET), y2: y(TARGET) }));
    var targetText = el("text", { class: "target-text", x: w - pad.r + 6, y: y(TARGET) + 3.5 });
    targetText.textContent = "Target 3.0×";
    svg.appendChild(targetText);

    /* Area + line */
    var linePath = series.map(function (d, i) { return (i ? "L" : "M") + x(i) + " " + y(d.roas); }).join(" ");
    svg.appendChild(el("path", {
      class: "area",
      d: linePath + " L" + x(series.length - 1) + " " + y(lo) + " L" + x(0) + " " + y(lo) + " Z"
    }));
    var line = el("path", { class: "line", d: linePath });
    svg.appendChild(line);

    if (!reduceMotion && typeof line.getTotalLength === "function") {
      var len = line.getTotalLength();
      line.style.strokeDasharray = len;
      line.style.strokeDashoffset = len;
      line.getBoundingClientRect();
      line.style.transition = "stroke-dashoffset 1.4s cubic-bezier(0.22,0.61,0.36,1)";
      line.style.strokeDashoffset = "0";
    }

    /* Crosshair, drawn under the markers */
    var crosshair = el("line", { class: "crosshair", y1: pad.t, y2: h - pad.b, x1: 0, x2: 0 });
    svg.appendChild(crosshair);

    /* Emphasised endpoint */
    var lastIndex = series.length - 1;
    svg.appendChild(el("circle", { class: "marker marker-end", cx: x(lastIndex), cy: y(series[lastIndex].roas), r: 5 }));
    var endLabel = el("text", {
      class: "end-label", x: x(lastIndex), y: y(series[lastIndex].roas) - 14, "text-anchor": "end"
    });
    endLabel.textContent = series[lastIndex].roas.toFixed(1) + "×";
    svg.appendChild(endLabel);

    /* Hover layer — hit targets far wider than the marks */
    points = [];
    var band = (w - pad.l - pad.r) / (series.length - 1);
    series.forEach(function (d, i) {
      var hit = el("rect", {
        class: "hit", x: x(i) - band / 2, y: pad.t, width: band, height: h - pad.t - pad.b
      });
      var marker = el("circle", { class: "marker", cx: x(i), cy: y(d.roas), r: 4, opacity: 0 });
      svg.appendChild(marker);
      svg.appendChild(hit);
      points.push({ hit: hit, marker: marker, cx: x(i), cy: y(d.roas), datum: d });
    });

    points.forEach(function (p) {
      var enter = function () {
        points.forEach(function (q) { q.marker.setAttribute("opacity", "0"); });
        p.marker.setAttribute("opacity", "1");
        crosshair.setAttribute("x1", p.cx);
        crosshair.setAttribute("x2", p.cx);
        crosshair.classList.add("is-on");
        tooltip.hidden = false;
        tooltip.innerHTML = p.datum.month + " &nbsp;<b>" + p.datum.roas.toFixed(1) + "×</b>";
        var scaleX = (svg.clientWidth / w) || 1;
        var scaleY = (svg.clientHeight / h) || 1;
        tooltip.style.left = (p.cx * scaleX) + "px";
        tooltip.style.top = (p.cy * scaleY) + "px";
      };
      var leave = function () {
        p.marker.setAttribute("opacity", "0");
        crosshair.classList.remove("is-on");
        tooltip.hidden = true;
      };
      p.hit.addEventListener("mouseenter", enter);
      p.hit.addEventListener("mouseleave", leave);
      p.hit.addEventListener("touchstart", enter, { passive: true });
      p.hit.addEventListener("touchend", leave);
    });
  }

  if (svg) {
    drawChart();
    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(drawChart, 180);
    });
  }

  /* ── Table view of the same data ───────────────────────────────────────── */
  var tableBody = document.getElementById("roasTableBody");
  if (tableBody) {
    series.forEach(function (d) {
      var row = document.createElement("tr");
      row.innerHTML = "<th scope=\"row\">" + d.month + "</th><td>" + d.roas.toFixed(1) +
                      "×</td><td>" + TARGET.toFixed(1) + "×</td>";
      tableBody.appendChild(row);
    });
  }

  var tableToggle = document.getElementById("tableToggle");
  var tableWrap = document.getElementById("roasTable");
  if (tableToggle && tableWrap) {
    tableToggle.addEventListener("click", function () {
      var open = tableWrap.hidden;
      tableWrap.hidden = !open;
      tableToggle.setAttribute("aria-expanded", String(open));
      tableToggle.textContent = open ? "Hide table" : "View as table";
    });
  }

  /* ── Contact form ──────────────────────────────────────────────────────────
     Posts to data-endpoint when one is configured; otherwise it opens a
     pre-filled email so the form works the moment the site goes live.
     ───────────────────────────────────────────────────────────────────────── */
  var form = document.getElementById("contactForm");
  var status = document.getElementById("formStatus");
  var CONTACT_EMAIL = "hello@khalidonzar.com"; /* REPLACE: your inbox */

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var fields = Array.prototype.slice.call(form.querySelectorAll("[required]"));
      var firstInvalid = null;
      fields.forEach(function (field) {
        var bad = !field.value.trim() || (field.type === "email" && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(field.value));
        field.classList.toggle("is-invalid", bad);
        if (bad && !firstInvalid) firstInvalid = field;
      });

      if (firstInvalid) {
        status.className = "form-status is-error";
        status.textContent = "Add your name, a valid email and a short note.";
        firstInvalid.focus();
        return;
      }

      var data = new FormData(form);
      var endpoint = form.getAttribute("data-endpoint");

      if (endpoint) {
        status.className = "form-status";
        status.textContent = "Sending…";
        fetch(endpoint, { method: "POST", body: data, headers: { Accept: "application/json" } })
          .then(function (res) {
            if (!res.ok) throw new Error("Request failed");
            form.reset();
            status.className = "form-status is-ok";
            status.textContent = "Sent. I'll reply within two working days.";
          })
          .catch(function () {
            status.className = "form-status is-error";
            status.textContent = "That didn't send. Email " + CONTACT_EMAIL + " instead.";
          });
        return;
      }

      var body = "Name: " + data.get("name") + "\n" +
                 "Email: " + data.get("email") + "\n" +
                 "Monthly ad spend: " + data.get("budget") + "\n\n" +
                 data.get("message");
      window.location.href = "mailto:" + CONTACT_EMAIL +
        "?subject=" + encodeURIComponent("Paid media enquiry — " + data.get("name")) +
        "&body=" + encodeURIComponent(body);
      status.className = "form-status is-ok";
      status.textContent = "Opening your email client…";
    });
  }

  /* ── Placeholder links stay inert until real URLs are added ────────────── */
  Array.prototype.slice.call(document.querySelectorAll("[data-placeholder-link]"))
    .forEach(function (link) {
      link.addEventListener("click", function (e) { e.preventDefault(); });
    });

  /* ── Footer year ───────────────────────────────────────────────────────── */
  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
