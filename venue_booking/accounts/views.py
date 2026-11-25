
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response

from django.contrib.auth import authenticate

from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from .serializers import RegisterSerializer
from .models import CustomUser

from .models import HostApplication,OTPVerification
from .serializers import HostApplicationSerializer
from .permissions import IsCustomer
from .otp_service import create_otp, send_email_otp

from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db import transaction
from .otp_service import verify_otp

# Registration
class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


# Login
class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        if not username or not password:
            return Response(
                {
                    "status": False,
                    "message": "Username and password are required",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = authenticate(
            request,
            username=username,
            password=password,
        )

        if user is None or not user.is_active:
            return Response(
                {
                    "status": False,
                    "message": "Invalid Username or Password",
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "status": True,
                "message": "Login Successful",
                "access_token": str(refresh.access_token),
                "refresh_token": str(refresh),
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "role": user.role,
                    "is_superuser": user.is_superuser,
                    "is_staff": user.is_staff,
                },
            },
            status=status.HTTP_200_OK,
        )


# Logout
class LogoutAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")

        if not refresh_token:
            return Response(
                {"message": "Refresh token is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            token = RefreshToken(refresh_token)

            # Ensure the refresh token belongs to the logged-in user.
            if str(token["user_id"]) != str(request.user.id):
                return Response(
                    {"message": "Invalid refresh token"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            token.blacklist()

            return Response(
                {"message": "Logged out successfully"},
                status=status.HTTP_200_OK,
            )

        except TokenError:
            return Response(
                {"message": "Invalid or expired refresh token"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class ForgotPasswordRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email", "").strip().lower()

        if not email:
            return Response(
                {"message": "Email address is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = CustomUser.objects.filter(
            email__iexact=email,
            is_active=True,
        ).first()

        # Use the same response whether the account exists or not.
        if user:
            verification, otp = create_otp(
                user=user,
                destination=email,
                purpose="password_reset",
            )

            try:
                send_email_otp(email, otp)
            except Exception:
                verification.delete()

                return Response(
                    {"message": "Unable to send OTP. Please try again."},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )

        return Response(
            {
                "message": (
                    "If an account exists with this email, "
                    "a verification code has been sent."
                )
            },
            status=status.HTTP_200_OK,
        )


class ResetPasswordWithOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):

        email = request.data.get("email", "").strip().lower()
        otp = str(request.data.get("otp", "")).strip()
        new_password = request.data.get("new_password", "")

        if not email or not otp or not new_password:
            return Response(
                {"message": "Email, OTP and new password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = CustomUser.objects.filter(
            email__iexact=email,
            is_active=True,
        ).first()

        if not user:
            return Response(
                {"message": "Invalid or expired OTP."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            validate_password(new_password, user)
        except ValidationError as error:
            return Response(
                {"message": list(error.messages)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():

            verification = OTPVerification.objects.select_for_update().filter(
                user=user,
                destination__iexact=email,
                purpose="password_reset",
                is_used=False,
            ).order_by("-created_at").first()

            if not verification or not verify_otp(verification, otp):
                return Response(
                    {"message": "Invalid or expired OTP."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            user.set_password(new_password)
            user.save(update_fields=["password"])

        return Response(
            {
                "status": True,
                "message": "Password reset successfully. Please log in."
            },
            status=status.HTTP_200_OK,
        )



class RequestLoginOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email", "").strip().lower()

        if not email:
            return Response(
                {"message": "Email address is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = CustomUser.objects.filter(
            email__iexact=email,
            is_active=True,
        ).first()

        # Do not reveal whether an account exists.
        if user:
            verification, otp = create_otp(
                user=user,
                destination=email,
                purpose="login",
            )

            try:
                send_email_otp(email, otp)
            except Exception:
                verification.delete()

                return Response(
                    {"message": "Unable to send OTP. Please try again."},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )

        return Response(
            {
                "message": (
                    "If an account exists with this email, "
                    "a login verification code has been sent."
                )
            },
            status=status.HTTP_200_OK,
        )



class VerifyLoginOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email", "").strip().lower()
        otp = str(request.data.get("otp", "")).strip()

        if not email or not otp:
            return Response(
                {"message": "Email and OTP are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = CustomUser.objects.filter(
            email__iexact=email,
            is_active=True,
        ).first()

        if not user:
            return Response(
                {"message": "Invalid or expired OTP."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            verification = OTPVerification.objects.select_for_update().filter(
                user=user,
                destination__iexact=email,
                purpose="login",
                is_used=False,
            ).order_by("-created_at").first()

            if not verification or not verify_otp(verification, otp):
                return Response(
                    {"message": "Invalid or expired OTP."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            refresh = RefreshToken.for_user(user)

        return Response(
            {
                "status": True,
                "message": "Login successful.",
                "access_token": str(refresh.access_token),
                "refresh_token": str(refresh),
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "role": user.role,
                    "is_superuser": user.is_superuser,
                    "is_staff": user.is_staff,
                },
            },
            status=status.HTTP_200_OK,
        )



# Customer: submit a host application
class HostApplicationCreateView(generics.CreateAPIView):

    serializer_class = HostApplicationSerializer

    permission_classes = [
        IsAuthenticated,
        IsCustomer,
    ]


# Customer: view their own host applications
class MyHostApplicationsView(generics.ListAPIView):

    serializer_class = HostApplicationSerializer

    permission_classes = [
        IsAuthenticated,
        IsCustomer,
    ]

    def get_queryset(self):
        return HostApplication.objects.filter(
            user=self.request.user
        )
