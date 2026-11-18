
from django.urls import path
from .views import VenueAssistantView

urlpatterns = [
    path("assistant/", VenueAssistantView.as_view(), name="ai_assistant"),
]
