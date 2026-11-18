
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response

from django.contrib.auth import authenticate

from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from .serializers import RegisterSerializer
from .models import CustomUser

from .models import HostApplication
from .serializers import HostApplicationSerializer
from .permissions import IsCustomer

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
