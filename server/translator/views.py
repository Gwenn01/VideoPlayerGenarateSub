from django.shortcuts import render
import os
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .services import transcribe_audio, generate_srt

class TranslatorViews(APIView):
    def post(self, request):
        ...
        audio_file = request.FILES.get("audio")
        if not audio_file:
            return Response({"error": "No audio file"}, status=status.HTTP_400_BAD_REQUEST)
        # Save file temporarily
        file_path = f"media/{audio_file.name}"
        with open(file_path, "wb+") as f:
            for chunk in audio_file.chunks():
                f.write(chunk)
        # Run Whisper
        result = transcribe_audio(file_path)
        # Generate SRT
        srt = generate_srt(result["segments"])
        # Optional: delete file after processing
        os.remove(file_path)
        return Response({
            "text": result["text"],
            "srt": srt
        }, status=status.HTTP_200_OK)

        