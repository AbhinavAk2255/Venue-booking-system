from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings
from django.db.models import Q

from django.utils import timezone
from datetime import timedelta

# Create your models here.

class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ('owner', 'Owner'),
        ('customer', 'Customer'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    email = models.EmailField(unique=True,blank=True,null=True)
    phone_number = models.CharField(max_length=20,unique=True,null=True,blank=True)


class HostApplication(models.Model):

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
    ]


    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="host_applications",
    )

    business_name = models.CharField(max_length=150)

    contact_number = models.CharField(max_length=20)

    location = models.CharField(max_length=255)

    reason = models.TextField(
        help_text="Explain why you want to become a venue host."
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending",
    )

    admin_note = models.TextField(blank=True)

    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_host_applications",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

        constraints = [
            models.UniqueConstraint(
                fields=["user"],
                condition=Q(status="pending"),
                name="one_pending_host_app_user",
            )
        ]

    def __str__(self):
        return f"{self.business_name} - {self.user.username} ({self.status})"


class OTPVerification(models.Model):

    PURPOSE_CHOICES = [
        ("login", "Login"),
        ("password_reset", "Password Reset"),
        ("email_change", "Email Change"),
        ("phone_change", "Phone Change"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="otp_verifications",
        null=True,
        blank=True,
    )

    destination = models.CharField(max_length=255)

    otp_hash = models.CharField(max_length=128)

    purpose = models.CharField(
        max_length=20,
        choices=PURPOSE_CHOICES,
    )

    expires_at = models.DateTimeField()

    is_used = models.BooleanField(default=False)

    attempts = models.PositiveSmallIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)

    def is_expired(self):
        return timezone.now() >= self.expires_at

    def __str__(self):
        return f"{self.destination} - {self.purpose}"



