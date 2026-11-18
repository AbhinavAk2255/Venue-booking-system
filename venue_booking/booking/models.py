
from django.db import models
from accounts.models import CustomUser
from venues.models import Venue
from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP


class Booking(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
    )

    customer = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    venue = models.ForeignKey(Venue, on_delete=models.CASCADE)
    booking_date = models.DateField()
    starting_time = models.TimeField()
    ending_time = models.TimeField()

    total_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True
    )

    status = models.CharField(
        choices=STATUS_CHOICES,
        max_length=20,
        default='pending'
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        start_datetime = datetime.combine(
            self.booking_date,
            self.starting_time
        )

        end_datetime = datetime.combine(
            self.booking_date,
            self.ending_time
        )

        duration_minutes = (
            end_datetime - start_datetime
        ).total_seconds() / 60

        duration_hours = (
            Decimal(str(duration_minutes)) / Decimal("60")
        )

        self.total_amount = (
            duration_hours * self.venue.price_per_hour
        ).quantize(
            Decimal("0.01"),
            rounding=ROUND_HALF_UP
        )

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.customer.username} - {self.venue.venue_name}"




class Payment(models.Model):

    STATUS_CHOICES = (
        ('created', 'Created'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
    )

    booking = models.ForeignKey(
        Booking,
        on_delete=models.CASCADE,
        related_name='payments'
    )

    razorpay_order_id = models.CharField(
        max_length=100,
        unique=True
    )

    razorpay_payment_id = models.CharField(
        max_length=100,
        unique=True,
        null=True,
        blank=True
    )

    razorpay_signature = models.CharField(
        max_length=255,
        blank=True,
        null=True
    )

    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    currency = models.CharField(
        max_length=10,
        default='INR'
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='created'
    )

    created_at = models.DateTimeField(auto_now_add=True)

    paid_at = models.DateTimeField(
        null=True,
        blank=True
    )

    def __str__(self):
        return f"Payment for {self.booking} - {self.status}"


class Notification(models.Model):

    NOTIFICATION_TYPES = (
        ('booking_submitted', 'Booking Submitted'),
        ('booking_approved', 'Booking Approved'),
        ('booking_rejected', 'Booking Rejected'),
        ('booking_cancelled', 'Booking Cancelled'),
        ('payment_success', 'Payment Successful'),
    )

    user = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='notifications'
    )

    booking = models.ForeignKey(
        Booking,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='notifications'
    )

    notification_type = models.CharField(
        max_length=30,
        choices=NOTIFICATION_TYPES
    )

    title = models.CharField(max_length=150)

    message = models.TextField()

    is_read = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'booking', 'notification_type'],
                name='unique_user_booking_notification'
            )
        ]

    def __str__(self):
        return f"{self.user.username} - {self.title}"



class Review(models.Model):

    booking = models.OneToOneField(
        Booking,
        on_delete=models.CASCADE,
        related_name='review'
    )

    customer = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='reviews'
    )

    venue = models.ForeignKey(
        Venue,
        on_delete=models.CASCADE,
        related_name='reviews'
    )

    rating = models.PositiveSmallIntegerField()

    comment = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.customer.username} - {self.venue.venue_name} ({self.rating}/5)"