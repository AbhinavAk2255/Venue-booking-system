from django.db import models
from accounts.models import CustomUser
from venues.models import Venue
from datetime import datetime

# Create your models here.

class Booking(models.Model):
    STATUS_CHOICES = (

        ('pending', 'Pending'),

        ('approved', 'Approved'),

        ('rejected', 'Rejected'),
    )
    customer = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    venue = models.ForeignKey(Venue, on_delete=models.CASCADE)
    booking_date = models.DateField()
    starting_time = models.TimeField()
    ending_time = models.TimeField()
    total_amount = models.DecimalField(
        max_digits= 10,
        decimal_places= 2,
        blank=True,
        null= True
    )
    status = models.CharField(choices=STATUS_CHOICES, max_length=20, default='pending')
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

        duration = (
            end_datetime - start_datetime
        ).total_seconds() / 3600

        self.total_amount = (
            duration * float(self.venue.price_per_hour)
        )

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.customer.username} - {self.venue.venue_name}"