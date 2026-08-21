"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { toChineseNumber } from "@/lib/numbers";

type SpeakOptions = {
  force?: boolean;
  rate?: number;
};

type SpeakValue = number | string;

const AUDIO_VERSION = "2026-08-21-v2-natural";
const chineseNumberLookup = new Map<string, number>(
  Array.from({ length: 100 }, (_, index) => {
    const number = index + 1;
    return [toChineseNumber(number), number] as const;
  })
);

let sharedAudio: HTMLAudioElement | null = null;
let sharedAudioNumber: number | null = null;
let sharedUtterance: SpeechSynthesisUtterance | null = null;
let globalPlaybackToken = 0;

function subscribeSpeechSupport(): () => void {
  return () => undefined;
}

function getAudioSupport(): boolean {
  return typeof window !== "undefined"
    && typeof document !== "undefined"
    && typeof window.Audio === "function";
}

function getSpeechSupport(): boolean {
  return typeof window !== "undefined"
    && "speechSynthesis" in window
    && "SpeechSynthesisUtterance" in window;
}

function getClientSupport(): boolean {
  return getAudioSupport() || getSpeechSupport();
}

function getServerSpeechSupport(): boolean {
  return false;
}

function getNumberAudioUrl(number: number): string {
  return `/audio/numbers/${number}.mp3?v=${AUDIO_VERSION}`;
}

function normalizeNumber(value: SpeakValue): number | null {
  if (typeof value === "number") {
    return Number.isInteger(value) && value >= 1 && value <= 100 ? value : null;
  }

  return chineseNumberLookup.get(value.trim()) ?? null;
}

function getSharedAudio(): HTMLAudioElement | null {
  if (!getAudioSupport()) return null;
  if (sharedAudio?.isConnected) return sharedAudio;

  const audio = new window.Audio();
  audio.preload = "auto";
  audio.volume = 1;
  audio.muted = false;
  audio.controls = false;
  audio.setAttribute("playsinline", "");
  audio.setAttribute("webkit-playsinline", "");
  audio.setAttribute("aria-hidden", "true");
  audio.tabIndex = -1;
  Object.assign(audio.style, {
    position: "fixed",
    left: "-9999px",
    bottom: "0",
    width: "1px",
    height: "1px",
    opacity: "0",
    pointerEvents: "none"
  });
  document.body.appendChild(audio);
  sharedAudio = audio;
  return audio;
}

function pickChineseVoice(): SpeechSynthesisVoice | undefined {
  if (!getSpeechSupport()) return undefined;
  const voices = window.speechSynthesis.getVoices();
  return voices.find((voice) => /^(zh-CN|zh_Hans|zh(-|_))/i.test(voice.lang))
    ?? voices.find((voice) => /ting|mei-jia|sin-ji|li-mu/i.test(voice.name));
}

function stopAllAudio() {
  globalPlaybackToken += 1;

  if (sharedAudio) {
    sharedAudio.pause();
    try {
      sharedAudio.currentTime = 0;
    } catch {
      // Safari 在音频元数据尚未读取时可能禁止 seek。
    }
  }

  if (getSpeechSupport()) {
    window.speechSynthesis.cancel();
    sharedUtterance = null;
  }
}

export function useChineseSpeech(soundEnabled: boolean) {
  const supported = useSyncExternalStore(
    subscribeSpeechSupport,
    getClientSupport,
    getServerSpeechSupport
  );
  const mounted = useRef(true);

  const speakWithSystemVoice = useCallback((text: string, rate = 0.72) => {
    if (!getSpeechSupport()) return false;

    const synth = window.speechSynthesis;
    synth.cancel();
    synth.resume();

    const utterance = new SpeechSynthesisUtterance(text);
    sharedUtterance = utterance;
    utterance.lang = "zh-CN";
    utterance.rate = rate;
    utterance.pitch = 1.08;
    utterance.volume = 1;

    const voice = pickChineseVoice();
    if (voice) utterance.voice = voice;

    const clear = () => {
      if (sharedUtterance === utterance) sharedUtterance = null;
    };
    utterance.onend = clear;
    utterance.onerror = clear;

    window.setTimeout(() => {
      if (!mounted.current) return;
      synth.resume();
      synth.speak(utterance);
    }, 0);
    return true;
  }, []);

  const speak = useCallback((value: SpeakValue, options: SpeakOptions = {}) => {
    if (!soundEnabled && !options.force) return false;

    const number = normalizeNumber(value);
    const text = typeof value === "number" ? toChineseNumber(value) : value;

    if (number !== null) {
      const audio = getSharedAudio();

      if (audio) {
        const token = globalPlaybackToken + 1;
        globalPlaybackToken = token;

        if (getSpeechSupport()) {
          window.speechSynthesis.cancel();
          sharedUtterance = null;
        }

        audio.pause();
        audio.muted = false;
        audio.volume = 1;
        audio.playbackRate = 1;

        const nextSource = getNumberAudioUrl(number);
        if (sharedAudioNumber !== number || !audio.currentSrc.includes(`/audio/numbers/${number}.mp3`)) {
          audio.src = nextSource;
          sharedAudioNumber = number;
          audio.load();
        } else {
          try {
            audio.currentTime = 0;
          } catch {
            // Safari 在音频尚未就绪时可能禁止 seek。
          }
        }

        let fallbackStarted = false;
        const fallback = () => {
          if (fallbackStarted || globalPlaybackToken !== token) return;
          fallbackStarted = true;
          speakWithSystemVoice(text, options.rate);
        };

        try {
          // 必须在点击事件的同步调用栈中执行，iPhone 才会授权媒体播放。
          const playPromise = audio.play();
          if (playPromise) {
            void playPromise.catch(fallback);
          }
          return true;
        } catch {
          fallback();
          return getSpeechSupport();
        }
      }
    }

    return speakWithSystemVoice(text, options.rate);
  }, [soundEnabled, speakWithSystemVoice]);

  const stop = useCallback(() => {
    stopAllAudio();
  }, []);

  useEffect(() => {
    mounted.current = true;

    const audio = getSharedAudio();
    if (audio && !audio.getAttribute("src")) {
      audio.src = getNumberAudioUrl(1);
      sharedAudioNumber = 1;
      audio.load();
    }

    if (getSpeechSupport()) {
      const synth = window.speechSynthesis;
      const loadVoices = () => synth.getVoices();
      loadVoices();
      synth.addEventListener?.("voiceschanged", loadVoices);

      return () => {
        mounted.current = false;
        synth.removeEventListener?.("voiceschanged", loadVoices);
        stop();
      };
    }

    return () => {
      mounted.current = false;
      stop();
    };
  }, [stop]);

  return {
    supported,
    speak,
    stop
  };
}
