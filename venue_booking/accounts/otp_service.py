import hashlib
import secrets
from datetime import timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone

from .models import OTPVerification


OTP_EXPIRY_MINUTES = 5
MAX_OTP_ATTEMPTS = 5


def generate_otp():
    """Generate a secure six-digit OTP."""
    return str(secrets.randbelow(900000) + 100000)


def hash_otp(otp):
    """Hash OTP before storing it."""
    return hashlib.sha256(
        f"{settings.SECRET_KEY}:{otp}".encode()
    ).hexdigest()


def create_otp(user, destination, purpose):
    """Create and store a new OTP."""

    otp = generate_otp()

    OTPVerification.objects.filter(
        destination=destination,
        purpose=purpose,
        is_used=False,
    ).update(is_used=True)

    verification = OTPVerification.objects.create(
        user=user,
        destination=destination,
        purpose=purpose,
        otp_hash=hash_otp(otp),
        expires_at=timezone.now() + timedelta(
            minutes=OTP_EXPIRY_MINUTES
        ),
    )

    return verification, otp


def verify_otp(verification, entered_otp):
    """Verify OTP with expiry and attempt protection."""

    if verification.is_used:
        return False

    if verification.is_expired():
        return False

    if verification.attempts >= MAX_OTP_ATTEMPTS:
        return False

    verification.attempts += 1

    if secrets.compare_digest(
        verification.otp_hash,
        hash_otp(entered_otp),
    ):
        verification.is_used = True
        verification.save(
            update_fields=["attempts", "is_used"]
        )
        return True

    verification.save(update_fields=["attempts"])
    return False


def send_email_otp(email, otp):
    """Send OTP through email."""

    send_mail(
        subject="Venuva - Your verification code",
        message=(
            f"Your Venuva verification code is {otp}.\n\n"
            "This code expires in 5 minutes.\n"
            "Do not share this code with anyone."
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        fail_silently=False,
    )