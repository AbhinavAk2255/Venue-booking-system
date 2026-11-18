
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from .models import CustomUser
from .models import HostApplication


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password]
    )

    class Meta:
        model = CustomUser
        fields = [
            "id",
            "username",
            "email",
            "password",
        ]

    def create(self, validated_data):
        user = CustomUser.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
            role="customer",
        )

        return user



class HostApplicationSerializer(serializers.ModelSerializer):

    class Meta:
        model = HostApplication
        fields = [
            "id",
            "business_name",
            "contact_number",
            "location",
            "reason",
            "status",
            "admin_note",
            "created_at",
            "reviewed_at",
        ]

        read_only_fields = [
            "id",
            "status",
            "admin_note",
            "created_at",
            "reviewed_at",
        ]

    def validate(self, attrs):
        user = self.context["request"].user

        # Prevent multiple pending applications.
        if HostApplication.objects.filter(
            user=user,
            status="pending",
        ).exists():
            raise serializers.ValidationError(
                "You already have a pending host application."
            )

        return attrs

    def create(self, validated_data):
        # The user is taken from the authenticated request,
        # never from the frontend.
        return HostApplication.objects.create(
            user=self.context["request"].user,
            **validated_data,
        )
