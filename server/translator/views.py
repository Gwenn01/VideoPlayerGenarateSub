from django.shortcuts import render
import os
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from .services import TranslatorService
from .attach_services import AttachSubtitleService

def get_media_url(request, relative_path: str) -> str:
    """Build absolute URL for a media file."""
    return request.build_absolute_uri(settings.MEDIA_URL + relative_path)
 
 
def save_upload(file, media_dir: str) -> str:
    """Save an uploaded file to disk and return its full path."""
    os.makedirs(media_dir, exist_ok=True)
    file_path = os.path.join(media_dir, file.name)
    with open(file_path, "wb+") as f:
        for chunk in file.chunks():
            f.write(chunk)
    return file_path

# ─── STEP 1: Transcribe & generate SRT ──────────────────────────────────────
class TranslatorView(APIView):
    def post(self, request):
        video_file = request.FILES.get("video")

        if not video_file:
            return Response(
                {"error": "No video file provided."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        media_dir = os.path.join(settings.MEDIA_ROOT, "uploads")
        video_path = save_upload(video_file, media_dir)

        try:
            result = TranslatorService.process_video(video_path)

            return Response({
                "message": "Processing successful",
                "original_video": result["original_video"],
                "subtitle": result["subtitle"],
                "video": result["video"],
                "text": result["text"],
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
 