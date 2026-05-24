from django.shortcuts import render
from rest_framework import generics,status
from .serializers import RegisterSerializer
from .models import CustomUser
from rest_framework.permissions import AllowAny
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import logout


# Create your views here.

class RegisterView(generics.CreateAPIView):

    queryset = CustomUser.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class LoginView(APIView):

    permission_classes = []

    def post(self, request):

        username = request.data.get('username')
        password = request.data.get('password')

        user = authenticate(
            username=username,
            password=password
        )

        if user is not None:

            refresh = RefreshToken.for_user(user)

            return Response({
                'status': True,
                'message': 'Login Successful',
                'access_token': str(refresh.access_token),
                'refresh_token': str(refresh),
                'user': {

                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'role': user.role
                }
            })

        return Response({

            'status': False,
            'message': 'Invalid Username or Password'

        }, status=status.HTTP_401_UNAUTHORIZED)
    
class LogoutAPIView(APIView):

    def post(self, request):

        logout(request)

        return Response(
            {'message': 'Logged out successfully'},
            status=status.HTTP_200_OK
        )