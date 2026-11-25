from django.db import models
from django.conf import settings


class DecorPreview(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="decor_previews"
    )

    venue = models.ForeignKey(
        "venues.Venue",
        on_delete=models.CASCADE,
        related_name="decor_previews"
    )

    prompt = models.TextField(max_length=2000)

    image = models.ImageField(
        upload_to="decor_previews/"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user} - {self.venue} - {self.created_at}"
