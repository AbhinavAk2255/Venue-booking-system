from django.urls import path
from .views import *

urlpatterns = [
    path('booking_venue/', CreateBookingView.as_view()),
    path('booking_list/', ListBookingView.as_view()),
    path('owner_booking_list/', BookingOwnerView.as_view()),
]