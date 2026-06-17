/**
 * Tests for the garden goal-sharing feature (GoalsBoard + GoalStream).
 *
 * Covers:
 *  - UX: empty submission, over-limit, success flow, name optional,
 *        form clears after submit, goals appear in stream
 *  - Security: XSS characters rendered as text, localStorage cap,
 *              script-tag content never executed
 */
import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// ─── Minimal re-export of the components under test ──────────────────────────
// We import directly from the source file. The rest of GardenApp (map, nav,
// intro, exit) is unused in these tests.
import GoalsBoardModule from './GoalsBoardHarness';

const { GoalsBoard } = GoalsBoardModule;

// ─── Mock fetch ──────────────────────────────────────────────────────────────
const mockFetch = vi.fn();
beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch);
  mockFetch.mockClear();
  // API fetch returns empty by default
  mockFetch.mockResolvedValue({ json: async () => [] } as unknown as Response);
  localStorage.clear();
});
afterEach(() => {
  vi.restoreAllMocks();
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
function setup() {
  const user = userEvent.setup();
  render(<GoalsBoard seedGoals={[]} />);
  const textarea = screen.getByLabelText('Your garden goal');
  const nameInput = screen.getByLabelText('Your name (optional)');
  const submitBtn = screen.getByRole('button', { name: /share my goal/i });
  return { user, textarea, nameInput, submitBtn };
}

// ─── UX: validation ───────────────────────────────────────────────────────────
describe('GoalsBoard — validation', () => {
  it('shows an error toast when submitting an empty goal', async () => {
    const { user, submitBtn } = setup();
    await user.click(submitBtn);
    expect(await screen.findByRole('status')).toHaveTextContent('Write your goal first');
  });

  it('shows an error toast when goal is whitespace only', async () => {
    const { user, textarea, submitBtn } = setup();
    await user.type(textarea, '   ');
    await user.click(submitBtn);
    expect(await screen.findByRole('status')).toHaveTextContent('Write your goal first');
  });

  it('shows character count error when goal exceeds 300 characters', async () => {
    const { user, textarea } = setup();
    await user.type(textarea, 'a'.repeat(301));
    await waitFor(() =>
      expect(screen.getByText(/characters over the limit/i)).toBeInTheDocument()
    );
  });

  it('blocks submission when goal exceeds 300 characters', async () => {
    const { user, textarea, submitBtn } = setup();
    await user.type(textarea, 'a'.repeat(301));
    await user.click(submitBtn);
    expect(await screen.findByRole('status')).toHaveTextContent('shorten your goal');
    // fetch should NOT have been called with the form POST
    const formCalls = mockFetch.mock.calls.filter(([url]) =>
      String(url).includes('formResponse')
    );
    expect(formCalls).toHaveLength(0);
  });
});

// ─── UX: success flow ─────────────────────────────────────────────────────────
describe('GoalsBoard — success flow', () => {
  it('shows success toast after valid submission', async () => {
    mockFetch.mockResolvedValue({ ok: true } as Response);
    const { user, textarea, submitBtn } = setup();
    await user.type(textarea, 'grow more dahlias this year');
    await user.click(submitBtn);
    expect(await screen.findByRole('status')).toHaveTextContent('shared — thank you');
  });

  it('clears the textarea and name field after submission', async () => {
    mockFetch.mockResolvedValue({ ok: true } as Response);
    const { user, textarea, nameInput, submitBtn } = setup();
    await user.type(textarea, 'plant a hedgerow');
    await user.type(nameInput, 'Nina');
    await user.click(submitBtn);
    await screen.findByRole('status'); // wait for toast
    expect(textarea).toHaveValue('');
    expect(nameInput).toHaveValue('');
  });

  it('adds the new goal to the stream immediately', async () => {
    mockFetch.mockResolvedValue({ ok: true } as Response);
    const { user, textarea, submitBtn } = setup();
    await user.type(textarea, 'build a cold frame this autumn');
    await user.click(submitBtn);
    await screen.findByRole('status');
    expect(screen.getByText('build a cold frame this autumn')).toBeInTheDocument();
  });

  it('name is optional — submission succeeds without it', async () => {
    mockFetch.mockResolvedValue({ ok: true } as Response);
    const { user, textarea, submitBtn } = setup();
    await user.type(textarea, 'sow sweet peas in February');
    await user.click(submitBtn);
    expect(await screen.findByRole('status')).toHaveTextContent('shared — thank you');
  });

  it('disables the submit button while submitting', async () => {
    // Hold the fetch pending so we can check the in-flight state
    let resolve!: () => void;
    mockFetch.mockReturnValue(
      new Promise<Response>(r => { resolve = () => r({ ok: true } as Response); })
    );
    const { user, textarea, submitBtn } = setup();
    await user.type(textarea, 'more compost bins');
    user.click(submitBtn); // don't await — we want to inspect mid-flight
    await waitFor(() => expect(submitBtn).toBeDisabled());
    resolve();
    await waitFor(() => expect(submitBtn).toBeEnabled());
  });
});

// ─── UX: seed goals and empty state ──────────────────────────────────────────
describe('GoalsBoard — goal stream', () => {
  it('shows empty state message when there are no goals', async () => {
    render(<GoalsBoard seedGoals={[]} />);
    await waitFor(() =>
      expect(screen.getByText(/goals shared today will appear here/i)).toBeInTheDocument()
    );
  });

  it('renders seed goals passed as props', async () => {
    mockFetch.mockResolvedValue({ json: async () => [] } as unknown as Response);
    render(
      <GoalsBoard
        seedGoals={[{ id: 'x1', text: 'a pond for the frogs', name: 'Ana' }]}
      />
    );
    expect(await screen.findByText('a pond for the frogs')).toBeInTheDocument();
  });

  it('merges API goals with local submissions', async () => {
    mockFetch.mockResolvedValue({
      json: async () => [{ id: 'api1', text: 'grow garlic', name: 'Ruth' }],
    } as unknown as Response);
    render(<GoalsBoard seedGoals={[]} />);
    expect(await screen.findByText('grow garlic')).toBeInTheDocument();
  });
});

// ─── Security ─────────────────────────────────────────────────────────────────
describe('GoalsBoard — security', () => {
  it('renders XSS payload as plain text, not HTML', async () => {
    mockFetch.mockResolvedValue({ ok: true } as Response);
    const xss = '<img src=x onerror="window.__xss=1">';
    const { user, textarea, submitBtn } = setup();
    await user.type(textarea, xss);
    await user.click(submitBtn);
    await screen.findByRole('status');
    // The string appears as text content, not parsed HTML
    expect(screen.getByText(xss)).toBeInTheDocument();
    expect((window as unknown as Record<string, unknown>).__xss).toBeUndefined();
  });

  it('does not execute script tags entered as goal text', async () => {
    mockFetch.mockResolvedValue({ ok: true } as Response);
    const payload = '<script>window.__injected=true</script>';
    const { user, textarea, submitBtn } = setup();
    await user.type(textarea, payload);
    await user.click(submitBtn);
    await screen.findByRole('status');
    expect((window as unknown as Record<string, unknown>).__injected).toBeUndefined();
  });

  it('caps localStorage at 24 entries to prevent unbounded growth', async () => {
    mockFetch.mockResolvedValue({ ok: true } as Response);
    // Pre-fill localStorage with 24 entries
    const existing = Array.from({ length: 24 }, (_, i) => ({
      id: i,
      text: `goal ${i}`,
    }));
    localStorage.setItem('ptf_goals_v1', JSON.stringify(existing));

    const { user, textarea, submitBtn } = setup();
    await user.type(textarea, 'one more goal');
    await user.click(submitBtn);
    await screen.findByRole('status');

    const stored = JSON.parse(localStorage.getItem('ptf_goals_v1') || '[]');
    expect(stored.length).toBeLessThanOrEqual(24);
  });

  it('handles malformed localStorage gracefully without crashing', () => {
    localStorage.setItem('ptf_goals_v1', '{not valid json}');
    expect(() => render(<GoalsBoard seedGoals={[]} />)).not.toThrow();
  });

  it('trims whitespace from goal text before storing', async () => {
    mockFetch.mockResolvedValue({ ok: true } as Response);
    const { user, textarea, submitBtn } = setup();
    await user.type(textarea, '  borage everywhere  ');
    await user.click(submitBtn);
    await screen.findByRole('status');
    const stored = JSON.parse(localStorage.getItem('ptf_goals_v1') || '[]');
    expect(stored[0].text).toBe('borage everywhere');
  });

  it('sends goal text to Google Form endpoint', async () => {
    mockFetch.mockResolvedValue({ ok: true } as Response);
    const { user, textarea, submitBtn } = setup();
    await user.type(textarea, 'plant milkweed');
    await user.click(submitBtn);
    await screen.findByRole('status');
    const formCall = mockFetch.mock.calls.find(([url]) =>
      String(url).includes('formResponse')
    );
    expect(formCall).toBeDefined();
    const body: URLSearchParams = formCall![1].body;
    expect(body.get('entry.1489834405')).toBe('plant milkweed');
  });

  it('uses no-cors mode for the Google Form POST', async () => {
    mockFetch.mockResolvedValue({ ok: true } as Response);
    const { user, textarea, submitBtn } = setup();
    await user.type(textarea, 'let the back third go wild');
    await user.click(submitBtn);
    await screen.findByRole('status');
    const formCall = mockFetch.mock.calls.find(([url]) =>
      String(url).includes('formResponse')
    );
    expect(formCall![1].mode).toBe('no-cors');
  });
});
