export type PuzzleId = 
  | 'agreement' 
  | 'reflection' 
  | 'imbalance' 
  | 'stillness' 
  | 'precision' 
  | 'outside_time' 
  | 'split' 
  | 'let_go'
  | 'echo_of_the_hour' // Secret Act 1
  | 'mini_paradox'     // Secret Act 2
  | 'fractured_moments'; // Secret Act 3

export type Act = 1 | 2 | 3;

export interface GameState {
  act: Act;
  puzzlesSolved: PuzzleId[];
  glitchLevel: number;
  cheatCount: number;
  lastSolvedAt: number;
  hasCheatedInAct1: boolean;
  hasCheatedInAct2: boolean;
}

export const PUZZLES = {
  agreement: {
    id: 'agreement',
    act: 1,
    prompt: "When hours and minutes agree.",
    hint: "HH + MM = 42",
    check: (h: number, m: number, s: number) => h + m === 42
  },
  reflection: {
    id: 'reflection',
    act: 1,
    prompt: "Time likes symmetry.",
    hint: "Seconds must be palindromes",
    check: (h: number, m: number, s: number) => s % 11 === 0 // 00, 11, 22...
  },
  imbalance: {
    id: 'imbalance',
    act: 1,
    prompt: "Balance is suspicious.",
    hint: "Active on odd minutes",
    check: (h: number, m: number, s: number) => m % 2 !== 0
  },
  echo_of_the_hour: {
    id: 'echo_of_the_hour',
    act: 1,
    prompt: "The pure hour approaches.",
    hint: "Wait for HH:00:00 without cheating",
    check: (h: number, m: number, s: number) => m === 0 && s === 0
  },
  stillness: {
    id: 'stillness',
    act: 2,
    prompt: "Forward is not progress.",
    hint: "Rewind slightly",
    check: (h: number, m: number, s: number, meta?: { movedBackward: boolean }) => !!meta?.movedBackward
  },
  precision: {
    id: 'precision',
    act: 2,
    prompt: "No room for error.",
    hint: "Exactly at ??:00",
    check: (h: number, m: number, s: number) => s === 0
  },
  outside_time: {
    id: 'outside_time',
    act: 2,
    prompt: "This is not the right time.",
    hint: "Before 06:00 or after 23:00",
    check: (h: number, m: number, s: number) => h < 6 || h >= 23
  },
  mini_paradox: {
    id: 'mini_paradox',
    act: 2,
    prompt: "A ripple in the flow.",
    hint: "Align clocks with cheat",
    check: (h: number, m: number, s: number, meta?: { offset: number }) => Math.abs(meta?.offset || 0) > 0 && Math.abs(meta?.offset || 0) < 60000 // Small offset
  },
  split: {
    id: 'split',
    act: 3,
    prompt: "Both are correct.",
    hint: "Align Authority Clock and Real Clock",
    check: (h: number, m: number, s: number, meta?: { offset: number }) => Math.abs(meta?.offset || 0) < 1000 // < 1s diff
  },
  let_go: {
    id: 'let_go',
    act: 3,
    prompt: "Stop fixing it.",
    hint: "Do nothing for 10s",
    check: (h: number, m: number, s: number, meta?: { idleTime: number }) => (meta?.idleTime || 0) > 10000
  },
  fractured_moments: {
    id: 'fractured_moments',
    act: 3,
    prompt: "Break it all.",
    hint: "Heavy manipulation",
    check: (h: number, m: number, s: number, meta?: { cheatCount: number }) => (meta?.cheatCount || 0) > 20
  }
} as const;
