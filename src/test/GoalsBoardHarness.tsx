/**
 * Re-exports GoalsBoard from GardenApp for isolated unit testing.
 * This avoids importing the full app (SVG map, IOSDevice frame, etc.)
 * while keeping the component co-located with the rest of the app logic.
 */
import React, { useState, useEffect, useRef } from 'react';

interface SeedGoal {
  id: string | number;
  text: string;
  name?: string;
}

const FORM_ACTION = 'https://docs.google.com/forms/d/e/1FAIpQLSeA8Gi_cjxZ3EiUJK4sBBvqPSAbmaxEsxNFEmtpzrGHsj8T8w/formResponse';
const FORM_GOAL_FIELD = 'entry.1489834405';
const FORM_NAME_FIELD = 'entry.1903810587';
const GOALS_API_URL = 'https://script.google.com/macros/s/AKfycbyDPPOeAHIPSOHZzjAaRRYd0pSjeqnRFATStIOc1yY-jwTEkMU61rByHAa45xmyda95/exec';
const GOAL_TINTS = [
  'rgba(216,139,106,0.34)', 'rgba(242,201,76,0.26)',
  'rgba(126,154,96,0.34)',  'rgba(93,173,226,0.28)',
  'rgba(199,125,166,0.30)', 'rgba(182,212,155,0.30)',
];

function GoalChip({ g, tint }: { g: SeedGoal; tint: string }) {
  return (
    <div style={{ '--chip-tint': tint } as React.CSSProperties}>
      <p>{g.text}</p>
      {g.name && <span>— {g.name}</span>}
    </div>
  );
}

function GoalStream({ goals }: { goals: SeedGoal[] }) {
  if (!goals.length) return (
    <p>Goals shared today will appear here.</p>
  );
  return (
    <div>
      {goals.map((g, i) => (
        <GoalChip key={i} g={g} tint={GOAL_TINTS[i % GOAL_TINTS.length]} />
      ))}
    </div>
  );
}

export function GoalsBoard({ seedGoals }: { seedGoals: SeedGoal[] }) {
  const KEY = 'ptf_goals_v1';
  const [goals, setGoals] = useState<SeedGoal[]>([]);
  const [text, setText] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; kind: string } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    loadLocal();
    if (GOALS_API_URL) {
      fetch(GOALS_API_URL)
        .then(r => r.json())
        .then((data: SeedGoal[]) => {
          if (Array.isArray(data) && data.length > 0) {
            setGoals(prev => {
              const ids = new Set(data.map(g => g.id));
              const extras = prev.filter(g => !ids.has(g.id));
              return [...data, ...extras];
            });
          }
        })
        .catch(() => {});
    }
    function loadLocal() {
      try {
        const stored: SeedGoal[] = JSON.parse(localStorage.getItem(KEY) || '[]');
        setGoals([...stored, ...seedGoals]);
      } catch {
        setGoals(seedGoals);
      }
    }
  }, []);

  function pushToast(msg: string, kind: string) {
    clearTimeout(toastTimer.current);
    setToast({ msg, kind });
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const MAX = 300;
  const overLimit = text.length > MAX;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const g = text.trim();
    if (!g) { pushToast('Write your goal first', 'error'); return; }
    if (overLimit) { pushToast('Please shorten your goal to 300 characters', 'error'); return; }
    setSubmitting(true);

    const entry: SeedGoal = { id: Date.now(), text: g, name: name.trim() || undefined };

    const body = new URLSearchParams();
    body.set(FORM_GOAL_FIELD, g);
    if (name.trim()) body.set(FORM_NAME_FIELD, name.trim());
    try {
      await fetch(FORM_ACTION, { method: 'POST', mode: 'no-cors', body });
    } catch {}

    setGoals(prev => {
      const next = [entry, ...prev].slice(0, 48);
      try { localStorage.setItem(KEY, JSON.stringify(next.slice(0, 24))); } catch {}
      return next;
    });
    setText(''); setName('');
    setSubmitting(false);
    pushToast('shared — thank you', 'success');
  }

  return (
    <section aria-label="Garden goals">
      <h2>Share your garden goal</h2>
      <form onSubmit={submit}>
        <label htmlFor="goal-text">Your garden goal</label>
        <textarea
          id="goal-text"
          rows={1}
          placeholder="this year in my garden, I want to…"
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <div aria-live="polite">
          {overLimit ? `${text.length - MAX} characters over the limit` : ''}
        </div>
        <div>
          <label htmlFor="goal-name">Your name (optional)</label>
          <input
            id="goal-name"
            type="text"
            placeholder="your name"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <button type="submit" disabled={submitting}>
            {submitting ? 'Sharing…' : 'Share my goal'}
          </button>
        </div>
      </form>
      <GoalStream goals={goals} />
      {toast && (
        <div role="status" aria-live="polite">
          {toast.msg}
        </div>
      )}
    </section>
  );
}

export default { GoalsBoard };
