from django.urls import path
from .views import RegisterView,LoginView,LogoutAPIView,HostApplicationCreateView, MyHostApplicationsView,ForgotPasswordRequestView,ResetPasswordWithOTPView, RequestLoginOTPView,VerifyLoginOTPView

from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.views import TokenBlacklistView

urlpatterns = [
    path('register/', RegisterView.as_view()),
    path('login/', LoginView.as_view()),
    path('logout/', LogoutAPIView.as_view()),
    path("forgot-password/",ForgotPasswordRequestView.as_view(),name="forgot-password"),
    path("reset-password/",ResetPasswordWithOTPView.as_view(),name="reset-password"),
    path("request-login-otp/",RequestLoginOTPView.as_view(),name="request-login-otp"),
    path("verify-login-otp/",VerifyLoginOTPView.as_view(),name="verify-login-otp"),

    path("token/refresh/", TokenRefreshView.as_view()),

    path("host/apply/",HostApplicationCreateView.as_view(),name="host-application-create"),
    path("host/my-applications/",MyHostApplicationsView.as_view(),name="my-host-applications"),
]

