export const PROGRESS_STORAGE_KEY = "baby-numbers-progress-v2";
export const LEGACY_PROGRESS_KEYS = [
  "baby-numbers-progress",
  "babyNumbersProgress",
  "baby-number-progress"
] as const;

export type GameStats = {
  correct: number;
  total: number;
};

export type ProgressData = {
  version: 2;
  stars: number;
  learnedNumbers: number[];
  lastNumber: number | null;
  soundEnabled: boolean;
  completedRanges: string[];
  gameStats: GameStats;
};

export const DEFAULT_PROGRESS: ProgressData = {
  version: 2,
  stars: 0,
  learnedNumbers: [],
  lastNumber: null,
  soundEnabled: true,
  completedRanges: [],
  gameStats: {
    correct: 0,
    total: 0
  }
};

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function toSafeInteger(value: unknown, fallback = 0): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : fallback;
}

function sanitizeLearnedNumbers(value: unknown): number[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...new Set(
    value
      .map((item) => Number(item))
      .filter((item) => Number.isInteger(item) && item >= 1 && item <= 100)
  )].sort((left, right) => left - right);
}

function sanitizeRanges(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...new Set(value.filter((item): item is string => typeof item === "string"))];
}

export function sanitizeProgress(value: unknown): ProgressData {
  if (!value || typeof value !== "object") {
    return { ...DEFAULT_PROGRESS, gameStats: { ...DEFAULT_PROGRESS.gameStats } };
  }

  const source = value as Record<string, unknown>;
  const learnedNumbers = sanitizeLearnedNumbers(
    source.learnedNumbers ?? source.learned ?? source.completedNumbers
  );

  const rawLastNumber = source.lastNumber ?? source.lastLearnedNumber ?? source.currentNumber;
  const parsedLastNumber = Number(rawLastNumber);
  const lastNumber = Number.isInteger(parsedLastNumber) && parsedLastNumber >= 1 && parsedLastNumber <= 100
    ? parsedLastNumber
    : learnedNumbers.at(-1) ?? null;

  const rawStats = source.gameStats && typeof source.gameStats === "object"
    ? source.gameStats as Record<string, unknown>
    : {};

  return {
    version: 2,
    stars: toSafeInteger(source.stars),
    learnedNumbers,
    lastNumber,
    soundEnabled: typeof source.soundEnabled === "boolean" ? source.soundEnabled : true,
    completedRanges: sanitizeRanges(source.completedRanges),
    gameStats: {
      correct: toSafeInteger(rawStats.correct),
      total: toSafeInteger(rawStats.total)
    }
  };
}

export function readProgress(storage: StorageLike): ProgressData {
  const keys = [PROGRESS_STORAGE_KEY, ...LEGACY_PROGRESS_KEYS];

  for (const key of keys) {
    const raw = storage.getItem(key);
    if (!raw) {
      continue;
    }

    try {
      const progress = sanitizeProgress(JSON.parse(raw));
      if (key !== PROGRESS_STORAGE_KEY) {
        storage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
        LEGACY_PROGRESS_KEYS.forEach((legacyKey) => storage.removeItem(legacyKey));
      }
      return progress;
    } catch {
      storage.removeItem(key);
    }
  }

  return { ...DEFAULT_PROGRESS, gameStats: { ...DEFAULT_PROGRESS.gameStats } };
}

export function writeProgress(storage: StorageLike, value: ProgressData): void {
  storage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(sanitizeProgress(value)));
}
