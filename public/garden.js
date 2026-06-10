/* Nina's Garden 2026 — Interactive behaviours */

// ── Scroll reveal ────────────────────────────────────────────────
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
);
document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

// ── Like buttons (simple heart) ──────────────────────────────────
document.querySelectorAll('.like-btn').forEach((btn) => {
  const id = btn.dataset.stopId;
  const key = `like_${id}`;
  if (localStorage.getItem(key) === 'true') {
    btn.setAttribute('aria-pressed', 'true');
    btn.classList.add('is-loved');
  }
  btn.addEventListener('click', () => {
    const next = btn.getAttribute('aria-pressed') !== 'true';
    btn.setAttribute('aria-pressed', String(next));
    btn.classList.toggle('is-loved', next);
    localStorage.setItem(key, String(next));
    if (next && navigator.vibrate) navigator.vibrate(8);
  });
});

// ── Garden map — tap node to open stop modal ─────────────────────
(function initGardenMap() {
  const nodes  = Array.from(document.querySelectorAll('.map-node'));
  const labels = Array.from(document.querySelectorAll('.map-node-label'));
  if (!nodes.length) return;

  // Set real path length so CSS animation draws accurately
  const bgPath = document.getElementById('mapPathBg');
  if (bgPath) {
    const len = bgPath.getTotalLength();
    bgPath.style.strokeDasharray  = String(len);
    bgPath.style.strokeDashoffset = String(len);
  }

  // Stagger nodes + labels in after path finishes drawing (~1.8s path + small lead)
  const BASE_DELAY = 1.4; // seconds — first node appears here
  const STEP       = 0.10; // seconds between each node
  nodes.forEach((node, i) => {
    const delay = (BASE_DELAY + i * STEP).toFixed(2) + 's';
    node.style.setProperty('--node-delay', delay);
  });
  labels.forEach((label, i) => {
    const delay = (BASE_DELAY + 0.15 + i * STEP).toFixed(2) + 's';
    label.style.setProperty('--node-delay', delay);
  });

  let openerEl = null; // the node that opened the current modal (for focus return)

  function openModal(stopId, triggerEl) {
    closeAllModals(false); // close any open modal without returning focus
    const modal = document.getElementById('stop-modal-' + stopId);
    if (!modal) return;
    openerEl = triggerEl ?? null;
    modal.classList.add('is-active');
    document.body.style.overflow = 'hidden';
    // Mark node as active
    nodes.forEach((n) => n.classList.toggle('is-active', n.dataset.stopId === stopId));
    // Focus the close button once the modal is visible
    const closeBtn = modal.querySelector('.stop-modal-close');
    if (closeBtn) setTimeout(() => closeBtn.focus(), 30);
  }

  function closeAllModals(returnFocus = true) {
    document.querySelectorAll('.stop-modal.is-active').forEach((m) => {
      m.classList.remove('is-active');
    });
    nodes.forEach((n) => n.classList.remove('is-active'));
    document.body.style.overflow = '';
    if (returnFocus && openerEl) {
      openerEl.focus();
      openerEl = null;
    }
  }

  // Node clicks open the corresponding modal
  nodes.forEach((node) => {
    const stopId = node.dataset.stopId;
    function open() { openModal(stopId, node); }
    node.addEventListener('click', open);
    node.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });
  });

  // Close buttons
  document.querySelectorAll('.stop-modal-close').forEach((btn) => {
    btn.addEventListener('click', () => closeAllModals(true));
  });

  // Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAllModals(true);
  });

  // Tap the dark overlay backdrop (outside the inner content) to close
  document.querySelectorAll('.stop-modal').forEach((modal) => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeAllModals(true);
    });
  });
})();

// ── Noticing list ────────────────────────────────────────────────
function updateNoticingCount() {
  const total   = document.querySelectorAll('[data-item-id]').length;
  const checked = document.querySelectorAll('[data-item-id][aria-checked="true"]').length;
  const el = document.getElementById('noticing-count');
  if (!el) return;
  if (checked === 0) el.textContent = '';
  else if (checked === total) el.textContent = 'you noticed everything — well done!';
  else el.textContent = `${checked} of ${total} things noticed`;
}

