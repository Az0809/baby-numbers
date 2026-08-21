"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

type SpeakOptions = {
  force?: boolean;
  rate?: number;
};

function subscribeSpeechSupport(): () => void {
  return () => undefined;
}

function getSpeechSupport(): boolean {
  return typeof window !== "undefined"
    && "speechSynthesis" in window
    && "SpeechSynthesisUtterance" in window;
}

function getServerSpeechSupport(): boolean {
  return false;
}

export function useChineseSpeech(soundEnabled: boolean) {
  const supported = useSyncExternalStore(
    subscribeSpeechSupport,
    getSpeechSupport,
    getServerSpeechSupport
  );

  const speak = useCallback((text: string, options: SpeakOptions = {}) => {
    const canSpeak = getSpeechSupport();

    if (!canSpeak || (!soundEnabled && !options.force)) {
      return false;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";
    utterance.rate = options.rate ?? 0.72;
    utterance.pitch = 1.08;
    utterance.volume = 1;

    const voices = window.speechSynthesis.getVoices();
    const chineseVoice = voices.find((voice) => /^zh(-|_)/i.test(voice.lang));
    if (chineseVoice) {
      utterance.voice = chineseVoice;
    }

    window.speechSynthesis.speak(utterance);
    return true;
  }, [soundEnabled]);

  const stop = useCallback(() => {
    if (getSpeechSupport()) {
      window.speechSynthesis.cancel();
    }
  }, []);

  useEffect(() => stop, [stop]);

  return {
    supported,
    speak,
    stop
  };
}
