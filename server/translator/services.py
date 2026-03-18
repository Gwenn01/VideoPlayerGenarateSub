import os
import whisper
import shutil

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# Points to translator/bin where ffmpeg.exe should be
FFMPEG_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "bin")
os.environ["PATH"] = FFMPEG_DIR + os.pathsep + os.environ["PATH"]
print("FFmpeg detected at:", shutil.which("ffmpeg"))
model = whisper.load_model("base")

def transcribe_audio(file_path):
    file_path = os.path.join(BASE_DIR, file_path)
    print("Processing file:", file_path)
    result = model.transcribe(file_path)
    return {
        "text": result["text"],
        "segments": result["segments"]
    }
    
    
def format_time(seconds):
    millis = int(seconds * 1000)
    hours = millis // 3600000
    minutes = (millis % 3600000) // 60000
    seconds = (millis % 60000) // 1000
    milliseconds = millis % 1000
    return f"{hours:02}:{minutes:02}:{seconds:02},{milliseconds:03}"

def generate_srt(segments):
    srt = ""
    for i, seg in enumerate(segments):
        start = format_time(seg['start'])
        end = format_time(seg['end'])
        text = seg['text'].strip()
        srt += f"{i+1}\n{start} --> {end}\n{text}\n\n"
    return srt

def save_srt(segments, output_path):
    srt_content = generate_srt(segments)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(srt_content)
    return output_path