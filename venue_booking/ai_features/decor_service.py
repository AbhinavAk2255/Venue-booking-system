
import base64
from io import BytesIO

import requests
from PIL import Image, ImageOps
from django.conf import settings


def prepare_venue_image(image_file):
    """Prepare the original venue photograph for Cloudflare."""

    image = Image.open(image_file)
    image = ImageOps.exif_transpose(image).convert("RGB")
    image.thumbnail((480, 480))

    buffer = BytesIO()
    image.save(buffer, format="JPEG", quality=85)
    buffer.seek(0)

    return buffer.getvalue()


def generate_decor_preview(venue, prompt):
    """Generate a decorated version of an existing venue photograph."""

    if not venue.image:
        raise ValueError("This venue does not have an image.")

    if not settings.CLOUDFLARE_ACCOUNT_ID:
        raise ValueError("Cloudflare Account ID is not configured.")

    if not settings.CLOUDFLARE_API_TOKEN:
        raise ValueError("Cloudflare API token is not configured.")

    api_url = (
        "https://api.cloudflare.com/client/v4/accounts/"
        f"{settings.CLOUDFLARE_ACCOUNT_ID}/ai/run/"
        f"{settings.CLOUDFLARE_IMAGE_MODEL}"
    )

    headers = {
        "Authorization": f"Bearer {settings.CLOUDFLARE_API_TOKEN}"
    }

    with venue.image.open("rb") as image_file:
        image_bytes = prepare_venue_image(image_file)

    files = {
        "input_image_0": (
            "venue.jpg",
            image_bytes,
            "image/jpeg",
        ),
        "prompt": (None, prompt),
        "width": (None, "768"),
        "height": (None, "768"),
    }

    response = requests.post(
        api_url,
        headers=headers,
        files=files,
        timeout=180,
    )

    if not response.ok:
        raise RuntimeError(
            f"Cloudflare API error ({response.status_code}): "
            f"{response.text[:1000]}"
        )

    result = response.json()

    image_base64 = result.get("result", {}).get("image")

    if not image_base64:
        raise RuntimeError("Cloudflare did not return a generated image.")

    return base64.b64decode(image_base64)
