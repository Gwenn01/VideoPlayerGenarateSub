import os
import subprocess
import uuid
from django.conf import settings
from .whisper_services import transcribe_audio, save_srt
from .attach_services import AttachSubtitleService

class TranslatorService:
    
    # CONVERT THE VIDEO TO AUDIO
    @staticmethod
    def extract_audio(video_path: str) -> str:
        audio_path = os.path.splitext(video_path)[0] + ".mp3"
        cmd = ["ffmpeg", "-i", video_path, "-q:a", "0", "-map", "a", audio_path, "-y"]
        subprocess.run(cmd, check=True)
        return audio_path
    
    
    # LAST STEP PROCESSING VIDEO
    @staticmethod
    def process_video(video_path: str) -> dict:
        srt_path = os.path.splitext(video_path)[0] + ".srt"

        try:
            print("Step 1: Extracting audio...")
            audio_path = TranslatorService.extract_audio(video_path)

            print("Step 2: Transcribing audio...")
            result = transcribe_audio(audio_path)

            print("Step 3: Generating subtitle...")
            save_srt(result["segments"], srt_path)

            #  Read subtitle content
            with open(srt_path, "r", encoding="utf-8") as f:
                subtitle_content = f.read()

        finally:
            if os.path.exists(video_path):
                os.remove(video_path)
            if os.path.exists(audio_path):
                os.remove(audio_path)
            if os.path.exists(srt_path):
                os.remove(srt_path)
            print("Done!")

        return {
            "subtitle": subtitle_content,  # <-- actual file content
            "text": result["text"],
        }
        
    @staticmethod        
    # CLEANUP 
    def delete_upload_files(*paths: str) -> None:
        """Delete one or more files from disk."""
        for path in paths:
            if path and os.path.exists(path):
                os.remove(path)
                print(f"Deleted: {path}")