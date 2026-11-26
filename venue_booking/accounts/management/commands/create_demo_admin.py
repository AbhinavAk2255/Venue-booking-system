
import os

from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model


class Command(BaseCommand):
    help = "Create the Venuva presentation admin if it does not exist."

    def handle(self, *args, **options):
        User = get_user_model()

        username = os.getenv("VENUVA_ADMIN_USERNAME")
        password = os.getenv("VENUVA_ADMIN_PASSWORD")
        email = os.getenv("VENUVA_ADMIN_EMAIL", "")

        if not username or not password:
            raise CommandError(
                "VENUVA_ADMIN_USERNAME and VENUVA_ADMIN_PASSWORD "
                "must be configured."
            )

        user = User.objects.filter(username=username).first()

        if user:
            if not user.is_superuser:
                raise CommandError(
                    "The configured username already exists "
                    "but is not a superuser."
                )

            self.stdout.write(
                self.style.SUCCESS("Presentation admin already exists.")
            )
            return

        user = User.objects.create_superuser(
            username=username,
            email=email or None,
            password=password,
            role="owner",
        )

        self.stdout.write(
            self.style.SUCCESS(
                f"Presentation admin '{user.username}' created successfully."
            )
        )
