export type PaletteId = 'glacier' | 'lilac' | 'ember'

export const palettes = {
  glacier: { name: 'Glacier', accent: '#8adfdf', rgb: '138, 223, 223' },
  lilac: { name: 'Lilac', accent: '#c6b3fa', rgb: '198, 179, 250' },
  ember: { name: 'Ember', accent: '#f3b995', rgb: '243, 185, 149' },
} satisfies Record<PaletteId, { name: string; accent: string; rgb: string }>

// This is a personal planning deadline. The fixed CST offset is correct for Chicago in January.
export const deadline = '2027-01-29T23:59:00-06:00'
export const milestones = [
  {
    id: 'question', title: 'Define the research question', shortTitle: 'Research question', date: '2026-11-30',
    description: 'Write down the question, the gap in prior work, and what evidence would answer it. Bring a one-page scope to the next advisor meeting.',
  },
  {
    id: 'baseline', title: 'Establish the baseline', shortTitle: 'Baseline', date: '2026-12-11',
    description: 'Choose the dataset and evaluation metric, then run a reproducible baseline to give the main experiment a fair comparison.',
  },
  {
    id: 'experiments', title: 'Finish the experiments', shortTitle: 'Experiments', date: '2026-12-23',
    description: 'Run the planned comparisons, check the unexpected results, and save the figures and tables that support the paper’s claims.',
  },
  {
    id: 'draft', title: 'Complete the first draft', shortTitle: 'First draft', date: '2027-01-08',
    description: 'Connect the question, method, and findings in a full draft. Send it to readers with two specific questions for feedback.',
  },
  {
    id: 'revision', title: 'Revise with feedback', shortTitle: 'Revision', date: '2027-01-22',
    description: 'Resolve the main reader comments, tighten the claims, and freeze the figures. Keep the last week for proofing and submission checks.',
  },
  {
    id: 'submission', title: 'Submit the paper', shortTitle: 'Submission', date: '2027-01-29',
    description: 'Proofread the final PDF, check the references and submission requirements, then upload the paper and save the confirmation.',
  },
]

export function getCountdown(now: Date) {
  const totalMs = Math.max(0, Date.parse(deadline) - now.getTime())
  const totalSeconds = Math.ceil(totalMs / 1000)
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor(totalSeconds / 3600) % 24,
    minutes: Math.floor(totalSeconds / 60) % 60,
    seconds: totalSeconds % 60,
    totalMs,
  }
}
