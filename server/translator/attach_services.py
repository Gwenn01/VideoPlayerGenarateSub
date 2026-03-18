import subprocess
import os

class AttachSubtitleService:

    @staticmethod
    def attach_subtitle(video_path: str, srt_path: str, output_path: str) -> str:
        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        subtitle_style = (
            "FontName=Arial,"
            "FontSize=14,"
            "PrimaryColour=&H00FFFFFF,"
            "OutlineColour=&H00000000,"
            "Outline=1,"
            "Shadow=1,"
            "Alignment=2,"
            "MarginV=20"
        )

        # Use just the filename — no path escaping issues on Windows
        srt_dir = os.path.dirname(os.path.abspath(srt_path))
        srt_filename = os.path.basename(srt_path)

        cmd = [
            "ffmpeg", "-y",
            "-i", os.path.abspath(video_path),
            "-vf", f"subtitles={srt_filename}:force_style='{subtitle_style}'",
            "-c:a", "copy",
            os.path.abspath(output_path),
        ]

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            cwd=srt_dir,  #  Run from the SRT directory
        )

        #  Always print the real FFmpeg error
        if result.returncode != 0:
            raise Exception(f"FFmpeg failed:\n{result.stderr[-3000:]}")

        if not os.path.exists(output_path):
            raise Exception("Output video was not created.")

        print("[SUCCESS] Subtitle burned into video")
        return output_path