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
    
    # attach the subtle on the video
    @staticmethod
    def attach_subtitle(video_path: str, subtitle_path: str) -> dict:
        output_dir = os.path.join(settings.MEDIA_ROOT, "video_sub")
        os.makedirs(output_dir, exist_ok=True)

        base_name = os.path.splitext(os.path.basename(video_path))[0]

        unique_id = uuid.uuid4().hex

        soft_path = os.path.join(output_dir, f"{base_name}_{unique_id}_soft.mp4")
        burn_path = os.path.join(output_dir, f"{base_name}_{unique_id}_burned.mp4")

        AttachSubtitleService.attach_subtitle_to_video(video_path, subtitle_path, soft_path)
        AttachSubtitleService.burn_subtitle_to_video(video_path, subtitle_path, burn_path)

        return {
            "soft_path": soft_path,
            "burned_path": burn_path,
        }

    @staticmethod
    # LAST STEP PROCESSING VIDEO
    def process_video(video_path: str) -> dict:
        print("Step 1: Extracting audio...")
        audio_path = TranslatorService.extract_audio(video_path)

        print("Step 2: Transcribing audio...")
        result = transcribe_audio(audio_path)

        print("Step 3: Generating subtitle...")
        srt_path = os.path.splitext(video_path)[0] + ".srt"
        save_srt(result["segments"], srt_path)

        print("Step 4: Attaching subtitle to video...")
        output_path = os.path.splitext(video_path)[0] + "_subtitled.mp4"
        final_video = AttachSubtitleService.attach_subtitle(video_path, srt_path, output_path)
        print("Done!")
        return {
            "original_video": video_path,
            "subtitle": srt_path,
            "video": final_video,
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