document.querySelectorAll('[data-item-id]').forEach((item) => {
  const id  = item.dataset.itemId;
  const key = `noticing_${id}`;
  if (localStorage.getItem(key) === 'true') {
    item.setAttribute('aria-checked', 'true');
    item.classList.add('checked');
  }
  function toggle() {
    const next = item.getAttribute('aria-checked') !== 'true';
    item.setAttribute('aria-checked', String(next));
    item.classList.toggle('checked', next);
    localStorage.setItem(key, String(next));
    updateNoticingCount();
    if (next && navigator.vibrate) navigator.vibrate(6);
  }
  item.addEventListener('click', toggle);
  item.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
  });
});
updateNoticingCount();

// ── Wildlife spotter ─────────────────────────────────────────────
function updateWildlifeCount() {
  const total   = document.querySelectorAll('[data-wildlife-id]').length;
  const spotted = document.querySelectorAll('[data-wildlife-id][aria-checked="true"]').length;
  const el = document.getElementById('wildlife-count');
  if (!el) return;
  if (spotted === 0) el.textContent = '';
  else if (spotted === total) el.textContent = `incredible — you spotted all ${total} today!`;
  else el.textContent = `you've spotted ${spotted} of ${total} today`;
}

document.querySelectorAll('[data-wildlife-id]').forEach((card) => {
  const id   = card.dataset.wildlifeId;
  const key  = `wildlife_${id}`;
  const chip = card.querySelector('.spot-chip');

  if (localStorage.getItem(key) === 'true') {
    card.setAttribute('aria-checked', 'true');
    card.classList.add('spotted');
    if (chip) chip.textContent = 'spotted today';
  }

  function toggle() {
    const next = card.getAttribute('aria-checked') !== 'true';
    card.setAttribute('aria-checked', String(next));
    card.classList.toggle('spotted', next);
    if (chip) chip.textContent = next ? 'spotted today' : 'tap to spot';
    localStorage.setItem(key, String(next));
    updateWildlifeCount();
    if (next && navigator.vibrate) navigator.vibrate([6, 30, 6]);
  }
  card.addEventListener('click', toggle);
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
  });
});
updateWildlifeCount();

// ── Goals form ───────────────────────────────────────────────────
const form      = document.getElementById('goals-form');
const successEl = document.getElementById('goals-success');

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    try {
      await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(data).toString(),
      });
    } catch (_) { /* offline */ }

    form.style.display = 'none';
    if (successEl) {
      successEl.classList.add('show');
      if (navigator.vibrate) navigator.vibrate([8, 60, 8, 60, 8]);
    }

    const goalText = data.get('goal');
    const nameText = data.get('name');
    if (goalText) {
      const inner = document.getElementById('goals-board-inner');
      if (inner) {
        const note = document.createElement('div');
        note.className   = 'pinned-note';
        note.textContent = nameText ? `${nameText}: ${goalText}` : String(goalText);
        inner.prepend(note);
      }
    }
  });
}

// ── Tap-to-bloom on hero pollinators ─────────────────────────────
document.querySelectorAll('.hero-motif').forEach((motif) => {
  motif.style.cursor = 'pointer';
  motif.addEventListener('click', (e) => {
    const bloom = document.createElement('div');
    bloom.style.cssText = `
      position:fixed;
      left:${e.clientX - 40}px;top:${e.clientY - 40}px;
      width:80px;height:80px;border-radius:50%;
      background:radial-gradient(circle,rgba(247,37,133,.35) 0%,transparent 70%);
      pointer-events:none;z-index:9999;
      animation:bloom-in .5s ease-out forwards;
    `;
    document.body.appendChild(bloom);
    setTimeout(() => bloom.remove(), 550);
  });
});
