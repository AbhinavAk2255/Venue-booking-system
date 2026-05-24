from django.db import models
from accounts.models import *
# Create your models here.

class Venue(models.Model):

    VENUE_TYPE_CHOICES = (

        ('wedding_hall', 'Wedding Hall'),
        ('banquet_hall', 'Banquet Hall'),
        ('auditorium', 'Auditorium'),
        ('conference_hall', 'Conference Hall'),
        ('meeting_room', 'Meeting Room'),
        ('party_hall', 'Party Hall'),
        ('convention_center', 'Convention Center'),
        ('rooftop_venue', 'Rooftop Venue'),
        ('beach_venue', 'Beach Venue'),
        ('open_ground', 'Open Ground'),
    )

    CAPACITY_CATEGORY_CHOICES = (

        ('intimate', 'Intimate'),
        ('classic', 'Classic'),
        ('grand', 'Grand'),
        ('elite', 'Elite'),
    )   
    owner = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    venue_name = models.CharField(max_length=200)
    venue_type = models.CharField(max_length=50, choices=VENUE_TYPE_CHOICES)
    location = models.CharField(max_length=255)
    capacity = models.IntegerField()
    capacity_category = models.CharField(max_length=20,choices=CAPACITY_CATEGORY_CHOICES,blank=True)
    price_per_hour = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField()
    image = models.ImageField(upload_to='venues/')
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.capacity <= 200:

            self.capacity_category = 'intimate'

        elif self.capacity <= 500:

            self.capacity_category = 'classic'

        elif self.capacity <= 1000:

            self.capacity_category = 'grand'

        else:

            self.capacity_category = 'elite'

        super().save(*args, **kwargs)


    def __str__(self):
        return self.venue_type

