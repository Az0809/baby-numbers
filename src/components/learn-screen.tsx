"use client";

import { useEffect } from "react";
import { BackButton, NavigationButtons, QuantityDisplay, StarBadge } from "@/components/ui";
import { getNumberItem, toChineseNumber, type NumberRange } from "@/lib/numbers";
import { useChineseSpeech } from "@/hooks/use-chinese-speech";
import { useProgress } from "@/providers/progress-provider";

type LearnScreenProps = {
  range: NumberRange;
  currentNumber: number;
  onBack: () => void;
  onNumberChange: (number: number) => void;
  onFinish: () => void;
};

export function LearnScreen({
  range,
  currentNumber,
  onBack,
  onNumberChange,
  onFinish
}: LearnScreenProps) {
  const { progress, ready, markLearned } = useProgress();
  const { supported, speak } = useChineseSpeech(progress.soundEnabled);
  const chinese = toChineseNumber(currentNumber);
  const item = getNumberItem(currentNumber);

  useEffect(() => {
    markLearned(currentNumber);
  }, [currentNumber, markLearned]);

  const goTo = (number: number) => {
    markLearned(number);
    onNumberChange(number);
    speak(number);
  };

  const handlePrevious = () => {
    if (currentNumber > range.start) {
      goTo(currentNumber - 1);
    }
  };

  const handleNext = () => {
    if (currentNumber < range.end) {
      goTo(currentNumber + 1);
      return;
    }
    onFinish();
  };

  return (
    <main className="screen learn-screen" data-testid="learn-screen">
      <header className="page-header">
        <BackButton onClick={onBack} />
        <div className="header-center">
          <h1>{range.label}</h1>
          <span>认识数字</span>
        </div>
        <StarBadge stars={progress.stars} ready={ready} />
      </header>

      <section className="number-learning-card">
        <button
          type="button"
          className={`giant-number giant-number-${String(currentNumber).length}`}
          onClick={() => speak(currentNumber)}
          aria-label={`数字 ${currentNumber}，点击朗读${chinese}`}
          data-testid="giant-number"
        >
          {currentNumber}
        </button>
        <p className="chinese-number" data-testid="chinese-number">{chinese}</p>
        <button
          type="button"
          className="speak-number-button"
          onClick={() => speak(currentNumber)}
          disabled={!supported || !progress.soundEnabled}
          aria-label={`朗读${chinese}`}
        >
          🔊 <span>{!supported ? "浏览器不支持语音" : progress.soundEnabled ? "点我读一读" : "声音已关闭"}</span>
        </button>
      </section>

      <section className="quantity-section">
        <p className="quantity-caption">
          数一数：这里有 <strong>{currentNumber}</strong> {item.pluralName}
        </p>
        <QuantityDisplay count={currentNumber} item={item} />
      </section>

      <NavigationButtons
        previousDisabled={currentNumber <= range.start}
        onPrevious={handlePrevious}
        nextLabel={currentNumber >= range.end ? "学完啦" : "下一个"}
        onNext={handleNext}
      />
    </main>
  );
}
