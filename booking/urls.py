from django.urls import path
from .views import *

urlpatterns = [
    path('booking_venue/', CreateBookingView.as_view()),
    path('booking_list/', ListBookingView.as_view()),
    path('owner_booking_list/', BookingOwnerView.as_view()),
    path('booing_update/<int:pk>/', BookingUpdateView.as_view()),
    path('update_status/<int:pk>/', UpdateBookingStatusView.as_view()),
]