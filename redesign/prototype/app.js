/* Hero prototype: "The Frame".
   Scroll drives one progress value. Everything below is a pure function of it,
   so scrolling backward runs the sequence backward. No timelines, no autoplay. */
(function () {
  'use strict';

  var stage    = document.getElementById('stage');
  var hero     = document.querySelector('.hero');
  var ground   = document.getElementById('ground');
  var bigname  = document.getElementById('bigname');
  var subject  = document.getElementById('subject');
  var litCopy  = document.getElementById('litCopy');
  var rim      = document.getElementById('rim');
  var namewrap = document.getElementById('namewrap');
  var nameLine = document.getElementById('nameLine');
  var ledeLine = document.getElementById('ledeLine');
  var chipLine = document.getElementById('chipLine');
  var cardsWrap= document.getElementById('cards');
  var cards    = [].slice.call(document.querySelectorAll('.card'));
  var basis    = document.getElementById('basis');
  var handover = document.getElementById('handover');
  var cue      = document.getElementById('cue');
  var topbar   = document.getElementById('topbar');

  /* ---------- helpers ---------- */
  function clamp(v, lo, hi){ return v < lo ? lo : v > hi ? hi : v; }
  function smoothstep(p, a, b){
    var t = clamp((p - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  }
  function lerp(a, b, t){ return a + (b - a) * t; }

  /* ---------- the ground's colour climb ---------- */
  var RAMP = [
    [0.00, [0x15,0x0B,0x08]],
    [0.50, [0x2A,0x13,0x10]],
    [0.76, [0x5A,0x2E,0x1F]],
    [0.91, [0xA8,0x74,0x50]],
    [1.00, [0xF0,0xE9,0xDE]]
  ];
  function groundAt(p){
    for (var i = 1; i < RAMP.length; i++){
      if (p <= RAMP[i][0]){
        var a = RAMP[i-1], b = RAMP[i];
        var t = (p - a[0]) / (b[0] - a[0]);
        t = t * t * (3 - 2 * t);
        return 'rgb(' + Math.round(lerp(a[1][0], b[1][0], t)) + ',' +
                        Math.round(lerp(a[1][1], b[1][1], t)) + ',' +
                        Math.round(lerp(a[1][2], b[1][2], t)) + ')';
      }
    }
    return 'rgb(240,233,222)';
  }

  /* ---------- split the headline and lede into words ---------- */
  function split(el, text, italicFrom){
    var vis = el.querySelector('.vis');
    if (!vis) return [];
    var words = text.split(' ');
    var spans = [];
    words.forEach(function (w, i){
      var s = document.createElement('span');
      s.className = 'w' + (italicFrom != null && i >= italicFrom ? ' it' : '');
      s.textContent = w;
      s.style.opacity = '0';
      vis.appendChild(s);
      if (i < words.length - 1) vis.appendChild(document.createTextNode(' '));
      spans.push(s);
    });
    return spans;
  }
  var nameWords = split(nameLine, 'Khalid Ounzar', 1);
  var ledeWords = split(ledeLine, 'I find the gap between reported and real.', null);

  /* ---------- write only when the value actually changed ---------- */
  var last = {};
  function setVar(el, name, value, eps, key){
    var k = key || (name + (el.id || el.className));
    if (typeof value === 'number'){
      if (last[k] !== undefined && Math.abs(last[k] - value) < (eps || 0.004)) return;
      last[k] = value;
      el.style.setProperty(name, value);
    } else {
      if (last[k] === value) return;
      last[k] = value;
      el.style.setProperty(name, value);
    }
  }
  function setStyle(el, prop, value, key){
    var k = key || (prop + (el.id || ''));
    if (last[k] === value) return;
    last[k] = value;
    el.style[prop] = value;
  }

  /* ---------- the render: a pure function of progress ---------- */
  function render(p){
    /* ground */
    setStyle(ground, 'backgroundColor', groundAt(p), 'ground');

    /* stage 1: the oversized name, behind the subject */
    var bnOut = smoothstep(p, 0.12, 0.28);
    setVar(bigname, '--bn-o', (1 - bnOut).toFixed(3), 0.004, 'bno');
    setVar(bigname, '--bn-s', (1 + bnOut * 0.11).toFixed(4), 0.002, 'bns');

    /* stage 2: the directional sweep. One edge travelling across one photograph. */
    var sweep = smoothstep(p, 0.14, 0.44);
    setVar(litCopy, '--sweep', sweep.toFixed(4), 0.003, 'sweep');

    /* the warm key edge rides the same position and fades once the light has passed */
    var redge = (sweep * 152 - 26);
    setVar(rim, '--redge', redge.toFixed(1) + '%', null, 'redge');
    var rimO = Math.sin(clamp(sweep, 0, 1) * Math.PI);
    setVar(rim, '--rim-o', (rimO * 0.85).toFixed(3), 0.006, 'rimo');

    /* the subject: centre, then eases right, then steps back a plane, then hands over */
    var toRight = smoothstep(p, 0.16, 0.48);
    var recede  = smoothstep(p, 0.52, 0.80);
    var exit    = smoothstep(p, 0.78, 0.90);
    var vw = window.innerWidth;
    setVar(subject, '--sx', Math.round(toRight * Math.min(vw * 0.26, 330)) + 'px', null, 'sx');
    setVar(subject, '--ss', (1 - recede * 0.13).toFixed(4), 0.002, 'ss');
    setVar(subject, '--sy', Math.round(recede * 10) + 'px', null, 'sy');
    setVar(subject, '--so', (1 - exit).toFixed(3), 0.005, 'so');
    setVar(subject, '--contact-o', (0.9 * (1 - exit)).toFixed(3), 0.006, 'conto');

    /* stage 2 type: assembles word by word, then leaves before the cards own the frame */
    var nwIn  = smoothstep(p, 0.26, 0.44);
    var nwOut = smoothstep(p, 0.52, 0.60);
    setVar(namewrap, '--nw-o', (nwIn * (1 - nwOut)).toFixed(3), 0.005, 'nwo');
    setVar(namewrap, '--scrim-o', (nwIn * (1 - nwOut)).toFixed(3), 0.005, 'scrimo');

    var nk = clamp((p - 0.26) / 0.13, 0, 1);
    nameWords.forEach(function (s, i){
      var th = i * 0.30;
      var o = clamp((nk - th) * 2.6, 0, 1);
      setStyle(s, 'opacity', o.toFixed(3), 'nw' + i);
      setStyle(s, 'transform', 'translateY(' + ((1 - o) * 16).toFixed(1) + 'px)', 'nwt' + i);
    });
    var lk = clamp((p - 0.32) / 0.13, 0, 1);
    ledeWords.forEach(function (s, i){
      var th = i / ledeWords.length * 0.55;
      var o = clamp((lk - th) * 3.0, 0, 1);
      setStyle(s, 'opacity', o.toFixed(3), 'lw' + i);
      setStyle(s, 'transform', 'translateY(' + ((1 - o) * 10).toFixed(1) + 'px)', 'lwt' + i);
    });
    var ck = smoothstep(p, 0.40, 0.48);
    setVar(chipLine, '--chip-o', ck.toFixed(3), 0.006, 'chipo');
    setVar(chipLine, '--chip-k', ck.toFixed(3), 0.006, 'chipk');

    /* stage 3: the figures, three depths, staggered */
    var cardsOut = smoothstep(p, 0.84, 0.91);
    cards.forEach(function (c, i){
      var a = 0.58 + i * 0.065;
      var k = smoothstep(p, a, a + 0.13);
      setVar(c, '--c-k', k.toFixed(3), 0.005, 'ck' + i);
      setVar(c, '--c-o', (k * (1 - cardsOut)).toFixed(3), 0.005, 'co' + i);
    });
    var basisK = smoothstep(p, 0.70, 0.78) * (1 - cardsOut);
    setVar(basis, '--basis-o', basisK.toFixed(3), 0.006, 'basiso');

    /* stage 4: the cream handover, inside the hero so there is no seam */
    setVar(handover, '--ho-o', smoothstep(p, 0.90, 0.99).toFixed(3), 0.005, 'hoo');

    /* the bar flips to dark ink once the ground is light enough to need it */
    var onLight = p > 0.90;
    if (last.onLight !== onLight){
      last.onLight = onLight;
      topbar.classList.toggle('on-light', onLight);
    }

    setVar(cue, '--cue-o', (1 - smoothstep(p, 0.02, 0.12)).toFixed(3), 0.006, 'cueo');
  }

  /* ---------- the drive loop: eases toward the target, then rests ---------- */
  var target = 0, shown = 0, rafId = null, lastTick = 0, onScreen = true;

  function heroProgress(){
    var range = hero.offsetHeight - window.innerHeight;
    if (range <= 0) return 0;
    return clamp((window.pageYOffset || document.documentElement.scrollTop) / range, 0, 1);
  }

  function tick(now){
    var dt = Math.min(100, now - (lastTick || now));
    lastTick = now;
    var k = 0.19;
    shown += (target - shown) * (1 - Math.pow(1 - k, dt / 16.667));
    if (Math.abs(target - shown) < 0.0004){
      shown = target;
      rafId = null;
      lastTick = 0;
    } else {
      rafId = requestAnimationFrame(tick);
    }
    render(shown);
  }

  function onScroll(){
    target = heroProgress();
    if (rafId === null && onScreen){ lastTick = 0; rafId = requestAnimationFrame(tick); }
  }

  if ('IntersectionObserver' in window){
    new IntersectionObserver(function (entries){
      onScreen = entries[0].isIntersecting;
      if (onScreen && rafId === null && Math.abs(target - shown) > 0.0004){
        lastTick = 0; rafId = requestAnimationFrame(tick);
      }
    }, { rootMargin: '10px' }).observe(hero);
  }

  /* ---------- the five static-hero gates ----------
     These strings must match app.css character for character. */
  var GATES = [
    '(max-width: 720px)',
    '(orientation: portrait) and (max-width: 1024px)',
    '(orientation: portrait) and (pointer: coarse)',
    '(orientation: landscape) and (pointer: coarse) and (max-height: 560px)',
    '(prefers-reduced-motion: reduce)'
  ];
  var MQLS = GATES.map(function (q){ return window.matchMedia(q); });
  var scrubOn = false;

  function enableScrub(){
    if (scrubOn) return;
    scrubOn = true;
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    last = {};                       // drop caches so pinned styles get rewritten
    target = heroProgress();
    shown = target;
    render(shown);                   // land on the current scroll position, not on zero
  }
  function disableScrub(){
    if (!scrubOn) return;
    scrubOn = false;
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onResize);
    if (rafId !== null){ cancelAnimationFrame(rafId); rafId = null; }
    topbar.classList.remove('on-light');
    last = {};
  }
  function onResize(){ last = {}; onScroll(); }

  function applyHeroMode(){
    var staticMode = MQLS.some(function (m){ return m.matches; });
    if (staticMode) disableScrub(); else enableScrub();
  }
  MQLS.forEach(function (m){
    if (m.addEventListener) m.addEventListener('change', applyHeroMode);
    else if (m.addListener) m.addListener(applyHeroMode);   // older Safari
  });

  applyHeroMode();

  /* expose a tiny probe so the sequence can be tested from the browser */
  window.__frame = {
    progress: function (){ return shown; },
    jump: function (p){ target = shown = clamp(p, 0, 1); render(shown); },
    scrubOn: function (){ return scrubOn; }
  };
})();
