"use client";

import { BackButton, PageTitle, ProgressCard, StarBadge } from "@/components/ui";
import { useProgress } from "@/providers/progress-provider";

const MILESTONES = [
  { value: 10, emoji: "🌱", label: "认识 10 个数字" },
  { value: 25, emoji: "🌼", label: "认识 25 个数字" },
  { value: 50, emoji: "🌈", label: "认识 50 个数字" },
  { value: 100, emoji: "🏆", label: "认识全部数字" }
] as const;

export function StarsScreen({ onBack }: { onBack: () => void }) {
  const { progress, ready } = useProgress();
  const learned = progress.learnedNumbers.length;

  return (
    <main className="screen stars-screen" data-testid="stars-screen">
      <header className="page-header">
        <BackButton onClick={onBack} />
        <PageTitle>我的星星</PageTitle>
        <StarBadge stars={progress.stars} ready={ready} />
      </header>

      <section className="stars-hero">
        <span aria-hidden="true">⭐</span>
        <strong data-testid="stars-total">{ready ? progress.stars : "—"}</strong>
        <p>答对游戏、完成学习，都能获得星星</p>
      </section>

      <ProgressCard learned={learned} ready={ready} />

      <section className="milestone-list" aria-label="学习里程碑">
        {MILESTONES.map((milestone) => {
          const achieved = ready && learned >= milestone.value;
          return (
            <article className={`milestone-card ${achieved ? "is-achieved" : ""}`} key={milestone.value}>
              <span aria-hidden="true">{milestone.emoji}</span>
              <div>
                <strong>{milestone.label}</strong>
                <small>{achieved ? "已经达成！" : `还差 ${Math.max(0, milestone.value - learned)} 个`}</small>
              </div>
              <em>{achieved ? "✓" : `${milestone.value}`}</em>
            </article>
          );
        })}
      </section>

      <section className="game-stats">
        <h2>游戏记录</h2>
        <p>
          答对 <strong>{ready ? progress.gameStats.correct : "—"}</strong> 题
          <span aria-hidden="true"> · </span>
          一共尝试 <strong>{ready ? progress.gameStats.total : "—"}</strong> 次
        </p>
      </section>
    </main>
  );
}
