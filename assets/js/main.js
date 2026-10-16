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
    const supportsFilter = "filter" in ctx;
    let W = 0, H = 0, dpr = 1, cells = [], dots = [];
    const lens = { x: 0, y: 0, tx: 0, ty: 0, r: 120 };
    let lastPointer = 0, running = false, t0 = performance.now();

    function setup() {
      const rect = heroCanvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = rect.width; H = rect.height;
      heroCanvas.width = W * dpr; heroCanvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const small = W < 760;
      const scale = small ? 0.8 : 1;
      lens.r = small ? 86 : 130;
      const count = Math.round((W * H) / (small ? 9000 : 13000));
      cells = Array.from({ length: count }, () => makeCell(W, H, scale));
      dots = Array.from({ length: count * 2 }, () => ({ x: rand(0, W), y: rand(0, H), r: rand(1.2, 2.6), vx: rand(-0.1, 0.1), vy: rand(-0.1, 0.1) }));
      if (!lens.x) { lens.x = lens.tx = W * (small ? 0.62 : 0.7); lens.y = lens.ty = H * (small ? 0.22 : 0.48); }
      draw(performance.now());
    }

    function scene(sharp) {
      dots.forEach((d) => {
        ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = sharp ? "rgba(91,75,184,0.75)" : "rgba(91,75,184,0.35)"; ctx.fill();
      });
      cells.forEach((c) => drawCell(ctx, c, sharp));
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
      ctx.save();
      if (supportsFilter) ctx.filter = "blur(2.5px)";
      scene(false);
      ctx.restore();
      // in-focus lens
      ctx.save();
      ctx.beginPath(); ctx.arc(lens.x, lens.y, lens.r, 0, Math.PI * 2); ctx.clip();
      ctx.fillStyle = "#FFFFFF"; ctx.fillRect(lens.x - lens.r, lens.y - lens.r, lens.r * 2, lens.r * 2);
      ctx.translate(lens.x, lens.y); ctx.scale(1.7, 1.7); ctx.translate(-lens.x, -lens.y);
      scene(true);
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
    const captions = ["Sample collected", "HPV positive", "Stained on site", "Reviewed remotely", "Treated on site", "Referred to hospital"];
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

  /* ---------- Wave / Loop switcher ---------- */
  const panel = document.querySelector(".solution-panel");
  const switchBtns = document.querySelectorAll(".switch button");
  function showSolution(name, fromUser) {
    if (!panel) return;
    panel.dataset.active = name;
    switchBtns.forEach((b) => b.setAttribute("aria-selected", String(b.dataset.solution === name)));
    panel.querySelectorAll("[data-for]").forEach((el) => (el.hidden = el.dataset.for !== name));
    panel.querySelectorAll(`[data-for="${name}"] .timeline`).forEach(playTimeline);
    if (fromUser) history.replaceState(null, "", `#${name}`);
  }
  switchBtns.forEach((b) => b.addEventListener("click", () => showSolution(b.dataset.solution, true)));
  if (panel) showSolution(location.hash === "#loop" ? "loop" : "wave", false);

  /* ---------- GyroStainer: run the protocol ---------- */
  const sim = document.getElementById("sim-svg");
  if (sim) {
    const NS = "http://www.w3.org/2000/svg";
    // Stations as built: S1 fan drying, then nine liquid baths. S1→S2 gap is 22.2°, the rest evenly spaced.
    const stations = {
      1: { name: "Fan drying", fill: "#FFFFFF", dry: true },
      2: { name: "Distilled water", fill: "#D9EEF6" },
      3: { name: "Haematoxylin", fill: "#43307F" },
      4: { name: "Bluing reagent", fill: "#5C7FC4" },
      5: { name: "Xylol 2", fill: "#F6F3DF" },
      6: { name: "Ethanol 95% (1)", fill: "#EEF0F8" },
      7: { name: "OG-6 / EA-50", fill: "url(#ea)" },
      8: { name: "Ethanol 95% (2)", fill: "#EEF0F8" },
      9: { name: "Ethanol 95% (3)", fill: "#EEF0F8" },
      10: { name: "Xylol 1", fill: "#F6F3DF" }
    };
    const angleOf = (s) => (s === 1 ? 0 : 22.2 + (s - 2) * ((360 - 22.2) / 9));
    const cx = 200, cy = 200, R = 138;
    const stLayer = sim.querySelector("#stations");
    Object.entries(stations).forEach(([id, st]) => {
      const a = (angleOf(Number(id)) - 90) * Math.PI / 180;
      const x = cx + R * Math.cos(a), y = cy + R * Math.sin(a);
      const grp = document.createElementNS(NS, "g");
      grp.setAttribute("id", `st-${id}`); grp.setAttribute("class", "station");
      const c = document.createElementNS(NS, "circle");
      c.setAttribute("cx", x); c.setAttribute("cy", y); c.setAttribute("r", st.dry ? 17 : 25);
      c.setAttribute("fill", st.fill); c.setAttribute("stroke", "#C6CAE0"); c.setAttribute("stroke-width", "2");
      const ring = document.createElementNS(NS, "circle");
      ring.setAttribute("cx", x); ring.setAttribute("cy", y); ring.setAttribute("r", st.dry ? 17 : 25);
      ring.setAttribute("class", "ripple"); ring.setAttribute("fill", "none");
      const label = document.createElementNS(NS, "text");
      const lx = cx + (R + 44) * Math.cos(a), ly = cy + (R + 44) * Math.sin(a);
      label.setAttribute("x", lx); label.setAttribute("y", ly + 4); label.setAttribute("text-anchor", "middle");
      label.setAttribute("class", "st-label"); label.textContent = `S${id}`;
      grp.append(c, ring, label);
      if (st.dry) {
        const fan = document.createElementNS(NS, "path");
        fan.setAttribute("d", `M${x} ${y - 9} q6 4 0 9 q-6 -5 0 -9 M${x - 9} ${y + 5} q4 -6 9 -5 q-4 6 -9 5 M${x + 9} ${y + 5} q-9 1 -9 -5 q7 0 9 5`);
        fan.setAttribute("fill", C.ink); fan.setAttribute("opacity", ".7");
        grp.append(fan);
      }
      stLayer.append(grp);
    });

    const arm = sim.querySelector("#arm");
    const holder = sim.querySelector("#holder");
    const nameEl = document.getElementById("sim-name");
    const detailEl = document.getElementById("sim-detail");
    const bar = document.getElementById("sim-bar");
    const smear = document.getElementById("sim-smear");
    const runBtn = document.getElementById("sim-run");
    const resetBtn = document.getElementById("sim-reset");

    const protocol = [
      { s: 2, d: "Hydrates the cells before staining." },
      { s: 3, d: "Stains the nuclei, where abnormal cells show their changes.", smear: "#6B5AA8" },
      { s: 2, d: "Rinses off the excess stain." },
      { s: 4, d: "Turns the nuclei a crisp blue-violet.", smear: "#5867B3" },
      { s: 2, d: "Rinses again." },
      { s: 6, d: "Prepares the cells for the cytoplasm stain." },
      { s: 7, d: "Colours the cytoplasm pink or teal, depending on the type of cell.", smear: "linear-gradient(90deg,#E55F9A,#22A4A6 55%,#E55F9A)" },
      { s: 8, d: "Draws water out of the cells." },
      { s: 9, d: "Final dehydration." },
      { s: 1, d: "Fan-dries the slides." },
      { s: 10, d: "Clears the slides so they are transparent under the microscope." },
      { s: 5, d: "Final clearing. The holder waits here until the operator takes the slides out." }
    ];

    let angle = 0, running = false, timer = null, idx = -1;
    const stepMs = reduceMotion ? 900 : 1500;

    function moveTo(station) {
      let target = angleOf(station);
      // rotate forward or backward, whichever is shorter
      let delta = ((target - (angle % 360)) + 540) % 360 - 180;
      angle += delta;
      arm.style.transform = `rotate(${angle}deg)`;
    }
    function dip(station) {
      holder.classList.remove("dip"); void holder.getBBox(); holder.classList.add("dip");
      const rip = sim.querySelector(`#st-${station} .ripple`);
      if (rip) { rip.classList.remove("go"); void rip.getBBox(); rip.classList.add("go"); }
      sim.querySelectorAll(".station").forEach((g) => g.classList.toggle("on", g.id === `st-${station}`));
    }
    function show(i) {
      const p = protocol[i];
      nameEl.textContent = `S${p.s}  ${stations[p.s].name}`;
      detailEl.textContent = p.d;
      bar.style.width = `${((i + 1) / protocol.length) * 100}%`;
      moveTo(p.s);
      setTimeout(() => dip(p.s), reduceMotion ? 0 : 450);
      if (p.smear) smear.style.background = p.smear;
    }
    function next() {
      idx++;
      if (idx >= protocol.length) {
        running = false; runBtn.disabled = false; runBtn.textContent = "Run it again";
        nameEl.textContent = "Done. Six slides, ready for review.";
        detailEl.textContent = "The real protocol takes 21 min 30 s. The slides are then coverslipped and examined under the microscope or scanned for remote review.";
        return;
      }
      show(idx);
      timer = setTimeout(next, stepMs);
    }
    function reset() {
      clearTimeout(timer); running = false; idx = -1;
      runBtn.disabled = false; runBtn.textContent = "Run the protocol";
      nameEl.textContent = "Six slides loaded.";
      detailEl.textContent = "Press run to send them through the twelve steps of a Pap stain.";
      bar.style.width = "0"; smear.style.background = "";
      angle = 0; arm.style.transform = "rotate(0deg)";
      sim.querySelectorAll(".station").forEach((g) => g.classList.remove("on"));
    }
    runBtn.addEventListener("click", () => {
      if (running) return;
      if (idx >= protocol.length - 1) reset();
      running = true; runBtn.disabled = true; runBtn.textContent = "Running…";
      next();
    });
    resetBtn.addEventListener("click", reset);
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

  /* ---------- get involved: tabs + form ---------- */
  const tabBtns = document.querySelectorAll(".tabs [role='tab']");
  const typeSelect = document.getElementById("f-type");
  function selectTab(id, fromUser) {
    tabBtns.forEach((b) => {
      const on = b.getAttribute("aria-controls") === id;
      b.setAttribute("aria-selected", String(on));
      b.tabIndex = on ? 0 : -1;
      document.getElementById(b.getAttribute("aria-controls")).hidden = !on;
    });
    if (typeSelect) typeSelect.value = id === "invest" ? "Investor or funder" : "NGO or health programme";
    if (fromUser) history.replaceState(null, "", `#${id}`);
  }
  tabBtns.forEach((b) => b.addEventListener("click", () => selectTab(b.getAttribute("aria-controls"), true)));
  if (tabBtns.length) selectTab(location.hash === "#invest" ? "invest" : "ngo", false);

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
      const subject = `[${f.get("type")}] Message from ${f.get("name")}${f.get("org") ? " – " + f.get("org") : ""}`;
      const body = `${f.get("message")}\n\n—\n${f.get("name")}\n${f.get("org") || ""}\n${f.get("email")}`;
      window.location.href = `mailto:info@carevix.ch?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      status.textContent = "Your email app should now open with the message ready to send. If nothing happens, write to info@carevix.ch.";
    });
  }
})();
