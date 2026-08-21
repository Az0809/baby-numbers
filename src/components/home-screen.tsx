"use client";

import { FeatureCard, ProgressCard, SoundButton, StarBadge } from "@/components/ui";
import { useProgress } from "@/providers/progress-provider";

type HomeScreenProps = {
  onLearn: () => void;
  onGames: () => void;
  onCards: () => void;
  onStars: () => void;
};

export function HomeScreen({ onLearn, onGames, onCards, onStars }: HomeScreenProps) {
  const {
    progress,
    ready,
    hasProgress,
    toggleSound
  } = useProgress();

  const learnSubtitle = !ready
    ? "正在读取学习记录"
    : hasProgress && progress.lastNumber
      ? `继续学习数字 ${progress.lastNumber}`
      : "从数字 1 开始";

  return (
    <main className="screen home-screen" data-testid="home-screen">
      <header className="home-header">
        <div className="home-topbar">
          <div className="mascot mascot-lion" aria-hidden="true">🦁</div>
          <SoundButton
            enabled={progress.soundEnabled}
            ready={ready}
            onToggle={toggleSound}
          />
        </div>

        <div className="brand-block">
          <p className="brand-kicker">快乐启蒙 · 每天一点点</p>
          <h1 className="brand-title" aria-label="宝宝学数字">
            <span className="brand-red">宝</span>
            <span className="brand-orange">宝</span>
            <span className="brand-green">学</span>
            <span className="brand-blue">数</span>
            <span className="brand-purple">字</span>
          </h1>
        </div>

        <div className="home-status-row">
          <ProgressCard learned={progress.learnedNumbers.length} ready={ready} />
          <button type="button" className="home-star-button" onClick={onStars} aria-label="查看我的星星">
            <StarBadge stars={progress.stars} ready={ready} />
          </button>
        </div>
      </header>

      <section className="feature-list" aria-label="学习功能">
        <FeatureCard
          icon="🍎"
          title="认识数字"
          subtitle={learnSubtitle}
          tone="green"
          onClick={onLearn}
          testId="feature-learn"
        />
        <FeatureCard
          icon="🎮"
          title="数字游戏"
          subtitle="边玩边学更有趣"
          tone="blue"
          onClick={onGames}
          testId="feature-games"
        />
        <FeatureCard
          icon="🔢"
          title="数字卡片"
          subtitle="点击朗读 · 左右滑动"
          tone="orange"
          onClick={onCards}
          testId="feature-cards"
        />
        <FeatureCard
          icon="🏆"
          title="我的星星"
          subtitle={ready ? `已经收集 ${progress.stars} 颗` : "正在读取奖励"}
          tone="purple"
          onClick={onStars}
          testId="feature-stars"
        />
      </section>

      <footer className="home-footer" aria-hidden="true">
        <span className="footer-flower">🌼</span>
        <p>每天进步一点点，快乐学习每一天！</p>
        <span className="footer-bunny">🐰</span>
      </footer>
    </main>
  );
}
