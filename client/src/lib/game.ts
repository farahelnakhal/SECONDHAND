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
  | 'fractured_moments' // Secret Act 3
  // Act 4: Judgment
  | 'judgment'
  // Endings
  | 'acceptance'
  | 'destruction'
  | 'alignment'
  | 'departure';

export type Act = 1 | 2 | 3 | 4;

export interface GameState {
  act: Act;
  puzzlesSolved: PuzzleId[];
  glitchLevel: number;
  cheatCount: number;
  lastSolvedAt: number;
  hasCheatedInAct1: boolean;
  hasCheatedInAct2: boolean;
}

export const PUZZLE_SEQUENCE: PuzzleId[] = [
  // ACT 1
  'agreement',
  'reflection',
  'imbalance',
  'echo_of_the_hour',
  
  // ACT 2
  'stillness',
  'precision',
  'outside_time',
  'mini_paradox',

  // ACT 3
  'split',
  'let_go',
  'fractured_moments'
];

export const PUZZLES = {
  agreement: {
    id: 'agreement',
    act: 1,
    prompt: "When hours and minutes agree.",
    hint: "HH + MM = 42 (e.g., 20:22)",
    check: (h: number, m: number, s: number, _meta?: any) => h + m === 42
  },
  reflection: {
    id: 'reflection',
    act: 1,
    prompt: "Time likes symmetry.",
    hint: "Seconds must repeat (00, 11, 22...)",
    check: (h: number, m: number, s: number, _meta?: any) => s % 11 === 0 // 00, 11, 22...
  },
  imbalance: {
    id: 'imbalance',
    act: 1,
    prompt: "Balance is suspicious.",
    hint: "Solve when minutes are ODD",
    check: (h: number, m: number, s: number, _meta?: any) => m % 2 !== 0
  },
  echo_of_the_hour: {
    id: 'echo_of_the_hour',
    act: 1,
    prompt: "The pure hour approaches.",
    hint: "Wait for exactly HH:00:00",
    check: (h: number, m: number, s: number, _meta?: any) => m === 0 && s === 0
  },
  stillness: {
    id: 'stillness',
    act: 2,
    prompt: "Forward is not progress.",
    hint: "Move the clock BACKWARDS",
    check: (h: number, m: number, s: number, meta?: { movedBackward: boolean }) => !!meta?.movedBackward
  },
  precision: {
    id: 'precision',
    act: 2,
    prompt: "No room for error.",
    hint: "Solve exactly when seconds are 00",
    check: (h: number, m: number, s: number, _meta?: any) => s === 0
  },
  outside_time: {
    id: 'outside_time',
    act: 2,
    prompt: "This is not the right time.",
    hint: "Set time to Night (23:00-06:00)",
    check: (h: number, m: number, s: number, _meta?: any) => h < 6 || h >= 23
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
  },
  // --- ACT 4: JUDGMENT ---
  judgment: {
    id: 'judgment',
    act: 4,
    prompt: "Face the truth.",
    hint: "Wait for 00 seconds",
    check: (h: number, m: number, s: number, _meta?: any) => s === 0
  },
  // --- ENDINGS ---
  acceptance: {
    id: 'acceptance',
    act: 4,
    prompt: "Return to the source.",
    hint: "Set the time to exactly 00:00:00",
    check: (h: number, m: number, s: number, _meta?: any) => h === 0 && m === 0 && s === 0
  },
  destruction: {
    id: 'destruction',
    act: 4,
    prompt: "Shatter the clock.",
    hint: "Rapidly change the hour 10 times in 5 seconds",
    check: (h: number, m: number, s: number, meta?: { rapidClicks?: number }) => (meta?.rapidClicks || 0) >= 10
  },
  alignment: {
    id: 'alignment',
    act: 4,
    prompt: "Perfect alignment.",
    hint: "Match HH:MM:SS with real time exactly",
    check: (h: number, m: number, s: number, meta?: { offset: number }) => Math.abs(meta?.offset || 0) < 500
  },
  departure: {
    id: 'departure',
    act: 4,
    prompt: "Leave the stream.",
    hint: "Close your eyes (Wait 60s)",
    check: (h: number, m: number, s: number, meta?: { idleTime: number }) => (meta?.idleTime || 0) > 60000
  }
} as const;
