from __future__ import annotations

import hashlib
import json
import shutil
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public" / "audio" / "numbers"
DIGITS = "零一二三四五六七八九"


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


def main() -> None:
    for command in ("espeak", "ffmpeg", "ffprobe"):
        if not command_exists(command):
            raise RuntimeError(f"缺少命令：{command}")

    OUTPUT.mkdir(parents=True, exist_ok=True)
    manifest: dict[str, object] = {
        "version": "2026-08-21-v1",
        "mime": "audio/mpeg",
        "generator": "espeak zh+f3 + ffmpeg",
        "files": {}
    }

    with tempfile.TemporaryDirectory(prefix="baby-number-audio-") as temp_dir:
        temp = Path(temp_dir)
        for number in range(1, 101):
            text = to_chinese(number)
            wav = temp / f"{number}.wav"
            target = OUTPUT / f"{number}.mp3"

            subprocess.run([
                "espeak", "-v", "zh+f3", "-s", "125", "-p", "58", "-a", "180",
                "-w", str(wav), text
            ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

            subprocess.run([
                "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(wav),
                "-af",
                "silenceremove=start_periods=1:start_duration=0.015:start_threshold=-52dB:"
                "stop_periods=1:stop_duration=0.06:stop_threshold=-52dB,"
                "apad=pad_dur=0.10,loudnorm=I=-18:TP=-2:LRA=7",
                "-ar", "24000", "-ac", "1", "-codec:a", "libmp3lame", "-b:a", "48k",
                str(target)
            ], check=True)

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

    (OUTPUT / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8"
    )
    print(f"已生成 {len(manifest['files'])} 个数字音频：{OUTPUT}")


if __name__ == "__main__":
    main()
