from django.shortcuts import render
import os
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from .services import process_video

class TranslatorViews(APIView):
    def post(self, request):
        # Step 1: Check if video file was uploaded
        video_file = request.FILES.get("video")
        if not video_file:
            return Response(
                {"error": "No video file provided."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Step 2: Save uploaded video to media folder
        media_dir = os.path.join(settings.MEDIA_ROOT, "uploads")
        os.makedirs(media_dir, exist_ok=True)

        video_path = os.path.join(media_dir, video_file.name)
        with open(video_path, "wb+") as f:
            for chunk in video_file.chunks():
                f.write(chunk)

        try:
            # Step 3: Process video (extract audio → transcribe → generate srt)
            result = process_video(video_path)

            # Step 4: Build URLs for frontend
            srt_filename = os.path.basename(result["subtitle"])
            video_filename = os.path.basename(result["video"])

            srt_url = request.build_absolute_uri(
                settings.MEDIA_URL + "uploads/" + srt_filename
            )
            video_url = request.build_absolute_uri(
                settings.MEDIA_URL + "uploads/" + video_filename
            )

            return Response({
                "message": "Transcription successful.",
                "text": result["text"],
                "subtitle_url": srt_url,
                "video_url": video_url,
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )