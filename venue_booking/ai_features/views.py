import logging
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny

from google import genai
from google.genai import types

logger = logging.getLogger(__name__)



class VenueAssistantView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        message = request.data.get("message", "").strip()

        if not message:
            return Response(
                {"error": "Please enter a message."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(message) > 2000:
            return Response(
                {"error": "Message must be 2000 characters or less."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        api_key = settings.GEMINI_API_KEY

        if not api_key:
            return Response(
                {"error": "AI service is not configured."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        try:
            client = genai.Client(api_key=api_key)

            response = client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=message,
                config=types.GenerateContentConfig(
                    system_instruction=(
                        "You are Venuva AI, a helpful assistant for a venue "
                        "booking platform. Help users plan weddings, birthdays, "
                        "meetings, parties, and other events. Give friendly, "
                        "simple, concise answers. Ask clarifying questions "
                        "when necessary. Do not invent venue availability, "
                        "prices, or booking confirmations. Explain that users "
                        "should check the Venuva platform for actual venue "
                        "availability and prices."
                    ),
                    temperature=0.7,
                    max_output_tokens=500,
                ),
            )

            answer = response.text

            if not answer:
                return Response(
                    {"error": "AI could not generate a response."},
                    status=status.HTTP_502_BAD_GATEWAY,
                )

            return Response({"answer": answer})

        except Exception as e:
            logger.exception("Gemini AI assistant failed")

            return Response(
                {
                    "error": "The AI assistant is temporarily unavailable.",
                    "details": str(e),
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
