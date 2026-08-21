"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BackButton, Confetti, PageTitle, QuantityDisplay, SoundButton, StarBadge } from "@/components/ui";
import { PlaySoundIcon, StarIcon } from "@/components/icons";
import { createAnswerOptions, getNumberItem, toChineseNumber } from "@/lib/numbers";
import { useChineseSpeech } from "@/hooks/use-chinese-speech";
import { useProgress } from "@/providers/progress-provider";

type GameMode = "menu" | "count" | "listen";

type Question = {
  target: number;
  options: number[];
};

const INITIAL_QUESTION: Question = {
  target: 1,
  options: [1, 2, 3]
};

function createQuestion(): Question {
  const target = Math.floor(Math.random() * 10) + 1;
  return {
    target,
    options: createAnswerOptions(target)
  };
}

export function GamesScreen({ onBack }: { onBack: () => void }) {
  const {
    progress,
    ready,
    addStars,
    recordAnswer,
    setSoundEnabled,
    toggleSound
  } = useProgress();
  const { supported, speak } = useChineseSpeech(progress.soundEnabled);
  const [mode, setMode] = useState<GameMode>("menu");
  const [question, setQuestion] = useState<Question>(INITIAL_QUESTION);
  const [feedback, setFeedback] = useState("");
  const [locked, setLocked] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [soundDialog, setSoundDialog] = useState<"required" | "unsupported" | null>(null);
  const nextTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearNextTimer = useCallback(() => {
    if (nextTimer.current !== null) {
      clearTimeout(nextTimer.current);
      nextTimer.current = null;
    }
  }, []);

  useEffect(() => clearNextTimer, [clearNextTimer]);

  const beginQuestion = useCallback((nextMode: Exclude<GameMode, "menu">, forceSound = false) => {
    clearNextTimer();
    const nextQuestion = createQuestion();
    setQuestion(nextQuestion);
    setFeedback("");
    setLocked(false);
    setShowSuccess(false);
    setMode(nextMode);

    if (nextMode === "listen") {
      speak(toChineseNumber(nextQuestion.target), { force: forceSound });
    }
  }, [clearNextTimer, speak]);

  const openListeningGame = () => {
    if (!progress.soundEnabled) {
      setSoundDialog("required");
      return;
    }

    if (!supported) {
      setSoundDialog("unsupported");
      return;
    }

    beginQuestion("listen");
  };

  const answer = (value: number) => {
    if (locked) {
      return;
    }

    const correct = value === question.target;
    recordAnswer(correct);

    if (!correct) {
      setFeedback("再数一数");
      return;
    }

    setLocked(true);
    setFeedback("");
    setShowSuccess(true);
    addStars(1);

    nextTimer.current = setTimeout(() => {
      beginQuestion(mode === "listen" ? "listen" : "count");
    }, 1400);
  };

  const handleBack = () => {
    clearNextTimer();
    if (mode === "menu") {
      onBack();
      return;
    }
    setMode("menu");
    setFeedback("");
    setShowSuccess(false);
    setLocked(false);
  };

  const playListeningNumber = () => {
    if (!progress.soundEnabled) {
      setSoundDialog("required");
      return;
    }
    if (!supported) {
      setSoundDialog("unsupported");
      return;
    }
    speak(toChineseNumber(question.target));
  };

  return (
    <main className="screen games-screen" data-testid="games-screen">
      <header className="page-header">
        <BackButton onClick={handleBack} />
        <PageTitle>{mode === "menu" ? "数字游戏" : mode === "count" ? "看数字选数量" : "听声音找数字"}</PageTitle>
        <StarBadge stars={progress.stars} ready={ready} />
      </header>

      {mode === "menu" ? (
        <>
          <div className="games-sound-row">
            <span>游戏声音</span>
            <SoundButton
              enabled={progress.soundEnabled}
              ready={ready}
              onToggle={toggleSound}
            />
          </div>

          <section className="game-menu" aria-label="选择游戏">
            <button
              type="button"
              className="game-menu-card game-menu-count"
              onClick={() => beginQuestion("count")}
              data-testid="game-count"
            >
              <span aria-hidden="true">🍎</span>
              <strong>看数字选答案</strong>
              <small>看看数字，再选一样多的物品</small>
            </button>

            <button
              type="button"
              className="game-menu-card game-menu-listen"
              onClick={openListeningGame}
              data-testid="game-listen"
            >
              <span aria-hidden="true">🔊</span>
              <strong>听声音找数字</strong>
              <small>{progress.soundEnabled ? "听一听，找到正确数字" : "需要先打开声音"}</small>
            </button>
          </section>
        </>
      ) : null}

      {mode === "count" ? (
        <section className="game-question" data-testid="count-question">
          <p className="game-prompt">数字几表示这么多？</p>
          <div className="question-number" aria-label={`数字 ${question.target}`}>
            {question.target}
          </div>
          <p className="game-helper">选出有 {question.target} 个物品的卡片</p>

          <div className="count-options">
            {question.options.map((option) => (
              <button
                type="button"
                className="count-option"
                key={option}
                onClick={() => answer(option)}
                disabled={locked}
                data-correct={option === question.target ? "true" : "false"}
                aria-label={`${option} 个苹果`}
              >
                <QuantityDisplay count={option} item={getNumberItem(1)} compact />
              </button>
            ))}
          </div>

          <p className={`game-feedback ${feedback ? "is-visible" : ""}`} role="status">
            {feedback || "　"}
          </p>
        </section>
      ) : null}

      {mode === "listen" ? (
        <section className="game-question listening-question" data-testid="listen-question">
          <p className="game-prompt">听一听，是哪个数字？</p>
          <button
            type="button"
            className="listen-play-button"
            onClick={playListeningNumber}
            aria-label="播放数字读音"
            data-testid="listen-play"
          >
            <PlaySoundIcon />
          </button>
          <p className="game-helper">可以多听几次</p>

          <div className="number-options">
            {question.options.map((option) => (
              <button
                type="button"
                className="number-option"
                key={option}
                onClick={() => answer(option)}
                disabled={locked}
                data-correct={option === question.target ? "true" : "false"}
              >
                {option}
              </button>
            ))}
          </div>

          <p className={`game-feedback ${feedback ? "is-visible" : ""}`} role="status">
            {feedback || "　"}
          </p>
        </section>
      ) : null}

      {showSuccess ? (
        <div
          className="success-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="答对啦"
          data-testid="success-overlay"
        >
          <Confetti count={28} />
          <div className="success-panel">
            <div className="success-star" aria-hidden="true">🌟</div>
            <strong>答对啦！</strong>
            <span>太棒了！</span>
            <div className="success-reward">
              <StarIcon />
              +1
            </div>
          </div>
        </div>
      ) : null}

      {soundDialog ? (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="sound-dialog-title"
          data-testid="sound-required-dialog"
        >
          <section className="modal-card">
            <span className="modal-emoji" aria-hidden="true">
              {soundDialog === "unsupported" ? "😿" : "🔊"}
            </span>
            <h2 id="sound-dialog-title">
              {soundDialog === "unsupported" ? "当前浏览器不能朗读" : "这个游戏需要声音"}
            </h2>
            <p>
              {soundDialog === "unsupported"
                ? "请使用最新版 Safari、Chrome 或 Edge 打开。"
                : "打开声音后，听一听数字怎么读。"}
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="secondary-action"
                onClick={() => setSoundDialog(null)}
              >
                返回
              </button>
              {soundDialog === "required" ? (
                <button
                  type="button"
                  className="primary-action"
                  onClick={() => {
                    setSoundEnabled(true);
                    if (!supported) {
                      setSoundDialog("unsupported");
                      return;
                    }
                    setSoundDialog(null);
                    beginQuestion("listen", true);
                  }}
                  data-testid="enable-sound-and-start"
                >
                  打开声音并开始
                </button>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
