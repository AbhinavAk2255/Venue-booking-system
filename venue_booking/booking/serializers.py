from rest_framework import serializers
from django.utils import timezone
from .models import Booking,Review


class BookingSerializer(serializers.ModelSerializer):
    payment_status = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = "__all__"

        read_only_fields = [
            "customer",
            "status",
            "total_amount",
            "created_at",
            "payment_status",
        ]

    def get_payment_status(self, obj):
        if obj.payments.filter(status="paid").exists():
            return "paid"

        return "unpaid"


    def validate(self, attrs):

        venue = attrs.get(
            "venue",
            self.instance.venue if self.instance else None
        )

        booking_date = attrs.get(
            "booking_date",
            self.instance.booking_date if self.instance else None
        )

        starting_time = attrs.get(
            "starting_time",
            self.instance.starting_time if self.instance else None
        )

        ending_time = attrs.get(
            "ending_time",
            self.instance.ending_time if self.instance else None
        )

        # Validate required booking information.
        if not all([
            venue,
            booking_date,
            starting_time,
            ending_time
        ]):
            raise serializers.ValidationError(
                "Complete booking details are required."
            )

        # Prevent past bookings.
        if booking_date < timezone.localdate():
            raise serializers.ValidationError({
                "booking_date": "You cannot book a past date."
            })

        # Prevent invalid time ranges.
        if starting_time >= ending_time:
            raise serializers.ValidationError({
                "ending_time": "Ending time must be after starting time."
            })

        # Check overlapping bookings.
        overlapping = Booking.objects.filter(
            venue=venue,
            booking_date=booking_date,
            status__in=["pending", "approved"],
            starting_time__lt=ending_time,
            ending_time__gt=starting_time,
        )

        # Exclude the current booking when editing.
        if self.instance:
            overlapping = overlapping.exclude(
                pk=self.instance.pk
            )

        if overlapping.exists():
            raise serializers.ValidationError(
                "This venue is already booked or has a pending request "
                "during the selected time."
            )

        return attrs


class ReviewSerializer(serializers.ModelSerializer):

    customer_name = serializers.CharField(
        source="customer.username",
        read_only=True
    )

    class Meta:
        model = Review

        fields = [
            "id",
            "booking",
            "customer",
            "customer_name",
            "venue",
            "rating",
            "comment",
            "created_at",
        ]

        read_only_fields = [
            "customer",
            "venue",
            "created_at",
        ]

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError(
                "Rating must be between 1 and 5."
            )

        return value