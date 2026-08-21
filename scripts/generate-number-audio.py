from __future__ import annotations

import asyncio
import hashlib
import json
import shutil
import subprocess
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public" / "audio" / "numbers"
DIGITS = "零一二三四五六七八九"
VOICE = "zh-CN-XiaoyiNeural"
RATE = "-12%"
PITCH = "+4Hz"
VOLUME = "+0%"
AUDIO_VERSION = "2026-08-21-v2-natural"


def to_chinese(number: int) -> str:
    if not 1 <= number <= 100:
        raise ValueError(number)
    if number < 10:
        return DIGITS[number]
    if number == 100:
        return "一百"
    tens, ones = divmod(number, 10)
    prefix = "十" if tens == 1 else f"{DIGITS[tens]}十"
    return prefix + (DIGITS[ones] if ones else "")


def command_exists(name: str) -> bool:
    return shutil.which(name) is not None


async def synthesize(number: int, text: str, target: Path) -> None:
    raw = target.with_suffix(".raw.mp3")
    communicate = edge_tts.Communicate(
        text=text,
        voice=VOICE,
        rate=RATE,
        pitch=PITCH,
        volume=VOLUME,
    )
    await communicate.save(str(raw))

    subprocess.run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(raw),
        "-af",
        "silenceremove=start_periods=1:start_duration=0.01:start_threshold=-55dB:"
        "stop_periods=1:stop_duration=0.05:stop_threshold=-55dB,"
        "apad=pad_dur=0.08,loudnorm=I=-18:TP=-2:LRA=7",
        "-ar", "24000", "-ac", "1", "-codec:a", "libmp3lame", "-b:a", "64k",
        str(target)
    ], check=True)
    raw.unlink(missing_ok=True)


async def main() -> None:
    for command in ("ffmpeg", "ffprobe"):
        if not command_exists(command):
            raise RuntimeError(f"缺少命令：{command}")

    OUTPUT.mkdir(parents=True, exist_ok=True)
    manifest: dict[str, object] = {
        "version": AUDIO_VERSION,
        "mime": "audio/mpeg",
        "generator": f"edge-tts {VOICE}",
        "voice": VOICE,
        "rate": RATE,
        "pitch": PITCH,
        "files": {}
    }

    for number in range(1, 101):
        text = to_chinese(number)
        target = OUTPUT / f"{number}.mp3"
        print(f"生成 {number}: {text}")
        await synthesize(number, text, target)

        duration = subprocess.run([
            "ffprobe", "-v", "error", "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1", str(target)
        ], check=True, capture_output=True, text=True).stdout.strip()

        payload = target.read_bytes()
        manifest["files"][str(number)] = {
            "text": text,
            "path": f"/audio/numbers/{number}.mp3",
            "bytes": len(payload),
            "duration": round(float(duration), 3),
            "sha256": hashlib.sha256(payload).hexdigest()
        }

        # 避免一次性并发过高触发服务端限流。
        await asyncio.sleep(0.08)

    (OUTPUT / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8"
    )
    print(f"已生成 {len(manifest['files'])} 个自然女声数字音频：{OUTPUT}")


if __name__ == "__main__":
    asyncio.run(main())
