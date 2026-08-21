"use client";

import { useCallback, useEffect, useState } from "react";
import { toChineseNumber } from "@/lib/numbers";

type SpeakOptions = {
  force?: boolean;
  rate?: number;
};

type SpeakValue = number | string;

type AudioManifest = {
  version?: string;
  generator?: string;
};

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

function scoreVoice(voice: SpeechSynthesisVoice): number {
  const lang = voice.lang.toLowerCase();
  const name = voice.name.toLowerCase();
  let score = 0;

  if (lang === "zh-cn" || lang === "zh_cn") score += 100;
  else if (lang.startsWith("zh")) score += 60;

  if (/tingting|ting-ting|shelley|xiaoyi|xiaoxiao|huihui|yaoyao/.test(name)) score += 30;
  if (/siri|premium|enhanced|natural|neural/.test(name)) score += 20;
  if (voice.localService) score += 5;

  return score;
}

function pickChineseVoice(): SpeechSynthesisVoice | undefined {
  if (!getSpeechSupport()) return undefined;
  return window.speechSynthesis
    .getVoices()
    .filter((voice) => /^zh(?:-|_)/i.test(voice.lang) || /ting|shelley|xiaoyi|xiaoxiao/i.test(voice.name))
    .sort((a, b) => scoreVoice(b) - scoreVoice(a))[0];
}

function playNaturalLocalAudio(number: number): boolean {
  const audio = getSharedAudio();
  if (!audio) return false;

  const token = ++globalPlaybackToken;
  audio.pause();
  audio.muted = false;
  audio.volume = 1;
  audio.playbackRate = 1;

  if (sharedAudioNumber !== number || !audio.currentSrc.includes(`/audio/numbers/${number}.mp3`)) {
    audio.src = getNumberAudioUrl(number);
    sharedAudioNumber = number;
    audio.load();
  } else {
    try {
      audio.currentTime = 0;
    } catch {
      // Safari 元数据未加载完成时可能禁止 seek。
    }
  }

  try {
    const playPromise = audio.play();
    if (playPromise) {
      void playPromise.catch(() => {
        if (globalPlaybackToken === token) {
          // 自然音频播放失败时保持静默，不再降级到机械音。
        }
      });
    }
    return true;
  } catch {
    return false;
  }
}

function stopAllAudio() {
  globalPlaybackToken += 1;
  if (sharedAudio) {
    sharedAudio.pause();
    try {
      sharedAudio.currentTime = 0;
    } catch {
      // Safari 元数据未加载完成时可能禁止 seek。
    }
  }
  if (getSpeechSupport()) {
    window.speechSynthesis.cancel();
    sharedUtterance = null;
  }
}

export function useChineseSpeech(soundEnabled: boolean) {
  const [naturalAudioReady, setNaturalAudioReady] = useState(false);
  const supported = getSpeechSupport() || naturalAudioReady;

  useEffect(() => {
    let cancelled = false;

    void fetch(`/audio/numbers/manifest.json?v=${AUDIO_VERSION}`, { cache: "no-store" })
      .then((response) => response.ok ? response.json() as Promise<AudioManifest> : null)
      .then((manifest) => {
        if (cancelled || !manifest) return;
        const isNatural = manifest.version === AUDIO_VERSION
          && /edge-tts|neural|natural/i.test(manifest.generator ?? "");
        setNaturalAudioReady(isNatural);
      })
      .catch(() => {
        if (!cancelled) setNaturalAudioReady(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const speak = useCallback((value: SpeakValue, options: SpeakOptions = {}) => {
    if (!soundEnabled && !options.force) return false;

    const number = normalizeNumber(value);
    const text = typeof value === "number" ? toChineseNumber(value) : value;

    // iPhone/iPad Safari 必须在用户点击的同步调用栈里直接 speak。
    if (getSpeechSupport()) {
      const synth = window.speechSynthesis;
      const utterance = new SpeechSynthesisUtterance(text);
      sharedUtterance = utterance;
      utterance.lang = "zh-CN";
      utterance.rate = options.rate ?? 0.78;
      utterance.pitch = 1.03;
      utterance.volume = 1;

      const voice = pickChineseVoice();
      if (voice) utterance.voice = voice;

      let started = false;
      utterance.onstart = () => {
        started = true;
      };
      utterance.onend = () => {
        if (sharedUtterance === utterance) sharedUtterance = null;
      };
      utterance.onerror = () => {
        if (sharedUtterance === utterance) sharedUtterance = null;
        if (!started && naturalAudioReady && number !== null) {
          playNaturalLocalAudio(number);
        }
      };

      try {
        if (synth.speaking || synth.pending) synth.cancel();
        synth.resume();
        synth.speak(utterance);
        return true;
      } catch {
        if (naturalAudioReady && number !== null) return playNaturalLocalAudio(number);
      }
    }

    if (naturalAudioReady && number !== null) return playNaturalLocalAudio(number);
    return false;
  }, [naturalAudioReady, soundEnabled]);

  const stop = useCallback(() => {
    stopAllAudio();
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
