// ===== Nav scroll state =====
const nav = document.getElementById('nav');
const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 16);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// ===== Reveal on scroll =====
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach((el, i) => {
  el.style.transitionDelay = `${Math.min(i % 6, 5) * 70}ms`;
  io.observe(el);
});

// ===== Synced lyrics engine (hero mockup) =====
const LYRICS = [
  "When the city lights start to fade",
  "Driving down the avenue tonight",
  "Every neon sign feels like home",
  "Holding on to everything we are",
  "Underneath the glow of midnight skies",
  "We don't ever have to say goodbye",
];
const linesEl = document.getElementById('lyricLines');
let fontPx = 30;           // controlled by popup
let active = 0;

function buildLyrics() {
  linesEl.innerHTML = '';
  LYRICS.forEach((t, i) => {
    const d = document.createElement('div');
    d.className = 'lyric-line';
    d.textContent = t;
    d.dataset.idx = i;
    linesEl.appendChild(d);
  });
  renderLyrics();
}

function renderLyrics() {
  const nodes = linesEl.querySelectorAll('.lyric-line');
  nodes.forEach((n, i) => {
    n.classList.toggle('active', i === active);
    n.classList.toggle('passed', i < active);
    // active line scales relative to base font; neighbours smaller
    const dist = Math.abs(i - active);
    let size = fontPx;
    if (i === active) size = fontPx * 1.18;
    else if (dist === 1) size = fontPx * 0.82;
    else size = fontPx * 0.66;
    n.style.fontSize = `clamp(13px, ${size / 16}rem, ${fontPx * 1.4}px)`;
    n.style.opacity = i === active ? '1' : Math.max(0.22, 0.5 - dist * 0.12);
  });
}

buildLyrics();
let lyricTimer = setInterval(() => {
  active = (active + 1) % LYRICS.length;
  renderLyrics();
}, 2600);

// ===== Popup: overlay toggle =====
const toggle = document.getElementById('overlayToggle');
const overlay = document.getElementById('overlay');
toggle.addEventListener('click', () => {
  const on = !toggle.classList.contains('is-on');
  toggle.classList.toggle('is-on', on);
  toggle.setAttribute('aria-checked', String(on));
  overlay.classList.toggle('is-hidden', !on);
});

// ===== Popup: font size controls (sync preview + mockup) =====
const slider = document.getElementById('fontSlider');
const fontVal = document.getElementById('fontVal');
const previewText = document.getElementById('previewText');
const sizeBtns = [...document.querySelectorAll('.size-btn')];

function setFont(px, fromSlider) {
  px = Math.round(px);
  fontPx = px;
  fontVal.textContent = px;
  // preview text scaled into the small card
  previewText.style.fontSize = Math.min(px, 34) + 'px';
  // slider fill + value
  if (!fromSlider) slider.value = px;
  const pct = ((px - slider.min) / (slider.max - slider.min)) * 100;
  slider.style.setProperty('--pct', pct + '%');
  // active button = nearest breakpoint
  let best = sizeBtns[0], bestD = Infinity;
  sizeBtns.forEach(b => { const d = Math.abs(+b.dataset.size - px); if (d < bestD) { bestD = d; best = b; } });
  sizeBtns.forEach(b => b.classList.toggle('is-active', b === best && bestD <= 4));
  renderLyrics();
}

slider.addEventListener('input', () => setFont(+slider.value, true));
sizeBtns.forEach(b => b.addEventListener('click', () => setFont(+b.dataset.size, false)));
setFont(30, false);

// pause lyric rotation when tab hidden (perf)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) clearInterval(lyricTimer);
  else lyricTimer = setInterval(() => { active = (active + 1) % LYRICS.length; renderLyrics(); }, 2600);
});

// ===== Feedback form =====
const FEEDBACK_EMAIL = "feedback@lyricsoverlay.app"; // change to your real inbox
const fbForm = document.getElementById('feedbackForm');
const fbStatus = document.getElementById('fbStatus');
const fbTopics = [...document.querySelectorAll('.fb-topic')];
let fbTopic = "Bug report";

fbTopics.forEach(b => b.addEventListener('click', () => {
  fbTopics.forEach(x => x.classList.remove('is-active'));
  b.classList.add('is-active');
  fbTopic = b.dataset.topic;
}));

if (fbForm) {
  fbForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('fbName');
    const email = document.getElementById('fbEmail');
    const msg = document.getElementById('fbMessage');
    let ok = true;
    [name, email, msg].forEach(f => {
      const bad = !f.value.trim() || (f.type === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.value));
      f.classList.toggle('invalid', bad);
      if (bad) ok = false;
    });
    if (!ok) { fbStatus.textContent = "Please fill in all fields with a valid email."; fbStatus.style.color = "#FF6b6b"; return; }

    const subject = encodeURIComponent(`[Lyrics Overlay] ${fbTopic} — ${name.value.trim()}`);
    const body = encodeURIComponent(
      `Name: ${name.value.trim()}\nEmail: ${email.value.trim()}\nTopic: ${fbTopic}\n\nMessage:\n${msg.value.trim()}`
    );
    window.location.href = `mailto:${FEEDBACK_EMAIL}?subject=${subject}&body=${body}`;
    fbStatus.textContent = "Opening your email app…";
    fbStatus.style.color = "#A0A0A0";
    setTimeout(() => {
      fbStatus.textContent = "Thanks! Your message is ready to send in your email app.";
      fbForm.reset();
      fbTopics.forEach((x,i)=>x.classList.toggle('is-active', i===0));
      fbTopic = "Bug report";
    }, 900);
  });
}
