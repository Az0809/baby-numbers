"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";

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

function pickChineseVoice(): SpeechSynthesisVoice | undefined {
  if (!getSpeechSupport()) return undefined;
  const voices = window.speechSynthesis.getVoices();
  return voices.find((voice) => /^(zh-CN|zh_Hans|zh(-|_))/i.test(voice.lang))
    ?? voices.find((voice) => /ting|mei-jia|sin-ji|li-mu/i.test(voice.name));
}

export function useChineseSpeech(soundEnabled: boolean) {
  const supported = useSyncExternalStore(
    subscribeSpeechSupport,
    getSpeechSupport,
    getServerSpeechSupport
  );
  const activeUtterance = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = useCallback((text: string, options: SpeakOptions = {}) => {
    if (!getSpeechSupport() || (!soundEnabled && !options.force)) {
      return false;
    }

    const synth = window.speechSynthesis;
    synth.cancel();
    synth.resume();

    const utterance = new SpeechSynthesisUtterance(text);
    activeUtterance.current = utterance;
    utterance.lang = "zh-CN";
    utterance.rate = options.rate ?? 0.72;
    utterance.pitch = 1.08;
    utterance.volume = 1;

    const voice = pickChineseVoice();
    if (voice) utterance.voice = voice;

    utterance.onend = () => {
      if (activeUtterance.current === utterance) activeUtterance.current = null;
    };
    utterance.onerror = () => {
      if (activeUtterance.current === utterance) activeUtterance.current = null;
    };

    // iOS Safari 有时在 cancel() 后立即 speak() 会静默，延迟一个事件循环更稳定。
    window.setTimeout(() => {
      synth.resume();
      synth.speak(utterance);
    }, 0);
    return true;
  }, [soundEnabled]);

  const stop = useCallback(() => {
    if (getSpeechSupport()) {
      window.speechSynthesis.cancel();
      activeUtterance.current = null;
    }
  }, []);

  useEffect(() => {
    if (!getSpeechSupport()) return stop;
    const synth = window.speechSynthesis;
    const loadVoices = () => synth.getVoices();
    loadVoices();
    synth.addEventListener?.("voiceschanged", loadVoices);
    return () => {
      synth.removeEventListener?.("voiceschanged", loadVoices);
      stop();
    };
  }, [stop]);

  return {
    supported,
    speak,
    stop
  };
}
