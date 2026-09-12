/* ==========================================================================
   Khalid Ounzar — Case Studies controller
   --------------------------------------------------------------------------
   Extends the existing system rather than replacing any of it:

     · per-frame work registers into v3.js's single tick() via window.__csFrame
     · tilt is capped at the same 4°/2° the grid cards already use
     · the unpack reuses the stack's enter/cover progress maths
     · entrances go through the existing .rise IntersectionObserver
     · reduced motion rides the existing html.rm branch

   Routing is hash-based (#/ecommerce/product-01). The site is one static
   document on GitHub Pages with no server to rewrite paths, so real paths
   would need six duplicated HTML files with rewritten relative asset URLs.
   A hash reloads, shares and deep-links correctly on any host, and — the
   reason it matters here — never swaps the document, which is what lets the
   product card physically survive its flight into the case-study hero.
   ========================================================================== */

(function () {
  "use strict";

  var D = window.CASE_STUDIES;
  var root = document.getElementById("case-studies");
  if (!D || !root) return;

  var RM = document.documentElement.classList.contains("rm");
  var small = matchMedia("(max-width: 900px)");
  var TILT = small.matches ? 2 : 4;          /* same cap as the existing grid cards */
  var DEPTH = small.matches ? 120 : 420;     /* stack depth, shallower on a phone */

  var $ = function (sel, el) { return (el || root).querySelector(sel); };
  var $$ = function (sel, el) { return Array.prototype.slice.call((el || root).querySelectorAll(sel)); };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  /* offsetTop is measured against the nearest positioned ancestor, and .cs is
     position:relative — so it is not a document offset. */
  function sectionTop() {
    return Math.max(0, root.getBoundingClientRect().top + scrollY - 8);
  }
  function toSection() { scrollTo({ top: sectionTop(), behavior: "instant" }); }

  /* ── formatting ────────────────────────────────────────────────────────── */
  var nf = new Intl.NumberFormat("en-US");
  function num(v) { return nf.format(v); }
  var mf = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  function money(v) { return "$" + mf.format(v); }
  function compact(v) { return v >= 1e6 ? (v / 1e6).toFixed(1) + "M" : v >= 1000 ? Math.round(v / 1000) + "K" : String(v); }
  function pct(v) { return v.toFixed(2) + "%"; }
  function ctrLabel(c) { return c.kind === "link" ? "Link CTR" : "CTR (all clicks)"; }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ── views ─────────────────────────────────────────────────────────────── */
  var cats    = $("[data-cs-cats]");
  var world   = $("[data-cs-world]");
  var deck    = $("[data-cs-deck]");
  var track   = $("[data-cs-track]");
  var study   = $("[data-cs-study]");
  var concepts= $("[data-cs-concepts]");
  var totalsEl= $("[data-cs-totals]");

  /* ── the six cards ─────────────────────────────────────────────────────── */
  function plate(p) {
    if (p.image && p.image.src) {
      return '<div class="cs-plate"><span class="cs-n">' + p.n + '</span>' +
             '<img src="' + esc(p.image.src) + '" alt="' + esc(p.image.alt || p.nameEn) +
             '" loading="lazy" decoding="async"></div>';
    }
    /* Reserved slot. Deliberately reads as an empty frame — never a stand-in
       photograph, and the card geometry is already final so dropping the real
       image in later shifts nothing. */
    return '<div class="cs-plate is-empty" data-slot="' + p.image.slot + '">' +
           '<span class="cs-n">' + p.n + '</span>' +
           '<span class="cs-slotn">' + p.image.slot + '</span>' +
           '<span class="cs-slotl">Product image</span></div>';
  }

  function cardHTML(p) {
    var m = p.metrics;
    var primary = m
      ? '<div class="cs-primary">' +
          '<span><b class="tnum">' + num(m.purchases) + '</b><s>Purchases</s></span>' +
          '<span><b class="tnum">' + money(m.cpa) + '</b><s>Cost / purchase</s></span>' +
        '</div>'
      : '<p class="cs-pendingnote">' + esc(p.pending || "Performance data not yet added.") + '</p>';

    var more = "";
    if (m) {
      var rows = [
        ["Spend", money(m.spend)],
        ["Impressions", num(m.impressions)],
        [ctrLabel(m.ctr), pct(m.ctr.value)],
        m.hookRate != null ? ["Hook rate", pct(m.hookRate)] : ["CPM", money(m.cpm)]
      ];
      more = '<dl class="cs-more">' + rows.map(function (r) {
        return "<div><dt>" + esc(r[0]) + '</dt><dd class="tnum">' + esc(r[1]) + "</dd></div>";
      }).join("") + "</dl>";
    }

    return '<button class="cs-card" type="button" data-product="' + p.id + '" ' +
           'aria-label="Open case study: ' + esc(p.nameEn) + '">' +
      plate(p) +
      '<div class="cs-face">' +
        '<span class="cs-name"><span class="ar" lang="ar" dir="rtl">' + esc(p.nameAr) + "</span>" +
        '<span class="en">' + esc(p.nameEn) + "</span></span>" +
        primary + more +
        '<span class="cs-cta">View case study <span aria-hidden="true">&rarr;</span></span>' +
      "</div></button>";
  }

  deck.innerHTML = D.products.map(cardHTML).join("");

  /* ── totals, computed from the data, never typed ───────────────────────── */
  var t = D.totals;
  totalsEl.innerHTML =
    "<div><dt>Reported purchases</dt><dd class='tnum'>" + num(t.purchases) + "</dd></div>" +
    "<div><dt>Spend across these campaigns</dt><dd class='tnum'>" + money(t.spend) + "</dd></div>" +
    "<div><dt>Impressions</dt><dd class='tnum'>" + num(t.impressions) + "</dd></div>" +
    "<div><dt>Lowest cost / purchase</dt><dd class='tnum'>" + money(t.lowestCpa) + "</dd></div>";

  var pendingCount = D.products.length - t.counted;
  if (pendingCount > 0) {
    var n = $("[data-cs-totalnote]");
    if (n) n.textContent = "Totals cover the " + t.counted + " campaigns with verified data. " +
      pendingCount + " product" + (pendingCount > 1 ? "s are" : " is") + " awaiting figures and " +
      (pendingCount > 1 ? "are" : "is") + " excluded.";
  }

  /* ── the case study ────────────────────────────────────────────────────── */
  function kpis(m) {
    var out = [
      ["Reported purchases", num(m.purchases)],
      ["Cost / reported purchase", money(m.cpa)],
      ["Spend", money(m.spend)],
      ["Impressions", compact(m.impressions)]
    ];
    return '<dl class="cs-kpis">' + out.map(function (r) {
      return "<div><dt>" + esc(r[0]) + '</dt><dd class="tnum">' + esc(r[1]) + "</dd></div>";
    }).join("") + "</dl>";
  }

  function secondary(m) {
    var bits = [];
    bits.push("<span><b class='tnum'>" + pct(m.ctr.value) + "</b><em>" + ctrLabel(m.ctr) + "</em></span>");
    if (m.hookRate != null) bits.push("<span><b class='tnum'>" + pct(m.hookRate) + "</b><em>Hook rate</em></span>");
    if (m.frequency != null) bits.push("<span><b class='tnum'>" + m.frequency.toFixed(2) + "</b><em>Frequency</em></span>");
    bits.push("<span><b class='tnum'>" + money(m.cpm) + "</b><em>CPM</em></span>");
    if (m.reach != null) bits.push("<span><b class='tnum'>" + num(m.reach) + "</b><em>Reach</em></span>");
    if (m.cpc != null) bits.push("<span><b class='tnum'>" + money(m.cpc) + "</b><em>CPC, all clicks</em></span>");
    return '<div class="cs-second">' + bits.join("") + "</div>";
  }

  function chapter(n, title, inner) {
    return '<section class="cs-chapter" id="ch-' + n + '"><header>' +
      '<span class="num">Chapter ' + n + "</span><h4>" + esc(title) + "</h4></header>" +
      inner + "</section>";
  }

  function workflowHTML() {
    return '<p>These products were not discovered by me. A product research team searched 1688 and similar ' +
      'marketplaces, and launched fast tests using the supplier’s own creative — the first test exists to ' +
      'answer one question, not to be a good advertisement. My work began once a product showed demand.</p>' +
      '<div class="cs-flow">' + D.workflow.map(function (s) {
        return '<div class="cs-flowstep' + (s.mine ? " is-mine" : "") + '">' +
          '<span class="k">' + esc(s.k) + '</span><span class="d">' + esc(s.d) + "</span></div>";
      }).join("") + "</div>" +
      '<p class="cs-mine-key">Highlighted stages are the ones I owned.</p>';
  }

  function evidenceHTML(p) {
    var m = p.metrics;
    var lift = (p.evidence.lift || []).map(function (key) {
      if (key === "purchases") return ["<b class='tnum'>" + num(m.purchases) + "</b>", "Reported purchases"];
      if (key === "cpa")       return ["<b class='tnum'>" + money(m.cpa) + "</b>", "Cost / reported purchase"];
      if (key === "spend")     return ["<b class='tnum'>" + money(m.spend) + "</b>", "Spend"];
      if (key === "cpm")       return ["<b class='tnum'>" + money(m.cpm) + "</b>", "CPM"];
      if (key === "impressions") return ["<b class='tnum'>" + compact(m.impressions) + "</b>", "Impressions"];
      if (key === "hookRate")  return ["<b class='tnum'>" + pct(m.hookRate) + "</b>", "Hook rate"];
      if (key === "ctr")       return ["<b class='tnum'>" + pct(m.ctr.value) + "</b>", ctrLabel(m.ctr)];
      return null;
    }).filter(Boolean);

    return '<p>The figures above are read from Meta Ads Manager. The capture below is the source, cropped to ' +
      'the campaign table — account names, account and business identifiers, the browser address bar and ' +
      'unrelated campaigns are removed before it is shown. The campaign row’s own metrics are never ' +
      'altered.</p>' +
      '<div class="cs-shotwrap"><div class="cs-shot is-placeholder" data-shot="' + esc(p.evidence.shot) + '">' +
        '<span class="cs-slotl">Masked screenshot — slot ' + esc(p.evidence.shot) + '</span>' +
        '<span style="font-size:.82rem;color:var(--d-text-3);max-width:44ch">Cropped capture of the row ' +
        "“" + esc(p.evidence.row) + "” goes here.</span>" +
      "</div></div>" +
      '<p class="cs-shotcap"><span>Meta Ads Manager, reported metrics</span>' +
      "<span>Campaign row: " + esc(p.evidence.row) + "</span></p>" +
      '<div class="cs-lift">' + lift.map(function (l) {
        return "<div>" + l[0] + "<span>" + esc(l[1]) + "</span></div>";
      }).join("") + "</div>";
  }

  function funnelHTML(p) {
    return '<div class="gap" role="img" aria-label="Of every hundred people reached, about ' +
      Math.round(p.funnel[0].v) + " watched past the hook, about " + p.funnel[1].v +
      " clicked the link, and about " + p.funnel[2].v + ' recorded a purchase.">' +
      p.funnel.map(function (r) {
        return '<div class="row"><span class="k">' + esc(r.k) + '</span>' +
          '<span class="bar' + (r.mute ? " mute" : "") + '"><i data-w="' + r.w + '%"></i></span>' +
          '<span class="v tnum">' + r.v + "%</span></div>";
      }).join("") + "</div>";
  }

  function learningsHTML(p) {
    var l = p.learnings, out = [];
    if (l.worked)  out.push("<div><h4>What worked</h4><p class='kicker'>" + esc(l.worked) + "</p></div>");
    if (l.watch)   out.push("<div><h4>The limit</h4><p class='kicker'>" + esc(l.watch) + "</p></div>");
    if (l.changed) out.push("<div><h4>What I changed</h4><p class='kicker'>" + esc(l.changed) + "</p></div>");
    var verdict = l.verdict
      ? "<p>" + esc(l.verdict) + "</p>"
      : '<p class="cs-pending">No scale, iterate or kill verdict is recorded for this product. That decision ' +
        'needs confirmation rate, delivery rate and margin — none of which I hold verified data for here.</p>';
    return '<div class="duo" style="grid-template-columns:repeat(auto-fit,minmax(260px,1fr))">' +
      out.join("") + "</div>" + verdict;
  }

  function studyHTML(p) {
    var m = p.metrics, parts = [];

    parts.push('<button class="cs-back" type="button" data-back="deck">' +
      '<svg viewBox="0 0 16 10" aria-hidden="true"><path d="M15 5H1M5 1L1 5l4 4"/></svg>' +
      "Back to the six products</button>");

    parts.push('<div class="cs-hero"><div>' +
      '<span class="label">Case study ' + p.n + "</span>" +
      "<h3>" + esc(p.claim || p.nameEn) + "</h3></div>" +
      '<p class="cs-heroname" lang="ar" dir="rtl">' + esc(p.nameAr) + "</p>" +
      (m ? kpis(m) + secondary(m) : '<p class="cs-pending">' + esc(p.pending) + "</p>") +
      (p.scope ? '<p class="cs-shotcap"><span>' + esc(p.scope) + "</span></p>" : "") +
      "</div>");

    var chapters = [];
    if (p.overview)   chapters.push(chapter("01", "Overview", "<p>" + esc(p.overview) + "</p>" +
                        (p.note ? '<p class="cs-shotcap"><span>' + esc(p.note) + "</span></p>" : "")));
    if (p.validation) chapters.push(chapter("02", "Product validation", workflowHTML()));
    if (p.creative)   chapters.push(chapter("03", "Creative strategy", ""));
    if (p.landingPage)chapters.push(chapter("04", "Landing page", ""));
    if (p.evidence)   chapters.push(chapter("05", "Media buying", evidenceHTML(p) +
                        (p.funnel ? funnelHTML(p) : "")));
    if (p.codFunnel)  chapters.push(chapter("06", "COD funnel", ""));
    if (p.profitability) chapters.push(chapter("07", "Profitability", ""));
    if (p.learnings)  chapters.push(chapter("08", "What I learned", learningsHTML(p)));

    parts.push('<div class="cs-chapters">' + chapters.join("") + "</div>");

    /* What this case study does not yet contain, stated rather than faked. */
    var missing = [];
    if (!p.creative) missing.push("creative testing");
    if (!p.landingPage) missing.push("landing page analysis");
    if (!p.codFunnel) missing.push("COD confirmation and delivery");
    if (!p.profitability) missing.push("profitability");
    if (missing.length) {
      parts.push('<p class="cs-pending">Chapters for ' + missing.join(", ") +
        " are built but not shown: I do not hold verified data for them on this product yet, and a portfolio " +
        "that invents them is worth nothing.</p>");
    }

    var i = D.products.indexOf(p);
    var next = D.products[(i + 1) % D.products.length];
    parts.push('<div class="cs-nav">' +
      '<button type="button" data-back="deck">All six products</button>' +
      '<button type="button" data-product="' + next.id + '">Next: ' + esc(next.nameEn) + " &rarr;</button>" +
      "</div>");

    return parts.join("");
  }

  /* ── routing ───────────────────────────────────────────────────────────── */
  var view = { name: "categories", product: null };

  function hashFor(v) {
    if (v.name === "study") return "#/ecommerce/" + v.product;
    if (v.name === "deck") return "#/ecommerce";
    if (v.name === "concepts") return "#/concepts";
    return "#/case-studies";
  }
  function parseHash() {
    var h = (location.hash || "").replace(/^#\/?/, "").split("/").filter(Boolean);
    if (h[0] === "ecommerce") return h[1] ? { name: "study", product: h[1] } : { name: "deck", product: null };
    if (h[0] === "concepts") return { name: "concepts", product: null };
    return { name: "categories", product: null };
  }

  function paint(v, opts) {
    opts = opts || {};
    view = v;
    cats.parentNode.hidden = v.name !== "categories";
    world.classList.toggle("is-open", v.name === "deck" || v.name === "study");
    concepts.classList.toggle("is-open", v.name === "concepts");
    track.hidden = v.name !== "deck";
    study.classList.toggle("is-open", v.name === "study");

    if (v.name === "study") {
      var p = D.byId(v.product);
      if (!p) { go({ name: "deck", product: null }); return; }
      study.innerHTML = studyHTML(p);
      /* the bar widths the existing observer would normally animate */
      $$(".gap .bar i", study).forEach(function (i) {
        requestAnimationFrame(function () { i.style.width = i.dataset.w; });
      });
      if (!opts.silent) focusFirst(study);
    } else if (v.name === "deck" && !opts.silent) {
      focusFirst(deck);
    }
    resize();
  }

  function focusFirst(scope) {
    var el = scope.querySelector("button, a, h3, h4");
    if (!el) return;
    if (!el.hasAttribute("tabindex") && !/^(A|BUTTON)$/.test(el.tagName)) el.setAttribute("tabindex", "-1");
    try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); }
  }

  function go(v, opts) {
    var h = hashFor(v);
    if (location.hash !== h) history.pushState(null, "", h);
    paint(v, opts);
  }

  addEventListener("hashchange", function () { paint(parseHash(), { silent: true }); });
  addEventListener("popstate", function () { paint(parseHash(), { silent: true }); });

  /* ── the portal: passing through a card rather than navigating ─────────── */
  function portal(from, then) {
    if (RM) { then(); return; }
    var r = from.getBoundingClientRect();
    var el = document.createElement("div");
    el.className = "cs-portal";
    el.style.left = r.left + "px";
    el.style.top = r.top + "px";
    el.style.width = r.width + "px";
    el.style.height = r.height + "px";
    document.body.appendChild(el);

    var s = Math.max(innerWidth / r.width, innerHeight / r.height) * 1.12;
    var dx = innerWidth / 2 - (r.left + r.width / 2);
    var dy = innerHeight / 2 - (r.top + r.height / 2);

    requestAnimationFrame(function () {
      el.style.transform = "translate(" + dx + "px," + dy + "px) scale(" + s + ")";
      el.style.borderRadius = "0";
    });
    setTimeout(then, 430);
    setTimeout(function () { el.classList.add("is-open"); }, 470);
    setTimeout(function () { el.remove(); }, 1000);
  }

  /* ── entering the e-commerce world ─────────────────────────────────────── */
  $$("[data-category]", cats).forEach(function (btn) {
    btn.addEventListener("click", function () {
      var id = btn.dataset.category;
      var cat = D.categories.filter(function (c) { return c.id === id; })[0];
      if (!cat || !cat.open) return;

      if (RM) { go({ name: id === "concepts" ? "concepts" : "deck", product: null }); return; }

      cats.classList.add("is-leaving");
      btn.classList.add("is-chosen");
      portal(btn, function () {
        cats.classList.remove("is-leaving");
        btn.classList.remove("is-chosen");
        go({ name: id === "concepts" ? "concepts" : "deck", product: null });
        toSection();
      });
    });
  });

  /* ── opening a product ─────────────────────────────────────────────────── */
  root.addEventListener("click", function (e) {
    var b = e.target.closest("[data-product]");
    if (b) {
      var id = b.dataset.product;
      var pl = b.querySelector(".cs-plate");
      if (RM || !pl) { go({ name: "study", product: id }); toSection(); return; }
      portal(pl, function () {
        go({ name: "study", product: id });
        toSection();
      });
      return;
    }
    var back = e.target.closest("[data-back]");
    if (back) {
      go({ name: back.dataset.back === "cats" ? "categories" : "deck", product: null });
      toSection();
    }
  });

  /* ── the unpack, driven by scroll through the pinned track ─────────────── */
  var cards = [];
  var base = [];
  var geom = { cx: 0, cy: 0 };

  /* Base positions come from offsetLeft/offsetTop, which are layout values and
     ignore transforms. Reading getBoundingClientRect here instead would feed
     each frame's own transform back into the next one, and the cards would
     converge on a fixed point rather than travel. */
  function measure() {
    cards = $$(".cs-card", deck);
    if (!track || track.hidden || !cards.length) return;
    var sx = 0, sy = 0;
    base = cards.map(function (el) {
      var c = { x: el.offsetLeft + el.offsetWidth / 2, y: el.offsetTop + el.offsetHeight / 2 };
      sx += c.x; sy += c.y;
      return c;
    });
    geom.cx = sx / cards.length;
    geom.cy = sy / cards.length;
  }

  function resize() { measure(); }

  /* ease with a small overshoot at the end — the settle, not a bounce */
  function outBack(x) {
    var c = 1.24;
    return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2);
  }

  function unpack() {
    if (view.name !== "deck" || !cards.length) return;
    /* Progress is the deck's travel through the viewport: 0 when its top is
       still a screen below the fold, 1 once it has climbed far enough that the
       last card has settled. Same shape as the existing stack's `enter`. */
    var dr = deck.getBoundingClientRect();
    var p = clamp((innerHeight * 0.86 - dr.top) / (innerHeight * 1.25), 0, 1);
    var step = 0.085, win = 0.44;

    for (var i = 0; i < cards.length; i++) {
      var el = cards[i];
      var raw = clamp((p - i * step) / win, 0, 1);
      var k = outBack(raw);

      var bp = base[i] || { x: geom.cx, y: geom.cy };
      var dx = geom.cx - bp.x;
      var dy = geom.cy - bp.y;

      var tx = (1 - k) * dx;
      var ty = (1 - k) * dy;
      var tz = -(1 - k) * DEPTH;
      var rot = (1 - k) * ((i % 2 ? 1 : -1) * 3);
      var sc = 0.9 + 0.1 * k;
      var bl = (1 - raw) * 3;

      el.style.transform = "translate3d(" + tx.toFixed(1) + "px," + ty.toFixed(1) + "px,0) " +
        "translateZ(" + tz.toFixed(1) + "px) rotate(" + rot.toFixed(2) + "deg) scale(" + sc.toFixed(4) + ")";
      el.style.opacity = (0.25 + 0.75 * clamp(raw * 2, 0, 1)).toFixed(3);
      /* blur is removed outright once it reaches zero — never left running */
      el.style.filter = raw > 0.985 ? "" : "blur(" + bl.toFixed(2) + "px)";
      el.style.zIndex = String(10 + (cards.length - i));
    }
  }

  /* ── cursor tilt, same cap as the existing grid cards ──────────────────── */
  var pointer = { x: -1, y: -1, live: false };
  if (!RM && matchMedia("(hover:hover)").matches) {
    addEventListener("pointermove", function (e) {
      pointer.x = e.clientX; pointer.y = e.clientY; pointer.live = true;
    }, { passive: true });
    addEventListener("pointerleave", function () { pointer.live = false; }, { passive: true });
  }

  function tilt() {
    if (!pointer.live || view.name === "study") return;
    var els = view.name === "categories" ? $$(".cs-cat", cats) : [];
    for (var i = 0; i < els.length; i++) {
      var el = els[i], r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) { el.style.transform = ""; continue; }
      var nx = clamp(((pointer.x - (r.left + r.width / 2)) / (r.width / 2)), -1, 1);
      var ny = clamp(((pointer.y - (r.top + r.height / 2)) / (r.height / 2)), -1, 1);
      var near = Math.abs(nx) < 1.25 && Math.abs(ny) < 1.25;
      var g = near ? 1 : 0;
      el.style.transform = "rotateY(" + (nx * TILT * g).toFixed(2) + "deg) rotateX(" +
        (-ny * TILT * g).toFixed(2) + "deg) translateZ(" + (g * 8).toFixed(1) + "px)";
      el.style.setProperty("--mx", (((pointer.x - r.left) / r.width) * 100).toFixed(1) + "%");
      el.style.setProperty("--my", (((pointer.y - r.top) / r.height) * 100).toFixed(1) + "%");
    }
  }

  /* one loop for the whole page — register, never start a second */
  if (!RM && window.__csFrame) {
    window.__csFrame.push(function () { unpack(); tilt(); });
  }

  var lastW = innerWidth;
  addEventListener("resize", function () {
    if (innerWidth !== lastW) { lastW = innerWidth; TILT = small.matches ? 2 : 4; DEPTH = small.matches ? 120 : 420; }
    resize();
  }, { passive: true });
  /* No measure() on scroll: offsetLeft forces layout, and nothing here reflows
     while the page is simply scrolling. Layout changes go through resize(). */

  /* ── first paint ───────────────────────────────────────────────────────── */
  /* A shared link points at a case study, not at the film. Landing on the
     opening gate with the page locked would strand the visitor, so a
     case-studies hash skips the cinematic the same way the Skip control does
     and takes them where the link pointed. */
  function honourDeepLink() {
    var want = location.hash;
    if (!/^#\//.test(want || "")) return;
    /* The skip control in the HUD is a <button>; the one in the gate is an
       <a href="#work">, and following it would overwrite the route we are
       trying to honour. Use the button, and restore the hash regardless. */
    var skip = document.querySelector(".stage-ctl button[data-skip]") ||
               document.querySelector("button[data-skip]");
    if (skip) skip.click();
    requestAnimationFrame(function () {
      if (location.hash !== want) history.replaceState(null, "", want);
      paint(parseHash(), { silent: true });
      toSection();
      resize();
    });
  }

  paint(parseHash(), { silent: true });
  resize();
  honourDeepLink();
  addEventListener("load", function () { resize(); });
})();
