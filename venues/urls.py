from django.urls import path
from .views import *

urlpatterns = [
    path('create/',VenueCreateView.as_view()),
    path('list/',ListVenueView.as_view()),
    path('venue_dasboard/', VenueDashboardView.as_view()),
    path('update_venue/<int:pk>', VenueUpdateView.as_view()),
    path('delete_venue/<int:pk>/', VenueDeleteView.as_view()),

]