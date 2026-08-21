"use client";

import { useEffect, useState } from "react";
import { CelebrationScreen } from "@/components/celebration-screen";
import { GamesScreen } from "@/components/games-screen";
import { HomeScreen } from "@/components/home-screen";
import { LearnScreen } from "@/components/learn-screen";
import { NumberCardScreen } from "@/components/number-card-screen";
import { RangeSelector, type RangeMode } from "@/components/range-selector";
import { StarsScreen } from "@/components/stars-screen";
import { NUMBER_RANGES, type NumberRange } from "@/lib/numbers";
import { useProgress } from "@/providers/progress-provider";

type Screen = "home" | "ranges" | "learn" | "card" | "games" | "stars" | "celebration";

export function BabyNumbersApp() {
  const {
    progress,
    hasProgress,
    addStars,
    completeRange,
    isRangeCompleted
  } = useProgress();
  const [screen, setScreen] = useState<Screen>("home");
  const [rangeMode, setRangeMode] = useState<RangeMode>("learn");
  const [selectedRange, setSelectedRange] = useState<NumberRange>(NUMBER_RANGES[0]);
  const [currentNumber, setCurrentNumber] = useState(1);
  const [celebrationReward, setCelebrationReward] = useState(0);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [screen]);

  const openRanges = (mode: RangeMode) => {
    setRangeMode(mode);
    setScreen("ranges");
  };

  const startRange = (range: NumberRange) => {
    const resumeNumber = hasProgress
      && progress.lastNumber !== null
      && progress.lastNumber >= range.start
      && progress.lastNumber <= range.end
        ? progress.lastNumber
        : range.start;

    setSelectedRange(range);
    setCurrentNumber(resumeNumber);
    setScreen(rangeMode === "learn" ? "learn" : "card");
  };

  const finishRange = () => {
    const alreadyCompleted = isRangeCompleted(selectedRange.key);
    const reward = alreadyCompleted ? 0 : 3;

    if (!alreadyCompleted) {
      completeRange(selectedRange.key);
      addStars(reward);
    }

    setCelebrationReward(reward);
    setScreen("celebration");
  };

  const openNextRange = () => {
    const currentIndex = NUMBER_RANGES.findIndex((range) => range.key === selectedRange.key);
    const nextRange = NUMBER_RANGES[currentIndex + 1];

    if (!nextRange) {
      setScreen("home");
      return;
    }

    setSelectedRange(nextRange);
    setCurrentNumber(nextRange.start);
    setScreen(rangeMode === "learn" ? "learn" : "card");
  };

  if (screen === "ranges") {
    return (
      <RangeSelector
        mode={rangeMode}
        onBack={() => setScreen("home")}
        onSelect={startRange}
      />
    );
  }

  if (screen === "learn") {
    return (
      <LearnScreen
        range={selectedRange}
        currentNumber={currentNumber}
        onBack={() => setScreen("ranges")}
        onNumberChange={setCurrentNumber}
        onFinish={finishRange}
      />
    );
  }

  if (screen === "card") {
    return (
      <NumberCardScreen
        range={selectedRange}
        currentNumber={currentNumber}
        onBack={() => setScreen("ranges")}
        onNumberChange={setCurrentNumber}
        onFinish={finishRange}
      />
    );
  }

  if (screen === "games") {
    return <GamesScreen onBack={() => setScreen("home")} />;
  }

  if (screen === "stars") {
    return <StarsScreen onBack={() => setScreen("home")} />;
  }

  if (screen === "celebration") {
    const currentIndex = NUMBER_RANGES.findIndex((range) => range.key === selectedRange.key);
    return (
      <CelebrationScreen
        reward={celebrationReward}
        hasNextRange={currentIndex < NUMBER_RANGES.length - 1}
        onHome={() => setScreen("home")}
        onNextRange={openNextRange}
      />
    );
  }

  return (
    <HomeScreen
      onLearn={() => openRanges("learn")}
      onGames={() => setScreen("games")}
      onCards={() => openRanges("card")}
      onStars={() => setScreen("stars")}
    />
  );
}
