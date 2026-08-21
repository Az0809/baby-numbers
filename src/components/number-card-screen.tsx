"use client";

import { useEffect, useRef } from "react";
import { BackButton, IconButton, StarBadge } from "@/components/ui";
import { ArrowLeftIcon, ArrowRightIcon, VolumeIcon, VolumeOffIcon } from "@/components/icons";
import { toChineseNumber, type NumberRange } from "@/lib/numbers";
import { useChineseSpeech } from "@/hooks/use-chinese-speech";
import { useProgress } from "@/providers/progress-provider";

type NumberCardScreenProps = {
  range: NumberRange;
  currentNumber: number;
  onBack: () => void;
  onNumberChange: (number: number) => void;
  onFinish: () => void;
};

export function NumberCardScreen({
  range,
  currentNumber,
  onBack,
  onNumberChange,
  onFinish
}: NumberCardScreenProps) {
  const { progress, ready, markLearned } = useProgress();
  const { speak } = useChineseSpeech(progress.soundEnabled);
  const pointerStart = useRef<number | null>(null);
  const didSwipe = useRef(false);
  const chinese = toChineseNumber(currentNumber);

  useEffect(() => {
    markLearned(currentNumber);
  }, [currentNumber, markLearned]);

  const move = (direction: -1 | 1) => {
    const next = currentNumber + direction;

    if (next < range.start) {
      return;
    }

    if (next > range.end) {
      onFinish();
      return;
    }

    markLearned(next);
    onNumberChange(next);
    speak(next);
  };

  return (
    <main className="screen card-screen" data-testid="card-screen">
      <header className="page-header card-page-header">
        <BackButton onClick={onBack} />
        <div className="header-center">
          <h1>数字卡片</h1>
          <span>{range.label}</span>
        </div>
        <StarBadge stars={progress.stars} ready={ready} />
      </header>

      <section
        className="full-number-card"
        onPointerDown={(event) => {
          pointerStart.current = event.clientX;
          didSwipe.current = false;
        }}
        onPointerUp={(event) => {
          if (pointerStart.current === null) {
            return;
          }
          const distance = event.clientX - pointerStart.current;
          pointerStart.current = null;
          if (Math.abs(distance) >= 45) {
            didSwipe.current = true;
            move(distance < 0 ? 1 : -1);
          }
        }}
        onPointerCancel={() => {
          pointerStart.current = null;
          didSwipe.current = false;
        }}
        data-testid="swipe-card"
      >
        <button
          type="button"
          className="card-read-area"
          onClick={() => {
            if (didSwipe.current) {
              didSwipe.current = false;
              return;
            }
            speak(currentNumber);
          }}
          aria-label={`数字 ${currentNumber}，点击朗读${chinese}`}
        >
          <span className={`card-number card-number-${String(currentNumber).length}`} data-testid="card-number">
            {currentNumber}
          </span>
          <span className="card-chinese">{chinese}</span>
          <span className="card-speak-hint">
            {progress.soundEnabled ? <VolumeIcon /> : <VolumeOffIcon />}
            {progress.soundEnabled ? "点击任意地方朗读" : "声音已关闭"}
          </span>
        </button>

        <div className="card-side-controls">
          <IconButton
            label="上一个数字"
            onClick={() => move(-1)}
            disabled={currentNumber <= range.start}
          >
            <ArrowLeftIcon />
          </IconButton>
          <IconButton
            label={currentNumber >= range.end ? "完成这一组" : "下一个数字"}
            onClick={() => move(1)}
            tone="blue"
          >
            <ArrowRightIcon />
          </IconButton>
        </div>
      </section>

      <p className="swipe-hint">左右滑动切换数字</p>
    </main>
  );
}
