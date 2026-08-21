"use client";

import { BackButton, PageTitle, StarBadge } from "@/components/ui";
import { NUMBER_RANGES, type NumberRange } from "@/lib/numbers";
import { useProgress } from "@/providers/progress-provider";

export type RangeMode = "learn" | "card";

type RangeSelectorProps = {
  mode: RangeMode;
  onBack: () => void;
  onSelect: (range: NumberRange) => void;
};

export function RangeSelector({ mode, onBack, onSelect }: RangeSelectorProps) {
  const { progress, ready, hasProgress } = useProgress();

  return (
    <main className="screen range-screen" data-testid="range-screen">
      <header className="page-header">
        <BackButton onClick={onBack} />
        <PageTitle>{mode === "learn" ? "选择数字范围" : "选择卡片范围"}</PageTitle>
        <StarBadge stars={progress.stars} ready={ready} />
      </header>

      <p className="range-hint">
        {mode === "learn" ? "每次学习 10 个数字" : "选一组，左右滑动看卡片"}
      </p>

      <section className="range-grid" aria-label="数字范围">
        {NUMBER_RANGES.map((range, index) => {
          const learnedInRange = progress.learnedNumbers.filter(
            (number) => number >= range.start && number <= range.end
          ).length;
          const isLastRange = ready
            && hasProgress
            && progress.lastNumber !== null
            && progress.lastNumber >= range.start
            && progress.lastNumber <= range.end;
          const completed = progress.completedRanges.includes(range.key);

          return (
            <button
              key={range.key}
              type="button"
              className={`range-card range-card-${(index % 5) + 1} ${completed ? "is-complete" : ""}`}
              onClick={() => onSelect(range)}
              data-testid={`range-${range.key}`}
            >
              <strong>{range.label}</strong>
              <span className="range-meta">
                {ready ? `${learnedInRange} / 10` : "— / 10"}
              </span>
              {isLastRange ? <em>上次学到这里</em> : null}
              {completed ? <span className="range-check" aria-label="已完成">✓</span> : null}
            </button>
          );
        })}
      </section>
    </main>
  );
}
