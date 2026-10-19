/* CareVix — site interactions. No dependencies. */
(function () {
  "use strict";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const C = { ink: "#1E2657", pink: "#E55F9A", violet: "#5B4BB8", teal: "#22A4A6" };

  /* ---------- header ---------- */
  const header = document.querySelector(".site-header");
  const onScroll = () => header && header.classList.toggle("scrolled", window.scrollY > 8);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const toggle = document.querySelector(".menu-toggle");
  const links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", () => {
      const open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    links.addEventListener("click", (e) => {
      if (e.target.closest("a")) { links.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); }
    });
  }

  const yr = document.getElementById("year");
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- cell drawing helpers ---------- */
  const rand = (a, b) => a + Math.random() * (b - a);
  function makeCell(w, h, scale) {
    const palette = [
      [229, 95, 154],  // pink (eosinophilic)
      [34, 164, 166],  // teal (cyanophilic)
      [34, 164, 166],
      [126, 168, 214], // pale blue
      [156, 145, 230]  // pale violet
    ];
    const col = palette[Math.floor(Math.random() * palette.length)];
    const r = rand(26, 46) * scale;
    const pts = [];
    const n = 16, ph = rand(0, 6.28), k = Math.floor(rand(2, 4));
    for (let i = 0; i < n; i++) {
      const t = (i / n) * Math.PI * 2;
      pts.push([Math.cos(t), Math.sin(t), 1 + 0.09 * Math.sin(k * t + ph) + rand(-0.03, 0.03)]);
    }
    return {
      x: rand(0, w), y: rand(0, h), r, sx: rand(0.75, 1.15), sy: rand(0.6, 1),
      rot: rand(0, 6.28), vr: rand(-0.0006, 0.0006),
      vx: rand(-0.09, 0.09), vy: rand(-0.06, 0.06),
      col, pts, nx: rand(-0.15, 0.15), ny: rand(-0.12, 0.12), nr: rand(3.2, 5.2) * scale
    };
  }
  function drawCell(ctx, c, sharp) {
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.rot);
    ctx.beginPath();
    c.pts.forEach((p, i) => {
      const px = p[0] * c.r * c.sx * p[2], py = p[1] * c.r * c.sy * p[2];
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    });
    ctx.closePath();
    const [r, g, b] = c.col;
    ctx.fillStyle = `rgba(${r},${g},${b},${sharp ? 0.42 : 0.3})`;
    ctx.fill();
    ctx.lineWidth = sharp ? 1.4 : 1;
    ctx.strokeStyle = `rgba(${r},${g},${b},${sharp ? 0.85 : 0.5})`;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(c.nx * c.r, c.ny * c.r, c.nr * 1.15, c.nr, 0.4, 0, Math.PI * 2);
    ctx.fillStyle = sharp ? "rgba(52,38,128,0.92)" : "rgba(52,38,128,0.55)";
    ctx.fill();
    ctx.restore();
  }

  /* ---------- hero: a slide under a moving lens ---------- */
  const heroCanvas = document.getElementById("cells");
  if (heroCanvas) {
    const ctx = heroCanvas.getContext("2d");
    // The out-of-focus field is drawn small and stretched up: the upscale gives the
    // blur for free (a canvas blur filter is re-applied per shape and is very slow).
    const field = document.createElement("canvas");
    const fctx = field.getContext("2d");
    const FIELD_SCALE = 0.3;
    const ZOOM = 1.7;
    let W = 0, H = 0, dpr = 1, cells = [], dots = [];
    const lens = { x: 0, y: 0, tx: 0, ty: 0, r: 120 };
    let lastPointer = 0, running = false, t0 = performance.now();

    function setup() {
      const rect = heroCanvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = rect.width; H = rect.height;
      heroCanvas.width = W * dpr; heroCanvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      field.width = Math.max(1, Math.ceil(W * FIELD_SCALE)); field.height = Math.max(1, Math.ceil(H * FIELD_SCALE));
      fctx.setTransform(FIELD_SCALE, 0, 0, FIELD_SCALE, 0, 0);
      const small = W < 760;
      const scale = small ? 0.8 : 1;
      lens.r = small ? 86 : 130;
      const count = Math.round((W * H) / (small ? 9000 : 13000));
      cells = Array.from({ length: count }, () => makeCell(W, H, scale));
      dots = Array.from({ length: count * 2 }, () => ({ x: rand(0, W), y: rand(0, H), r: rand(1.2, 2.6), vx: rand(-0.1, 0.1), vy: rand(-0.1, 0.1) }));
      if (!lens.x) { lens.x = lens.tx = W * (small ? 0.62 : 0.7); lens.y = lens.ty = H * (small ? 0.22 : 0.48); }
      draw(performance.now());
    }

    // Draws the slide into g. With `near`, skips anything that can't show inside the lens.
    function scene(g, sharp, near) {
      const reach = near ? lens.r / ZOOM : Infinity;
      const visible = (x, y, pad) => !near || Math.hypot(x - lens.x, y - lens.y) < reach + pad;
      g.fillStyle = sharp ? "rgba(91,75,184,0.75)" : "rgba(91,75,184,0.35)";
      g.beginPath();
      dots.forEach((d) => {
        if (!visible(d.x, d.y, d.r)) return;
        g.moveTo(d.x + d.r, d.y); g.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      });
      g.fill();
      cells.forEach((c) => { if (visible(c.x, c.y, c.r * 1.3)) drawCell(g, c, sharp); });
    }

    function step(now) {
      const dt = Math.min(now - t0, 50); t0 = now;
      cells.forEach((c) => {
        c.x += c.vx * dt * 0.06; c.y += c.vy * dt * 0.06; c.rot += c.vr * dt;
        const m = c.r * 1.3;
        if (c.x < -m) c.x = W + m; if (c.x > W + m) c.x = -m;
        if (c.y < -m) c.y = H + m; if (c.y > H + m) c.y = -m;
      });
      dots.forEach((d) => {
        d.x += d.vx * dt * 0.06; d.y += d.vy * dt * 0.06;
        if (d.x < 0) d.x = W; if (d.x > W) d.x = 0; if (d.y < 0) d.y = H; if (d.y > H) d.y = 0;
      });
      if (now - lastPointer > 2500) {
        const s = now / 1000, small = W < 760;
        lens.tx = W * (small ? 0.55 : 0.7) + Math.sin(s * 0.35) * W * (small ? 0.25 : 0.14);
        lens.ty = H * (small ? 0.2 : 0.5) + Math.sin(s * 0.5) * H * (small ? 0.08 : 0.18);
      }
      lens.x += (lens.tx - lens.x) * 0.08;
      lens.y += (lens.ty - lens.y) * 0.08;
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      // out-of-focus field
      fctx.clearRect(0, 0, W, H);
      scene(fctx, false, false);
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(field, 0, 0, W, H);
      // in-focus lens
      ctx.save();
      ctx.beginPath(); ctx.arc(lens.x, lens.y, lens.r, 0, Math.PI * 2); ctx.clip();
      ctx.fillStyle = "#FFFFFF"; ctx.fillRect(lens.x - lens.r, lens.y - lens.r, lens.r * 2, lens.r * 2);
      ctx.translate(lens.x, lens.y); ctx.scale(ZOOM, ZOOM); ctx.translate(-lens.x, -lens.y);
      scene(ctx, true, true);
      ctx.restore();
      ctx.beginPath(); ctx.arc(lens.x, lens.y, lens.r, 0, Math.PI * 2);
      ctx.lineWidth = 2; ctx.strokeStyle = C.ink; ctx.stroke();
      ctx.beginPath(); ctx.arc(lens.x, lens.y, lens.r + 8, 0, Math.PI * 2);
      ctx.lineWidth = 1; ctx.strokeStyle = "rgba(30,38,87,0.18)"; ctx.stroke();
    }

    function loop(now) {
      if (!running) return;
      step(now); draw();
      requestAnimationFrame(loop);
    }

    const hero = heroCanvas.closest(".hero");
    hero.addEventListener("pointermove", (e) => {
      const r = heroCanvas.getBoundingClientRect();
      lens.tx = e.clientX - r.left; lens.ty = e.clientY - r.top; lastPointer = performance.now();
      if (reduceMotion) { lens.x = lens.tx; lens.y = lens.ty; draw(); }
    });

    window.addEventListener("resize", () => { lens.x = 0; setup(); });
    setup();
    if (!reduceMotion) {
      new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting && !running) { running = true; t0 = performance.now(); requestAnimationFrame(loop); }
        else if (!entry.isIntersecting) running = false;
      }).observe(hero);
    }
  }

  /* ---------- pathway: scroll-driven story of one sample ---------- */
  const pathSvg = document.getElementById("pathway-svg");
  if (pathSvg) {
    const NS = "http://www.w3.org/2000/svg";
    const g = pathSvg.querySelector("#pw-cells");
    const stainCols = [C.pink, C.teal, C.teal, "#7EA8D6", C.pink, "#9C91E6"];
    const cellEls = [];
    // place cells inside the circle (centre 240,240, r 190)
    const spots = [[170,170],[290,150],[330,250],[230,300],[150,280],[260,215],[350,330],[190,370],[300,370],[130,210],[390,190],[220,120]];
    spots.forEach(([x, y], i) => {
      const grp = document.createElementNS(NS, "g");
      grp.setAttribute("transform", `translate(${x} ${y}) rotate(${(i * 47) % 180})`);
      const body = document.createElementNS(NS, "ellipse");
      body.setAttribute("rx", 34 - (i % 3) * 4); body.setAttribute("ry", 24 - (i % 2) * 4);
      body.setAttribute("class", "pw-body");
      body.style.setProperty("--stain", stainCols[i % stainCols.length]);
      const nuc = document.createElementNS(NS, "ellipse");
      nuc.setAttribute("rx", i === 5 ? 11 : 5.5); nuc.setAttribute("ry", i === 5 ? 9 : 4.5);
      nuc.setAttribute("cx", (i % 3) - 1); nuc.setAttribute("class", "pw-nuc");
      grp.append(body, nuc); g.append(grp); cellEls.push(grp);
    });
    const caption = pathSvg.querySelector("#pw-caption");
    const steps = document.querySelectorAll(".pathway-step");
    const captions = ["Self-sample collected", "HPV positive", "Pap-stained on site", "Read remotely", "Treated on site", "Referred to hospital"];
    function setStep(n) {
      pathSvg.setAttribute("data-step", n);
      if (caption) caption.textContent = captions[n - 1] || "";
      steps.forEach((s) => s.classList.toggle("active", Number(s.dataset.step) === n));
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) setStep(Number(en.target.dataset.step)); });
    }, { rootMargin: "-45% 0px -45% 0px" });
    steps.forEach((s) => io.observe(s));
    setStep(1);
  }

  /* ---------- timelines play when seen ---------- */
  function playTimeline(list) {
    list.classList.remove("play");
    const items = list.querySelectorAll("li");
    items.forEach((li, i) => (li.style.transitionDelay = reduceMotion ? "0ms" : `${i * 90}ms`));
    void list.offsetWidth;
    list.classList.add("play");
  }
  const tlObserver = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { playTimeline(en.target); tlObserver.unobserve(en.target); } });
  }, { threshold: 0.2 });
  document.querySelectorAll(".timeline").forEach((t) => tlObserver.observe(t));

  /* ---------- GyroStainer: the protocol on a loop ---------- */
  const sim = document.getElementById("sim-svg");
  if (sim) {
    const NS = "http://www.w3.org/2000/svg";
    // Ten evenly spaced stations, numbered counterclockwise from the top, as on the device.
    const stations = {
      1: { name: "Fan drying", fill: "#FFFFFF", dry: true },
      2: { name: "Distilled water", fill: "#D9EEF6" },
      3: { name: "Haematoxylin", fill: "#43307F", dark: true },
      4: { name: "Bluing reagent", fill: "#5C7FC4", dark: true },
      5: { name: "Xylene 2", fill: "#F6F3DF" },
      6: { name: "Ethanol 95%", fill: "#EEF0F8" },
      7: { name: "OG-6 / EA-50", fill: "url(#ea)", swatch: "linear-gradient(90deg,#E55F9A,#22A4A6 55%,#E55F9A)", dark: true },
      8: { name: "Ethanol 95%", fill: "#EEF0F8" },
      9: { name: "Ethanol 95%", fill: "#EEF0F8" },
      10: { name: "Xylene 1", fill: "#F6F3DF" }
    };
    const angleOf = (s) => -(s - 1) * 36;
    const cx = 200, cy = 200, R = 140;
    const stLayer = sim.querySelector("#stations");
    Object.entries(stations).forEach(([id, st]) => {
      const a = (angleOf(Number(id)) - 90) * Math.PI / 180;
      const x = cx + R * Math.cos(a), y = cy + R * Math.sin(a);
      const grp = document.createElementNS(NS, "g");
      grp.setAttribute("id", `st-${id}`); grp.setAttribute("class", "station");
      const c = document.createElementNS(NS, "circle");
      c.setAttribute("cx", x); c.setAttribute("cy", y); c.setAttribute("r", 27);
      c.setAttribute("fill", st.fill); c.setAttribute("stroke", "#C6CAE0"); c.setAttribute("stroke-width", "2");
      const ring = document.createElementNS(NS, "circle");
      ring.setAttribute("cx", x); ring.setAttribute("cy", y); ring.setAttribute("r", 27);
      ring.setAttribute("class", "ripple"); ring.setAttribute("fill", "none");
      grp.append(c, ring);
      if (st.dry) {
        const fan = document.createElementNS(NS, "path");
        fan.setAttribute("d", `M${x} ${y - 10} q7 5 0 10 q-7 -5 0 -10 M${x - 10} ${y + 6} q4 -7 10 -6 q-4 7 -10 6 M${x + 10} ${y + 6} q-10 1 -10 -6 q8 0 10 6`);
        fan.setAttribute("fill", C.ink); fan.setAttribute("opacity", ".55");
        grp.append(fan);
      } else {
        const num = document.createElementNS(NS, "text");
        num.setAttribute("x", x); num.setAttribute("y", y + 5); num.setAttribute("text-anchor", "middle");
        num.setAttribute("class", "st-num"); num.setAttribute("fill", st.dark ? "#fff" : C.ink);
        num.textContent = id;
        grp.append(num);
      }
      stLayer.append(grp);
    });

    const arm = sim.querySelector("#arm");
    const holder = sim.querySelector("#holder");
    const statusEl = document.getElementById("sim-status");
    const bar = document.getElementById("sim-bar");
    const smear = document.getElementById("sim-smear");
    const list = document.getElementById("sim-steps");
    const pauseBtn = document.getElementById("sim-pause");

    const protocol = [
      { s: 2, d: "Hydrates the cells" },
      { s: 3, d: "Stains the nuclei", smear: "#6B5AA8" },
      { s: 2, d: "Rinses off excess stain" },
      { s: 4, d: "Turns the nuclei blue-violet", smear: "#5867B3" },
      { s: 2, d: "Rinses again" },
      { s: 6, d: "Prepares the cytoplasm" },
      { s: 7, d: "Stains the cytoplasm pink or teal", smear: "linear-gradient(90deg,#E55F9A,#22A4A6 55%,#E55F9A)" },
      { s: 8, d: "Dehydrates" },
      { s: 9, d: "Final dehydration" },
      { s: 1, d: "Dries the slides" },
      { s: 10, d: "Clears the slides" },
      { s: 5, d: "Final clearing" }
    ];
    const items = protocol.map((p) => {
      const st = stations[p.s];
      const li = document.createElement("li");
      li.innerHTML = `<span class="st-badge${st.dark ? " dark" : ""}" style="background:${st.swatch || st.fill}">${p.s}</span><span><strong>${st.name}</strong><small>${p.d}</small></span>`;
      list.append(li);
      return li;
    });

    let angle = 0, idx = -1, timer = null, paused = false, visible = false;
    const stepMs = 1600;
    const restMs = 3500;

    function moveTo(station) {
      const delta = ((angleOf(station) - (angle % 360)) + 540) % 360 - 180;
      angle += delta;
      arm.style.transform = `rotate(${angle}deg)`;
    }
    function dip(station) {
      holder.classList.remove("dip"); void holder.getBBox(); holder.classList.add("dip");
      const rip = sim.querySelector(`#st-${station} .ripple`);
      if (rip) { rip.classList.remove("go"); void rip.getBBox(); rip.classList.add("go"); }
    }
    function highlight(i) {
      items.forEach((li, j) => { li.classList.toggle("on", j === i); li.classList.toggle("done", j < i); });
      const s = i >= 0 && i < protocol.length ? protocol[i].s : null;
      sim.querySelectorAll(".station").forEach((g) => g.classList.toggle("on", g.id === `st-${s}`));
    }
    function reset() {
      idx = -1; angle = 0; arm.style.transform = "rotate(0deg)";
      bar.style.width = "0"; smear.style.background = "";
      statusEl.textContent = "Four slides loaded";
      highlight(-1);
    }
    function schedule(ms) { clearTimeout(timer); timer = setTimeout(tick, ms); }
    function tick() {
      timer = null;
      if (paused || !visible) return;
      idx++;
      if (idx >= protocol.length) {
        idx = protocol.length;
        statusEl.textContent = "Done: four slides ready for review";
        highlight(protocol.length);
        timer = setTimeout(() => { timer = null; if (paused || !visible) return; reset(); schedule(900); }, restMs);
        return;
      }
      const p = protocol[idx];
      statusEl.textContent = `Step ${idx + 1} of ${protocol.length}`;
      bar.style.width = `${((idx + 1) / protocol.length) * 100}%`;
      highlight(idx);
      moveTo(p.s);
      setTimeout(() => dip(p.s), reduceMotion ? 0 : 500);
      if (p.smear) smear.style.background = p.smear;
      schedule(stepMs);
    }

    pauseBtn.addEventListener("click", () => {
      paused = !paused;
      pauseBtn.setAttribute("aria-pressed", String(paused));
      pauseBtn.textContent = paused ? "Play" : "Pause";
      if (!paused) { if (idx >= protocol.length) reset(); schedule(200); }
    });
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !paused && !timer) {
        if (idx >= protocol.length) reset();
        schedule(600);
      }
    }, { threshold: 0.3 }).observe(sim);
    reset();
  }

  /* ---------- microscope magnifier ---------- */
  document.querySelectorAll(".scope").forEach((scope) => {
    const img = scope.querySelector("img");
    const lensEl = scope.querySelector(".scope-lens");
    const zoom = 2.4;
    function place(e) {
      const r = scope.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      if (x < 0 || y < 0 || x > r.width || y > r.height) return;
      lensEl.style.left = `${x}px`; lensEl.style.top = `${y}px`;
      lensEl.style.backgroundImage = `url("${img.currentSrc || img.src}")`;
      lensEl.style.backgroundSize = `${r.width * zoom}px ${r.height * zoom}px`;
      lensEl.style.backgroundPosition = `${-x * zoom + lensEl.offsetWidth / 2}px ${-y * zoom + lensEl.offsetHeight / 2}px`;
      scope.classList.add("lens-on");
    }
    scope.addEventListener("pointermove", place);
    scope.addEventListener("pointerdown", place);
    scope.addEventListener("pointerleave", () => scope.classList.remove("lens-on"));
  });
  document.querySelectorAll(".scope-picker button").forEach((b) => {
    b.addEventListener("click", () => {
      const scope = document.getElementById(b.dataset.target);
      const img = scope.querySelector("img");
      img.src = b.dataset.src; img.alt = b.dataset.alt;
      document.getElementById(`${b.dataset.target}-caption`).textContent = b.dataset.caption;
      b.parentElement.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    });
  });

  /* ---------- telecytology: simulated review ---------- */
  const platform = document.getElementById("platform");
  if (platform) {
    const cases = [
      { code: "CVX-7F3A", age: 41, hpv: "Positive (careHPV)", site: "Wave, mobile unit", img: "assets/img/pap-field-1.jpg" },
      { code: "CVX-2C91", age: 36, hpv: "Positive (GeneXpert)", site: "Loop, fixed clinic", img: "assets/img/pap-field-2.jpg" },
      { code: "CVX-B804", age: 47, hpv: "Positive (careHPV)", site: "Wave, mobile unit", img: "assets/img/pap-field-hsil.jpg" }
    ];
    const nextSteps = {
      "NILM": "No lesion seen. No treatment is needed, and the woman is told when to come back for screening.",
      "ASC-US": "Low-grade changes. The site follows up as set in the programme protocol.",
      "LSIL": "Low-grade lesion. The site follows up as set in the programme protocol.",
      "ASC-H": "A high-grade lesion can't be excluded. The woman is assessed for thermal ablation.",
      "HSIL": "High-grade lesion. The woman is assessed and offered thermal ablation on site.",
      "Suspicious for cancer": "The woman is referred to a hospital for specialised care."
    };
    const queue = platform.querySelectorAll(".pf-queue button");
    const img = platform.querySelector(".scope img");
    const fields = {};
    platform.querySelectorAll("[data-f]").forEach((el) => (fields[el.dataset.f] = el));
    const report = platform.querySelector(".pf-report form");
    const sent = platform.querySelector(".pf-sent");
    const results = new Map();
    let current = 0;
    function showSent(result) {
      sent.hidden = !result;
      if (!result) return;
      sent.querySelector("[data-s='code']").textContent = cases[current].code;
      sent.querySelector("[data-s='result']").textContent = result;
      sent.querySelector("[data-s='next']").textContent = nextSteps[result];
    }
    function open(i) {
      current = i;
      const c = cases[i];
      queue.forEach((b, j) => b.setAttribute("aria-current", String(j === i)));
      img.src = c.img;
      Object.keys(fields).forEach((k) => (fields[k].textContent = c[k]));
      report.reset();
      report.querySelector(".pf-status").textContent = "";
      const prev = results.get(i);
      if (prev) report.querySelector(`input[value="${prev}"]`).checked = true;
      showSent(prev);
    }
    queue.forEach((b, i) => b.addEventListener("click", () => open(i)));
    report.addEventListener("submit", (e) => {
      e.preventDefault();
      const choice = report.querySelector("input[name='dx']:checked");
      const status = report.querySelector(".pf-status");
      if (!choice) { status.textContent = "Choose a result first."; return; }
      status.textContent = "";
      results.set(current, choice.value);
      queue[current].classList.add("reviewed");
      showSent(choice.value);
    });
    open(0);
  }

  /* ---------- contact: topic picker + form ---------- */
  const typeSelect = document.getElementById("f-type");
  const msg = document.getElementById("f-msg");
  if (typeSelect) {
    const prompts = {};
    typeSelect.querySelectorAll("option").forEach((o) => (prompts[o.value] = o.dataset.prompt || ""));
    const setTopic = (topic) => {
      if (!(topic in prompts)) return;
      typeSelect.value = topic;
      msg.placeholder = prompts[topic];
      document.querySelectorAll(".topic-card").forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.topic === topic)));
    };
    typeSelect.addEventListener("change", () => setTopic(typeSelect.value));
    document.querySelectorAll(".topic-card").forEach((c) => c.addEventListener("click", () => {
      setTopic(c.dataset.topic);
      // On wide screens the form sits beside the cards, so there is nothing to scroll to.
      msg.focus({ preventScroll: window.innerWidth > 860 });
    }));
    setTopic(new URLSearchParams(location.search).get("topic") || typeSelect.value);
  }

  const form = document.getElementById("contact-form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const f = new FormData(form);
      const status = document.getElementById("form-status");
      if (!f.get("name") || !f.get("email") || !f.get("message")) {
        status.textContent = "Add your name, email and a message so we can reply.";
        return;
      }
      const label = typeSelect.options[typeSelect.selectedIndex].text;
      const subject = `[${label}] Message from ${f.get("name")}${f.get("org") ? " – " + f.get("org") : ""}`;
      const body = `${f.get("message")}\n\n—\n${f.get("name")}\n${f.get("org") || ""}\n${f.get("email")}`;
      window.location.href = `mailto:info@carevix.ch?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      status.textContent = "Your email app should now open with the message ready to send. If nothing happens, write to info@carevix.ch.";
    });
  }
})();
