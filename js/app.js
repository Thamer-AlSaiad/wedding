(() => {
  "use strict";

  const cfg = window.INVITATION;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const t = (ms) => (reduceMotion ? 0 : ms);

  // Without a Google Form the RSVP and thank-you screens are left out entirely (v1).
  const rsvpOn = Boolean(cfg.form && cfg.form.action);
  const ORDER = ["envelope", "verse", "invite", "date", "place"].concat(rsvpOn ? ["rsvp", "thanks"] : []);
  const STEP = { verse: 1, invite: 2, date: 3, place: 4, rsvp: 5, thanks: 5 };
  const bar = $("#bar");
  let current = "envelope";
  let switching = false;
  let depth = 0; // screens pushed in this visit, so Back never leaves the site

  /* ---------- Screens ---------- */
  function updateBar(id) {
    bar.hidden = id === "envelope";
    $$(".progress span").forEach((s, i) => s.classList.toggle("on", i < (STEP[id] || 0)));
  }

  function show(id) {
    const el = document.getElementById(id);
    el.hidden = false;
    void el.offsetWidth; // restart the entrance animation
    el.classList.add("is-active");
    el.scrollTop = 0;
    const body = $(".screen-body", el);
    if (body) body.scrollTop = 0;
    updateBar(id);
    el.setAttribute("tabindex", "-1");
    el.focus({ preventScroll: true });
    current = id;
  }

  async function go(id, { push = true } = {}) {
    if (switching || id === current || !ORDER.includes(id)) return;
    switching = true;
    const from = document.getElementById(current);
    from.classList.add("is-leaving");
    await wait(t(200));
    from.hidden = true;
    from.classList.remove("is-active", "is-leaving", "exit", "opening");
    if (id === "envelope") resetEnvelope();
    if (id === "rsvp") prepareRsvp();
    show(id);
    if (push) { history.pushState({ id }, "", id === "envelope" ? location.pathname : "#" + id); depth++; }
    switching = false;
  }

  document.addEventListener("click", (e) => {
    const link = e.target.closest("[data-go]");
    if (link) { e.preventDefault(); go(link.dataset.go); return; }
    if (e.target.closest("[data-back]")) {
      if (depth > 0) history.back();
      else go(ORDER[Math.max(1, ORDER.indexOf(current) - 1)]);
    }
  });

  addEventListener("popstate", () => {
    depth = Math.max(0, depth - 1);
    const id = location.hash.slice(1);
    go(ORDER.includes(id) ? id : "envelope", { push: false });
  });

  /* ---------- Envelope ---------- */
  const env = $("#env");
  const envScreen = $("#envelope");

  function resetEnvelope() {
    env.classList.remove("broken", "open", "flap-behind", "rise");
    envScreen.classList.remove("opening", "exit");
  }

  $("#seal").addEventListener("click", async () => {
    if (switching) return;
    switching = true;
    startMusic(); // inside the tap, so browsers allow the audio
    envScreen.classList.add("opening");
    env.classList.add("broken");
    await wait(t(260));
    env.classList.add("open");
    await wait(t(300));
    env.classList.add("flap-behind");
    await wait(t(320));
    env.classList.add("rise");
    await wait(t(820));
    envScreen.classList.add("exit");
    await wait(t(420));
    envScreen.hidden = true;
    envScreen.classList.remove("is-active");
    show("verse");
    history.pushState({ id: "verse" }, "", "#verse");
    depth++;
    switching = false;
  });

  /* ---------- Music ---------- */
  const audio = $("#music");
  const musicBtn = $("#musicBtn");
  let fadeFrame = 0;

  function setMusicUi(on) {
    musicBtn.setAttribute("aria-pressed", String(on));
    musicBtn.setAttribute("aria-label", on ? "إيقاف الموسيقى" : "تشغيل الموسيقى");
  }

  function fadeTo(target, ms, done) {
    cancelAnimationFrame(fadeFrame);
    const from = audio.volume, start = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - start) / ms);
      audio.volume = from + (target - from) * k;
      if (k < 1) fadeFrame = requestAnimationFrame(step);
      else if (done) done();
    };
    fadeFrame = requestAnimationFrame(step);
  }

  let musicReady = false;

  function startMusic() {
    if (!musicReady) return;
    if (!audio.src) audio.src = cfg.music;
    audio.volume = 0;
    audio.play().then(() => { setMusicUi(true); fadeTo(0.55, 1500); }).catch(() => setMusicUi(false));
  }

  if (cfg.music) {
    // Only offer music once the file is really there.
    fetch(cfg.music, { method: "HEAD" })
      .then((r) => { if (r.ok) { musicReady = true; musicBtn.hidden = false; } })
      .catch(() => {});
    musicBtn.addEventListener("click", () => {
      if (audio.paused) startMusic();
      else { setMusicUi(false); fadeTo(0, 300, () => audio.pause()); }
    });
  }

  /* ---------- Countdown ---------- */
  const startAt = new Date(cfg.start).getTime();
  const units = Object.fromEntries($$("#countdown [data-unit]").map((b) => [b.dataset.unit, b]));
  const pad = (n) => String(n).padStart(2, "0");
  function tick() {
    let s = Math.floor((startAt - Date.now()) / 1000);
    if (s <= 0) {
      $("#countdown").hidden = true;
      $("#countdownDone").hidden = false;
      return;
    }
    const d = Math.floor(s / 86400); s %= 86400;
    const h = Math.floor(s / 3600); s %= 3600;
    const m = Math.floor(s / 60);
    units.d.textContent = pad(d); units.h.textContent = pad(h);
    units.m.textContent = pad(m); units.s.textContent = pad(s % 60);
    setTimeout(tick, 1000 - (Date.now() % 1000));
  }
  tick();

  /* ---------- Calendar ---------- */
  const utc = (iso) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const title = "حفل زفاف صدام وكريمته";
  const place = "صالة ليالي النجوم، غربي كفر عويد، شمال طريق الرام";
  const details = "الانطلاق من منزل العريس الساعة الخامسة عصراً، ثم حفل الزفاف ووليمة العشاء. يُمنع التصوير في صالة النساء.";

  function addToCalendar() {
    const isApple = /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent) && ("ontouchend" in document || /Mac/.test(navigator.platform));
    if (isApple) {
      const ics = [
        "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//wedding//ar", "BEGIN:VEVENT",
        "UID:saddam-wedding-20261030@invitation", "DTSTAMP:" + utc(new Date().toISOString()),
        "DTSTART:" + utc(cfg.start), "DTEND:" + utc(cfg.end),
        "SUMMARY:" + title, "LOCATION:" + place, "DESCRIPTION:" + details,
        "BEGIN:VALARM", "TRIGGER:-PT3H", "ACTION:DISPLAY", "DESCRIPTION:" + title, "END:VALARM",
        "END:VEVENT", "END:VCALENDAR"
      ].join("\r\n");
      location.href = "data:text/calendar;charset=utf-8," + encodeURIComponent(ics);
      return;
    }
    const url = "https://calendar.google.com/calendar/render?action=TEMPLATE"
      + "&text=" + encodeURIComponent(title)
      + "&dates=" + utc(cfg.start) + "/" + utc(cfg.end)
      + "&location=" + encodeURIComponent(place)
      + "&details=" + encodeURIComponent(details + "\n" + cfg.maps.hall);
    window.open(url, "_blank", "noopener");
  }
  $$("[data-calendar]").forEach((b) => b.addEventListener("click", addToCalendar));

  if (!rsvpOn) {
    $("#toRsvp").hidden = true;
    $("#placeCalendar").hidden = false;
    $(".progress span:last-child").remove();
  }

  /* ---------- Maps ---------- */
  $("#hallMap").href = cfg.maps.hall;
  if (cfg.maps.home) { $("#homeMap").href = cfg.maps.home; $("#homeMap").hidden = false; }

  /* ---------- RSVP ---------- */
  const form = $("#rsvpForm");
  const nameInput = $("#guestName");
  const counts = { men: 1, women: 0 };
  const MAX = 15;
  const store = {
    get() { try { return JSON.parse(localStorage.getItem("rsvp")); } catch { return null; } },
    set(v) { try { localStorage.setItem("rsvp", JSON.stringify(v)); } catch { /* private mode */ } }
  };

  $("#deadline").textContent = cfg.rsvpDeadlineText;

  function renderCounts() {
    $("#menOut").textContent = counts.men;
    $("#womenOut").textContent = counts.women;
    $$("[data-step]").forEach((b) => {
      const n = counts[b.dataset.step] + Number(b.dataset.d);
      b.disabled = n < 0 || n > MAX;
    });
    if (counts.men + counts.women > 0) $("#countError").hidden = true;
  }

  $$("[data-step]").forEach((b) => b.addEventListener("click", () => {
    const k = b.dataset.step;
    counts[k] = Math.max(0, Math.min(MAX, counts[k] + Number(b.dataset.d)));
    renderCounts();
  }));

  const attending = () => form.elements.attend.value === "yes";
  form.addEventListener("change", (e) => {
    if (e.target.name === "attend") $("#countsField").hidden = !attending();
  });
  nameInput.addEventListener("input", () => {
    nameInput.removeAttribute("aria-invalid");
    $("#nameError").hidden = true;
  });

  function prepareRsvp() {
    const prev = store.get();
    $("#prevNote").hidden = !prev;
    if (prev && !nameInput.value) nameInput.value = prev.name;
  }

  async function send(data) {
    const f = cfg.form;
    if (!f.action) return "preview";
    const body = new URLSearchParams();
    body.append(f.fields.name, data.name);
    body.append(f.fields.attend, data.attend ? "سأحضر" : "أعتذر");
    body.append(f.fields.men, String(data.men));
    body.append(f.fields.women, String(data.women));
    if (f.fields.wish) body.append(f.fields.wish, data.wish);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12000);
    try {
      // Google Forms doesn't allow reading the reply from another site; a completed request means it arrived.
      await fetch(f.action, { method: "POST", mode: "no-cors", body, signal: ctrl.signal });
      return "sent";
    } finally {
      clearTimeout(timer);
    }
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    const yes = attending();
    let ok = true;
    if (name.length < 2) {
      nameInput.setAttribute("aria-invalid", "true");
      $("#nameError").hidden = false;
      ok = false;
    }
    if (yes && counts.men + counts.women === 0) { $("#countError").hidden = false; ok = false; }
    if (!ok) { (name.length < 2 ? nameInput : $("[data-step]")).focus(); return; }

    const data = { name, attend: yes, men: yes ? counts.men : 0, women: yes ? counts.women : 0, wish: $("#wish").value.trim() };
    const btn = $("#sendBtn");
    btn.disabled = true;
    btn.textContent = "جارٍ الإرسال…";
    $("#sendError").hidden = true;
    try {
      const result = await send(data);
      store.set({ ...data, at: Date.now() });
      fillThanks(data, result === "preview");
      go("thanks");
    } catch {
      $("#sendError").hidden = false;
    } finally {
      btn.disabled = false;
      btn.textContent = "إرسال الرد";
    }
  });

  function fillThanks(data, preview) {
    $("#thanksTitle").textContent = data.attend ? "شكراً لكم" : "شكراً لإبلاغنا";
    $("#thanksText").textContent = data.attend
      ? `وصلنا ردّك يا ${data.name}، وننتظركم بكل محبة`
      : `وصلنا ردّك يا ${data.name}، نتمنى لكم كل الخير`;
    $("#summary").hidden = !data.attend;
    $("#sumMen").textContent = data.men;
    $("#sumWomen").textContent = data.women;
    $("#previewNote").hidden = !preview;
  }

  renderCounts();

  /* ---------- Start ---------- */
  const startId = location.hash.slice(1);
  if (ORDER.includes(startId) && startId !== "envelope") {
    if (startId === "thanks") {
      const prev = store.get();
      if (prev) fillThanks(prev, !cfg.form.action);
    }
    envScreen.hidden = true;
    envScreen.classList.remove("is-active");
    if (startId === "rsvp") prepareRsvp();
    show(startId === "thanks" && !store.get() ? "rsvp" : startId);
    history.replaceState({ id: current }, "", "#" + current);
  } else {
    updateBar("envelope");
  }
})();
