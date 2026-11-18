from django.urls import path
from .views import RegisterView,LoginView,LogoutAPIView,HostApplicationCreateView, MyHostApplicationsView

from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.views import TokenBlacklistView

urlpatterns = [
    path('register/', RegisterView.as_view()),
    path('login/', LoginView.as_view()),
    path('logout/', LogoutAPIView.as_view()),

    path("token/refresh/", TokenRefreshView.as_view()),

    path("host/apply/",HostApplicationCreateView.as_view(),name="host-application-create"),
    path("host/my-applications/",MyHostApplicationsView.as_view(),name="my-host-applications"),
]

