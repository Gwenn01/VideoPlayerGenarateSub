import subprocess
import os

class AttachSubtitleService:

    @staticmethod
    def attach_subtitle(video_path: str, srt_path: str, output_path: str) -> str:
        os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)

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

        srt_dir = os.path.dirname(os.path.abspath(srt_path))
        srt_filename = os.path.basename(srt_path)

        cmd = [
            "ffmpeg", "-y",
            "-i", os.path.abspath(video_path),
            "-vf", f"subtitles={srt_filename}:force_style='{subtitle_style}'",
            "-map", "0:v:0",
            "-an",              
            "-c:v", "libx264",
            os.path.abspath(output_path),
        ]

        result = subprocess.run(cmd, capture_output=True, text=True, cwd=srt_dir)
        if result.returncode != 0:
            raise Exception(f"FFmpeg failed:\n{result.stderr[-3000:]}")
        if not os.path.exists(output_path):
            raise Exception("Output video was not created.")
        print("[SUCCESS] Subtitle burned into video")
        return output_path
    
    
    @staticmethod
    def attach_audio(video_path: str, audio_path: str, final_output: str):
        cmd = [
            "ffmpeg", "-y",
            "-i", video_path,
            "-i", audio_path,
            "-map", "0:v:0",
            "-map", "1:a:0",
            "-c:v", "copy",   # ✅ no re-encode (faster)
            "-c:a", "aac",
            "-shortest",      # ✅ prevent desync
            final_output
        ]

        result = subprocess.run(cmd, capture_output=True, text=True)

        if result.returncode != 0:
            raise Exception(result.stderr)

        return final_output
        
