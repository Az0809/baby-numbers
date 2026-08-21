"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode
} from "react";
import {
  DEFAULT_PROGRESS,
  LEGACY_PROGRESS_KEYS,
  PROGRESS_STORAGE_KEY,
  readProgress,
  sanitizeProgress,
  writeProgress,
  type ProgressData
} from "@/lib/progress-storage";

type ProgressContextValue = {
  progress: ProgressData;
  ready: boolean;
  hasProgress: boolean;
  markLearned: (number: number) => void;
  addStars: (amount?: number) => void;
  setSoundEnabled: (enabled: boolean) => void;
  toggleSound: () => void;
  completeRange: (rangeKey: string) => void;
  recordAnswer: (correct: boolean) => void;
  isRangeCompleted: (rangeKey: string) => boolean;
};

const ProgressContext = createContext<ProgressContextValue | null>(null);
const PROGRESS_CHANGE_EVENT = "baby-numbers-progress-change";
const SERVER_SNAPSHOT = "__server__";
const EMPTY_SNAPSHOT = "__empty__";
const LEGACY_PREFIX = "__legacy__:";
let fallbackSnapshot = EMPTY_SNAPSHOT;

function createDefaultProgress(): ProgressData {
  return {
    ...DEFAULT_PROGRESS,
    learnedNumbers: [],
    completedRanges: [],
    gameStats: { ...DEFAULT_PROGRESS.gameStats }
  };
}

function getProgressSnapshot(): string {
  if (typeof window === "undefined") {
    return SERVER_SNAPSHOT;
  }

  try {
    const current = window.localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (current !== null) {
      fallbackSnapshot = current;
      return current;
    }

    for (const key of LEGACY_PROGRESS_KEYS) {
      const legacy = window.localStorage.getItem(key);
      if (legacy !== null) {
        fallbackSnapshot = `${LEGACY_PREFIX}${legacy}`;
        return fallbackSnapshot;
      }
    }

    fallbackSnapshot = EMPTY_SNAPSHOT;
    return EMPTY_SNAPSHOT;
  } catch {
    return fallbackSnapshot;
  }
}

function getServerSnapshot(): string {
  return SERVER_SNAPSHOT;
}

function parseSnapshot(snapshot: string): ProgressData {
  if (snapshot === SERVER_SNAPSHOT || snapshot === EMPTY_SNAPSHOT) {
    return createDefaultProgress();
  }

  const raw = snapshot.startsWith(LEGACY_PREFIX)
    ? snapshot.slice(LEGACY_PREFIX.length)
    : snapshot;

  try {
    return sanitizeProgress(JSON.parse(raw));
  } catch {
    return createDefaultProgress();
  }
}

function emitProgressChange(): void {
  window.dispatchEvent(new Event(PROGRESS_CHANGE_EVENT));
}

function subscribeProgress(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleStorage = (event: StorageEvent) => {
    const relevantKeys: readonly string[] = [
      PROGRESS_STORAGE_KEY,
      ...LEGACY_PROGRESS_KEYS
    ];

    if (event.key === null || relevantKeys.some((key) => key === event.key)) {
      onStoreChange();
    }
  };

  window.addEventListener(PROGRESS_CHANGE_EVENT, onStoreChange);
  window.addEventListener("storage", handleStorage);

  queueMicrotask(() => {
    const before = getProgressSnapshot();
    try {
      const normalized = readProgress(window.localStorage);
      writeProgress(window.localStorage, normalized);
      fallbackSnapshot = JSON.stringify(normalized);
    } catch {
      // 浏览器禁用本地存储时，继续使用当前会话内存数据。
    }
    if (getProgressSnapshot() !== before) {
      onStoreChange();
    }
  });

  return () => {
    window.removeEventListener(PROGRESS_CHANGE_EVENT, onStoreChange);
    window.removeEventListener("storage", handleStorage);
  };
}

function updateProgress(updater: (current: ProgressData) => ProgressData): void {
  if (typeof window === "undefined") {
    return;
  }

  let current = parseSnapshot(fallbackSnapshot);
  try {
    current = readProgress(window.localStorage);
  } catch {
    // 使用内存中的最近一次数据。
  }

  const next = sanitizeProgress(updater(current));
  fallbackSnapshot = JSON.stringify(next);

  try {
    writeProgress(window.localStorage, next);
  } catch {
    // 存储不可用时，本次会话仍可正常学习。
  }

  emitProgressChange();
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const snapshot = useSyncExternalStore(
    subscribeProgress,
    getProgressSnapshot,
    getServerSnapshot
  );
  const ready = snapshot !== SERVER_SNAPSHOT;
  const progress = useMemo(() => parseSnapshot(snapshot), [snapshot]);

  const markLearned = useCallback((number: number) => {
    const safeNumber = Math.trunc(number);
    if (safeNumber < 1 || safeNumber > 100) {
      return;
    }

    updateProgress((current) => {
      const alreadyLearned = current.learnedNumbers.includes(safeNumber);
      return {
        ...current,
        lastNumber: safeNumber,
        learnedNumbers: alreadyLearned
          ? current.learnedNumbers
          : [...current.learnedNumbers, safeNumber].sort((left, right) => left - right)
      };
    });
  }, []);

  const addStars = useCallback((amount = 1) => {
    const safeAmount = Math.max(0, Math.trunc(amount));
    if (safeAmount === 0) {
      return;
    }

    updateProgress((current) => ({
      ...current,
      stars: current.stars + safeAmount
    }));
  }, []);

  const setSoundEnabled = useCallback((enabled: boolean) => {
    updateProgress((current) => ({
      ...current,
      soundEnabled: enabled
    }));
  }, []);

  const toggleSound = useCallback(() => {
    updateProgress((current) => ({
      ...current,
      soundEnabled: !current.soundEnabled
    }));
  }, []);

  const completeRange = useCallback((rangeKey: string) => {
    updateProgress((current) => {
      if (current.completedRanges.includes(rangeKey)) {
        return current;
      }

      return {
        ...current,
        completedRanges: [...current.completedRanges, rangeKey]
      };
    });
  }, []);

  const recordAnswer = useCallback((correct: boolean) => {
    updateProgress((current) => ({
      ...current,
      gameStats: {
        correct: current.gameStats.correct + (correct ? 1 : 0),
        total: current.gameStats.total + 1
      }
    }));
  }, []);

  const isRangeCompleted = useCallback(
    (rangeKey: string) => progress.completedRanges.includes(rangeKey),
    [progress.completedRanges]
  );

  const value = useMemo<ProgressContextValue>(() => ({
    progress,
    ready,
    hasProgress: progress.learnedNumbers.length > 0,
    markLearned,
    addStars,
    setSoundEnabled,
    toggleSound,
    completeRange,
    recordAnswer,
    isRangeCompleted
  }), [
    progress,
    ready,
    markLearned,
    addStars,
    setSoundEnabled,
    toggleSound,
    completeRange,
    recordAnswer,
    isRangeCompleted
  ]);

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress(): ProgressContextValue {
  const value = useContext(ProgressContext);
  if (!value) {
    throw new Error("useProgress 必须在 ProgressProvider 内使用");
  }
  return value;
}
