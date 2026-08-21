"use client";

import { Confetti } from "@/components/ui";
import { ArrowRightIcon, HomeIcon, StarIcon } from "@/components/icons";

type CelebrationScreenProps = {
  reward: number;
  hasNextRange: boolean;
  onHome: () => void;
  onNextRange: () => void;
};

export function CelebrationScreen({
  reward,
  hasNextRange,
  onHome,
  onNextRange
}: CelebrationScreenProps) {
  return (
    <main className="screen celebration-screen" data-testid="celebration-screen">
      <Confetti count={34} />
      <section className="celebration-card">
        <div className="celebration-star" aria-hidden="true">🌟</div>
        <h1>太棒啦！</h1>
        <p>这一组数字学完了</p>

        <div className="reward-pill">
          <StarIcon />
          <strong>{reward > 0 ? `获得 ${reward} 颗星星` : "这组已经完成过"}</strong>
        </div>

        <div className="celebration-actions">
          <button type="button" className="secondary-action" onClick={onHome}>
            <HomeIcon />
            回到首页
          </button>
          {hasNextRange ? (
            <button type="button" className="primary-action" onClick={onNextRange}>
              学下一组
              <ArrowRightIcon />
            </button>
          ) : null}
        </div>
      </section>
    </main>
  );
}
