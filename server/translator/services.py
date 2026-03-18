import os
import subprocess
from .whisper_services import transcribe_audio, format_time, generate_srt, save_srt

class TranslatorService:
    
    # CONVERT THE VIDEO TO AUDIO
    @staticmethod
    def extract_audio(video_path):
        # Output audio path (same name, different extension)
        audio_path = os.path.splitext(video_path)[0] + ".mp3"
        cmd = [
            "ffmpeg",
            "-i", video_path,      # input video
            "-q:a", "0",           # best audio quality
            "-map", "a",           # extract audio track only
            audio_path,            # output audio file
            "-y"                   # overwrite if exists
        ]
        subprocess.run(cmd, check=True)
        return audio_path


    # ATTACH THE SUBTILE ON THE VIDEO
    def attach_subtitle_to_video(video_path, srt_path, output_path):
        cmd = [
            "ffmpeg",
            "-i", video_path,        # input video
            "-i", srt_path,          # input subtitle
            "-c", "copy",            # copy video/audio (no re-encode)
            "-c:s", "mov_text",      # subtitle codec (for .mp4)
            output_path              # output video
        ]
        subprocess.run(cmd, check=True)
        return output_path

    def burn_subtitle_to_video(video_path, srt_path, output_path):
        cmd = [
            "ffmpeg",
            "-i", video_path,
            "-vf", f"subtitles={srt_path}",   # burn into video frames
            output_path
        ]
        subprocess.run(cmd, check=True)
        return output_path
    
    # LAST STEP
    def process_video(video_path):
        print("Step 1: Extracting audio...")
        audio_path = TranslatorService.extract_audio(video_path)

        print("Step 2: Transcribing audio...")
        result = transcribe_audio(audio_path)

        print("Step 3: Generating subtitle...")
        srt_path = os.path.splitext(video_path)[0] + ".srt"
        save_srt(result["segments"], srt_path)

        print("Done!")
        return {
            "video": video_path,
            "subtitle": srt_path,
            "text": result["text"]
        }