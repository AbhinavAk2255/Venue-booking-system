import logging
import json
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny,IsAuthenticated
from datetime import datetime
from decimal import Decimal, InvalidOperation

from .models import DecorPreview
from venues.models import Venue
from booking.models import Booking
from django.db.models import Q

from google import genai
from google.genai import types
from google.genai import errors

import uuid

from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.shortcuts import get_object_or_404
from .decor_service import generate_decor_preview

logger = logging.getLogger(__name__)




def get_available_venues(
    location=None,
    event_date=None,
    start_time=None,
    end_time=None,
    guest_count=None,
    venue_type=None,
    max_price_per_hour=None,
    sort_by_price=False,
    ):
    # Start with all venues
    venues = Venue.objects.all()

    # Filter by location
    if location:
        venues = venues.filter(location__icontains=location)

    # Filter by guest capacity
    if guest_count:
        venues = venues.filter(capacity__gte=guest_count)

    # Filter by venue type
    if venue_type:
        venues = venues.filter(venue_type=venue_type)

    # Filter by hourly budget
    if max_price_per_hour is not None:
        venues = venues.filter(
            price_per_hour__lte=max_price_per_hour
        )

    # Sort by lowest hourly price
    if sort_by_price:
        venues = venues.order_by("price_per_hour")

    matching_venues = []

    for venue in venues:
        # Only check booking conflicts when date and times are provided
        if event_date and start_time and end_time:
            conflicting_booking = Booking.objects.filter(
                venue=venue,
                booking_date=event_date,
                status__in=["pending", "approved"],
                starting_time__lt=end_time,
                ending_time__gt=start_time,
            ).exists()

            if conflicting_booking:
                continue

        matching_venues.append({
            "id": venue.id,
            "name": venue.venue_name,
            "type": venue.get_venue_type_display(),
            "location": venue.location,
            "capacity": venue.capacity,
            "price_per_hour": str(venue.price_per_hour),
            "description": venue.description,
        })

    return matching_venues





