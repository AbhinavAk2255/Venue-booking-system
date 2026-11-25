
from django.urls import path
from .views import VenueAssistantView,VenueDecorPreviewView

urlpatterns = [
    path("assistant/", VenueAssistantView.as_view(), name="ai_assistant"),
    path("decorate/", VenueDecorPreviewView.as_view(), name="venue_decor_preview"),
]
