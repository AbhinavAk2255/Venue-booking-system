from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

# Import the admin_api views directly to avoid circular include issues
from admin_api import views as admin_views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/accounts/', include('accounts.urls')),
    path('api/venues/', include('venues.urls')),
    path('api/booking/', include('booking.urls')),
    
    # Put the custom React admin APIs directly here
    path('api/admin/stats/', admin_views.DashboardStatsView.as_view()),

    path('api/admin/users/', admin_views.AdminUserListView.as_view()),
    path('api/admin/users/create/', admin_views.AdminUserCreateView.as_view()),
    path('api/admin/users/<int:pk>/', admin_views.AdminUserDetailView.as_view()),
    path('api/admin/users/<int:pk>/toggle/', admin_views.AdminUserToggleView.as_view()),

    path('api/admin/venues/', admin_views.AdminVenueListView.as_view()),
    path('api/admin/venues/<int:pk>/', admin_views.AdminVenueDetailView.as_view()),

    path('api/admin/bookings/', admin_views.AdminBookingListView.as_view()),
    path('api/admin/bookings/<int:pk>/status/', admin_views.AdminBookingStatusView.as_view()),
    path('api/admin/bookings/<int:pk>/delete/', admin_views.AdminBookingDeleteView.as_view()),

] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)