def extract_event_details(client, message):
    prompt = f"""
    Extract venue search requirements from the customer message.

    Return ONLY valid JSON with these fields:
    {{
        "location": "location or null",
        "event_date": "YYYY-MM-DD or null",
        "start_time": "HH:MM or null",
        "end_time": "HH:MM or null",
        "guest_count": integer or null,
        "venue_type": "venue type or null",
        "max_price_per_hour": number or null,
        "sort_by_price": true or false
    }}

    Allowed venue types:
    wedding_hall, banquet_hall, auditorium, conference_hall,
    meeting_room, party_hall, convention_center,
    rooftop_venue, beach_venue, open_ground.

    Rules:
    - Do not guess missing information.
    - Use null for missing values.
    - If the customer says affordable or cheapest,
      set sort_by_price to true.
    - Only set max_price_per_hour when the customer
      gives a specific hourly budget.

    Customer message: {message}
    """

    response = client.models.generate_content(
        model=settings.GEMINI_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            temperature=0,
            max_output_tokens=300,
            response_mime_type="application/json",
        ),
    )

    return json.loads(response.text)


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
            client = genai.Client(
                api_key=api_key,
                http_options=types.HttpOptions(
                    timeout=60000,
                    retry_options=types.HttpRetryOptions(attempts=1),
                ),
            )

            # Step 1: Extract search requirements
            details = extract_event_details(client, message)

            # Step 2: Check whether date/time information is complete
            event_date_text = details.get("event_date")
            start_time_text = details.get("start_time")
            end_time_text = details.get("end_time")

            schedule_details = [
                event_date_text,
                start_time_text,
                end_time_text,
            ]

            has_schedule_details = any(
                value is not None for value in schedule_details
            )

            # If the customer provides partial scheduling information,
            # ask for the missing information.
            if has_schedule_details and not all(schedule_details):
                missing = []

                if not event_date_text:
                    missing.append("event date")
                if not start_time_text:
                    missing.append("starting time")
                if not end_time_text:
                    missing.append("ending time")

                clarification = client.models.generate_content(
                    model=settings.GEMINI_MODEL,
                    contents=(
                        f"Customer message: {message}\n"
                        f"Missing details: {', '.join(missing)}.\n"
                        "Ask politely for the missing information. "
                        "Keep the response short."
                    ),
                    config=types.GenerateContentConfig(
                        temperature=0.4,
                        max_output_tokens=150,
                    ),
                )

                return Response(
                    {"answer": clarification.text},
                    status=status.HTTP_200_OK,
                )

            # Step 3: Convert date and time values
            event_date = None
            start_time = None
            end_time = None

            if has_schedule_details:
                event_date = datetime.strptime(
                    event_date_text, "%Y-%m-%d"
                ).date()

                start_time = datetime.strptime(
                    start_time_text, "%H:%M"
                ).time()

                end_time = datetime.strptime(
                    end_time_text, "%H:%M"
                ).time()

                if start_time >= end_time:
                    return Response(
                        {"error": "Ending time must be after starting time."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                if event_date < datetime.today().date():
                    return Response(
                        {"error": "Please provide a future event date."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            # Step 4: Convert guest count and budget
            guest_count = details.get("guest_count")

            if guest_count is not None:
                guest_count = int(guest_count)

                if guest_count <= 0:
                    return Response(
                        {"error": "Guest count must be greater than zero."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            max_price = details.get("max_price_per_hour")

            if max_price is not None:
                max_price = Decimal(str(max_price))

                if max_price < 0:
                    return Response(
                        {"error": "Budget cannot be negative."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            # Step 5: Search actual database records
            venues = get_available_venues(
                location=details.get("location"),
                event_date=event_date,
                start_time=start_time,
                end_time=end_time,
                guest_count=guest_count,
                venue_type=details.get("venue_type"),
                max_price_per_hour=max_price,
                sort_by_price=details.get("sort_by_price", False),
            )

            availability_checked = has_schedule_details

            # Step 6: Generate a response using database results
            ai_response = client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=f"""
                Customer message:
                {message}

                Matching venues from the Venuva database:
                {json.dumps(venues, indent=2)}

                Date-specific availability checked:
                {availability_checked}

                Rules:
                - Only mention venues present in the database results.
                - Never invent venue names, prices, capacities or locations.
                - Show the venue name, type, location, capacity
                and hourly price.
                - If no venues match, say no matching venues were found.
                - If date-specific availability was checked, explain
                that these venues have no conflicting pending or
                approved bookings for the requested time.
                - If date-specific availability was NOT checked,
                clearly explain that booking availability still
                needs to be checked for the customer's event date.
                - Never claim that a booking has been confirmed.
                - Keep the answer short and conversational.
                """,
                config=types.GenerateContentConfig(
                    temperature=0.3,
                    max_output_tokens=500,
                ),
            )

            if not ai_response.text:
                return Response(
                    {"error": "AI could not generate a response."},
                    status=status.HTTP_502_BAD_GATEWAY,
                )

            return Response(
                {
                    "answer": ai_response.text,
                    "venues": venues,
                    "availability_checked": availability_checked,
                },
                status=status.HTTP_200_OK,
            )

        except (ValueError, TypeError, KeyError, InvalidOperation):
            logger.exception("Invalid event search details")

            return Response(
                {"error": "Could not understand the search details. Please try again."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        except errors.APIError:
            logger.exception("Gemini API error")

            return Response(
                {"error": "Gemini AI service is temporarily unavailable."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        except Exception:
            logger.exception("Unexpected AI assistant error")

            return Response(
                {"error": "Something went wrong with the AI assistant."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )



class VenueDecorPreviewView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        venue_id = request.data.get("venue_id")
        prompt = request.data.get("prompt")

        if not venue_id:
            return Response(
                {"error": "Venue ID is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not prompt or not isinstance(prompt, str):
            return Response(
                {"error": "Decoration prompt is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        prompt = prompt.strip()

        if not prompt:
            return Response(
                {"error": "Decoration prompt cannot be empty."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if len(prompt) > 2000:
            return Response(
                {"error": "Prompt cannot exceed 2000 characters."},
                status=status.HTTP_400_BAD_REQUEST
            )

        venue = get_object_or_404(Venue, id=venue_id)

        try:
            image_bytes = generate_decor_preview(venue, prompt)

            filename = f"{uuid.uuid4().hex}.png"

            preview = DecorPreview.objects.create(
                user=request.user,
                venue=venue,
                prompt=prompt,
                image=ContentFile(image_bytes, name=filename)
            )

            preview_url = request.build_absolute_uri(
                preview.image.url
            )

            return Response(
                {
                    "message": "Venue decoration preview generated successfully.",
                    "preview_id": preview.id,
                    "venue_id": venue.id,
                    "prompt": preview.prompt,
                    "preview_url": preview_url,
                    "created_at": preview.created_at
                },
                status=status.HTTP_201_CREATED
            )

        except Exception:
            return Response(
                {
                    "error": "Unable to generate the decoration preview. Please try again."
                },
                status=status.HTTP_502_BAD_GATEWAY
            )

