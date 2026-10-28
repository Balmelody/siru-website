/* Siru Consulting — animated circuit-board background for the inner-page heroes.
   Traces are drawn once; pulses run at ~30 fps, pause off-screen and when the tab is hidden,
   and stay still for prefers-reduced-motion. */
(function () {
  if (!document.querySelector('canvas.circuit') || !window.requestAnimationFrame) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Circuit background: traces drawn once, pulses animated on top ---------- */
  var PAL = {
    dark:  { trace: 'rgba(120,114,124,.55)', via: 'rgba(150,143,152,.7)', pulse: '232,131,107', chip: '#2F2E33', chipLine: '#6A666F', label: '#E8836B' },
    light: { trace: 'rgba(196,182,166,.55)', via: 'rgba(196,182,166,.85)', pulse: '194,85,61' }
  };
  var DIRS = [[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]];

  function rnd(a, b) { return a + Math.random() * (b - a); }

  function Circuit(canvas) {
    this.c = canvas; this.ctx = canvas.getContext('2d');
    this.mode = canvas.getAttribute('data-mode') || 'dark';
    this.pal = PAL[this.mode];
    this.w = 0; this.h = 0; this.traces = []; this.pulses = []; this.visible = false; this.last = 0;
  }
  Circuit.prototype.walk = function (x, y, d, g, outward) {
    var pts = [[x, y]], segs = 3 + (Math.random() * 4 | 0);
    for (var s = 0; s < segs; s++) {
      var len = g * (2 + (Math.random() * 5 | 0)) * (DIRS[d][0] && DIRS[d][1] ? 0.7 : 1);
      x += DIRS[d][0] * len; y += DIRS[d][1] * len;
      pts.push([x, y]);
      if (x < -20 || y < -20 || x > this.w + 20 || y > this.h + 20) break;
      var nd = (d + (Math.random() < 0.5 ? 1 : 7)) % 8;           // 45-degree bend, PCB style
      if (outward && DIRS[nd][0] * outward[0] + DIRS[nd][1] * outward[1] < 0) nd = d;
      d = nd;
    }
    return pts;
  };
  Circuit.prototype.build = function () {
    var w = this.c.clientWidth, h = this.c.clientHeight;
    if (!w || !h) return false;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = w; this.h = h; this.dpr = dpr;
    this.c.width = Math.round(w * dpr); this.c.height = Math.round(h * dpr);
    var small = w < 760, g = small ? 16 : 22, traces = [];
    this.chip = null;
    if (this.mode === 'dark') {
      var size = small ? 64 : Math.max(96, Math.min(140, w * 0.1));
      var cx = small ? w * 0.74 : w * 0.73, cy = small ? 104 : h * 0.47;
      this.chip = { x: cx - size / 2, y: cy - size / 2, s: size };
      var pins = small ? 4 : 6, step = size / (pins + 1);
      for (var i = 1; i <= pins; i++) {
        var o = -size / 2 + i * step;
        traces.push(this.walk(cx + size / 2, cy + o, 0, g, [1, 0]));
        traces.push(this.walk(cx - size / 2, cy + o, 4, g, [-1, 0]));
        traces.push(this.walk(cx + o, cy + size / 2, 2, g, [0, 1]));
        traces.push(this.walk(cx + o, cy - size / 2, 6, g, [0, -1]));
      }
      for (var k = 0; k < (small ? 6 : 14); k++) traces.push(this.walk(rnd(w * 0.35, w), rnd(0, h), Math.random() * 8 | 0, g, null));
    } else {
      for (var j = 0; j < (small ? 8 : 16); j++) traces.push(this.walk(-10, rnd(10, h - 10), 0, g, [1, 0]));
      for (var m = 0; m < (small ? 4 : 10); m++) traces.push(this.walk(rnd(w * 0.4, w), rnd(0, h), Math.random() * 8 | 0, g, [1, 0]));
    }
    // cumulative lengths for pulse travel
    this.traces = traces.map(function (p) {
      var acc = [0];
      for (var i = 1; i < p.length; i++) acc.push(acc[i - 1] + Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]));
      return { p: p, acc: acc, len: acc[acc.length - 1] };
    });
    // static layer
    var bg = document.createElement('canvas'); bg.width = this.c.width; bg.height = this.c.height;
    var b = bg.getContext('2d'); b.scale(dpr, dpr);
    b.lineWidth = 1.2; b.lineJoin = 'round'; b.strokeStyle = this.pal.trace;
    this.traces.forEach(function (t) {
      b.beginPath(); b.moveTo(t.p[0][0], t.p[0][1]);
      for (var i = 1; i < t.p.length; i++) b.lineTo(t.p[i][0], t.p[i][1]);
      b.stroke();
    });
    b.fillStyle = this.pal.via; b.strokeStyle = this.pal.via;
    this.traces.forEach(function (t) {
      var e = t.p[t.p.length - 1];
      b.beginPath(); b.arc(e[0], e[1], 2.6, 0, Math.PI * 2); b.stroke();
    });
    if (this.chip) {
      var ch = this.chip, r = 10;
      b.fillStyle = this.pal.chip; b.strokeStyle = this.pal.chipLine; b.lineWidth = 1.5;
      b.beginPath();
      b.moveTo(ch.x + r, ch.y); b.arcTo(ch.x + ch.s, ch.y, ch.x + ch.s, ch.y + ch.s, r); b.arcTo(ch.x + ch.s, ch.y + ch.s, ch.x, ch.y + ch.s, r);
      b.arcTo(ch.x, ch.y + ch.s, ch.x, ch.y, r); b.arcTo(ch.x, ch.y, ch.x + ch.s, ch.y, r); b.closePath();
      b.fill(); b.stroke();
      b.strokeRect(ch.x + ch.s * 0.18, ch.y + ch.s * 0.18, ch.s * 0.64, ch.s * 0.64);
      b.fillStyle = this.pal.label; b.textAlign = 'center'; b.textBaseline = 'middle';
      b.font = '600 ' + Math.round(ch.s * 0.26) + 'px Sora, "PingFang SC", sans-serif';
      b.fillText('AI', ch.x + ch.s / 2, ch.y + ch.s / 2 + 1);
    }
    this.bg = bg;
    var n = small ? 10 : 22; this.pulses = [];
    for (var q = 0; q < n; q++) this.pulses.push(this.newPulse(true));
    return true;
  };
  Circuit.prototype.newPulse = function (anywhere) {
    var t = this.traces[Math.random() * this.traces.length | 0];
    return { t: t, d: anywhere ? rnd(0, t.len) : 0, v: rnd(50, 120) };
  };
  Circuit.prototype.at = function (t, d) {
    var a = t.acc, i = 1;
    while (i < a.length - 1 && a[i] < d) i++;
    var seg = a[i] - a[i - 1] || 1, f = Math.max(0, Math.min(1, (d - a[i - 1]) / seg));
    return [t.p[i - 1][0] + (t.p[i][0] - t.p[i - 1][0]) * f, t.p[i - 1][1] + (t.p[i][1] - t.p[i - 1][1]) * f];
  };
  Circuit.prototype.draw = function (dt, time) {
    var x = this.ctx, dpr = this.dpr, col = this.pal.pulse, self = this;
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.clearRect(0, 0, this.c.width, this.c.height);
    x.drawImage(this.bg, 0, 0);
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (this.chip) {   // slow glow behind the chip label
      var ch = this.chip, a = 0.10 + 0.08 * Math.sin(time / 900);
      x.fillStyle = 'rgba(' + col + ',' + a.toFixed(3) + ')';
      x.fillRect(ch.x + ch.s * 0.18, ch.y + ch.s * 0.18, ch.s * 0.64, ch.s * 0.64);
    }
    this.pulses.forEach(function (p, i) {
      p.d += p.v * dt;
      if (p.d > p.t.len + 30) { self.pulses[i] = p = self.newPulse(false); }
      for (var k = 6; k >= 0; k--) {               // fading tail
        var d = p.d - k * 6;
        if (d < 0 || d > p.t.len) continue;
        var pt = self.at(p.t, d), alpha = (1 - k / 7) * 0.9;
        x.fillStyle = 'rgba(' + col + ',' + alpha.toFixed(3) + ')';
        x.beginPath(); x.arc(pt[0], pt[1], k ? 1.6 : 2.4, 0, Math.PI * 2); x.fill();
      }
    });
  };

  var circuits = [].map.call(document.querySelectorAll('canvas.circuit'), function (c) { return new Circuit(c); });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { circuits.forEach(function (c) { if (c.c === e.target) c.visible = e.isIntersecting; }); });
    });
    circuits.forEach(function (c) { io.observe(c.c); });
  } else circuits.forEach(function (c) { c.visible = true; });

  function sizeCheck(c) {
    if (c.c.clientWidth !== c.w || c.c.clientHeight !== c.h) { if (!c.build()) return false; c.draw(0, 0); }
    return !!c.w;
  }
  var lastT = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    if (document.hidden || now - lastT < 33) return;   // ~30 fps is plenty for this
    var dt = Math.min(0.1, (now - lastT) / 1000); lastT = now;
    circuits.forEach(function (c) { if (c.visible && sizeCheck(c)) c.draw(dt, now); });
  }
  function staticDraw() { circuits.forEach(function (c) { if (sizeCheck(c)) c.draw(0, 0); }); }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { circuits.forEach(function (c) { c.w = 0; }); if (reduce) staticDraw(); });
  if (reduce) { window.addEventListener('resize', staticDraw); }
  else requestAnimationFrame(frame);
})();
