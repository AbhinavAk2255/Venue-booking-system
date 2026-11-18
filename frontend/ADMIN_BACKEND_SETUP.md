# Venuva — Admin Dashboard Backend Setup

Create a new Django app called `admin_api` in your project:

```bash
python manage.py startapp admin_api
```

Then add it to `INSTALLED_APPS` in `venue_booking/settings.py`:

```python
INSTALLED_APPS = [
    ...
    'admin_api',
]
```

---

## 1. Create `admin_api/permissions.py`

```python
from rest_framework.permissions import BasePermission

class IsSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_superuser
```

---

## 2. Create `admin_api/serializers.py`

```python
from rest_framework import serializers
from accounts.models import CustomUser
from venues.models import Venue
from booking.models import Booking


class AdminUserSerializer(serializers.ModelSerializer):
    total_bookings = serializers.SerializerMethodField()
    total_venues = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 'role',
            'is_active', 'is_staff', 'is_superuser',
            'date_joined', 'total_bookings', 'total_venues'
        ]
        read_only_fields = ['id', 'date_joined']

    def get_total_bookings(self, obj):
        return Booking.objects.filter(customer=obj).count()

    def get_total_venues(self, obj):
        return Venue.objects.filter(owner=obj).count()


class AdminUserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'password', 'role', 'is_active']

    def create(self, validated_data):
        return CustomUser.objects.create_user(**validated_data)


class AdminVenueSerializer(serializers.ModelSerializer):
    owner_name = serializers.CharField(source='owner.username', read_only=True)
    total_bookings = serializers.SerializerMethodField()
    pending_bookings = serializers.SerializerMethodField()

    class Meta:
        model = Venue
        fields = '__all__'
        read_only_fields = ['capacity_category', 'created_at']

    def get_total_bookings(self, obj):
        return Booking.objects.filter(venue=obj).count()

    def get_pending_bookings(self, obj):
        return Booking.objects.filter(venue=obj, status='pending').count()


class AdminBookingSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.username', read_only=True)
    customer_email = serializers.CharField(source='customer.email', read_only=True)
    venue_name = serializers.CharField(source='venue.venue_name', read_only=True)
    venue_location = serializers.CharField(source='venue.location', read_only=True)

    class Meta:
        model = Booking
        fields = '__all__'
        read_only_fields = ['customer', 'total_amount', 'created_at']
```

---

## 3. Create `admin_api/views.py`

```python
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView, RetrieveUpdateDestroyAPIView, CreateAPIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import timedelta

from accounts.models import CustomUser
from venues.models import Venue
from booking.models import Booking

from .permissions import IsSuperAdmin
from .serializers import (
    AdminUserSerializer,
    AdminUserCreateSerializer,
    AdminVenueSerializer,
    AdminBookingSerializer,
)


# ─── Dashboard Stats ────────────────────────────────────────────────
class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        today = timezone.now().date()
        last_30_days = today - timedelta(days=30)

        total_users = CustomUser.objects.count()
        total_owners = CustomUser.objects.filter(role='owner').count()
        total_customers = CustomUser.objects.filter(role='customer').count()
        total_venues = Venue.objects.count()
        total_bookings = Booking.objects.count()
        pending_bookings = Booking.objects.filter(status='pending').count()
        approved_bookings = Booking.objects.filter(status='approved').count()
        rejected_bookings = Booking.objects.filter(status='rejected').count()

        revenue = Booking.objects.filter(
            status='approved'
        ).aggregate(total=Sum('total_amount'))['total'] or 0

        recent_bookings = Booking.objects.filter(
            created_at__date__gte=last_30_days
        ).count()

        new_users = CustomUser.objects.filter(
            date_joined__date__gte=last_30_days
        ).count()

        # Recent activity — last 10 bookings
        latest = Booking.objects.select_related('customer', 'venue').order_by('-created_at')[:10]
        recent_activity = AdminBookingSerializer(latest, many=True).data

        return Response({
            'total_users': total_users,
            'total_owners': total_owners,
            'total_customers': total_customers,
            'total_venues': total_venues,
            'total_bookings': total_bookings,
            'pending_bookings': pending_bookings,
            'approved_bookings': approved_bookings,
            'rejected_bookings': rejected_bookings,
            'total_revenue': float(revenue),
            'recent_bookings_30d': recent_bookings,
            'new_users_30d': new_users,
            'recent_activity': recent_activity,
        })


# ─── User Management ────────────────────────────────────────────────
class AdminUserListView(ListAPIView):
    serializer_class = AdminUserSerializer
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get_queryset(self):
        qs = CustomUser.objects.all().order_by('-date_joined')
        role = self.request.query_params.get('role')
        search = self.request.query_params.get('search')
        if role:
            qs = qs.filter(role=role)
        if search:
            qs = qs.filter(
                Q(username__icontains=search) | Q(email__icontains=search)
            )
        return qs


class AdminUserCreateView(CreateAPIView):
    serializer_class = AdminUserCreateSerializer
    permission_classes = [IsAuthenticated, IsSuperAdmin]


class AdminUserDetailView(RetrieveUpdateDestroyAPIView):
    serializer_class = AdminUserSerializer
    permission_classes = [IsAuthenticated, IsSuperAdmin]
    queryset = CustomUser.objects.all()


class AdminUserToggleView(APIView):
    """Activate / deactivate a user account."""
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def patch(self, request, pk):
        try:
            user = CustomUser.objects.get(pk=pk)
            user.is_active = not user.is_active
            user.save()
            return Response({
                'id': user.id,
                'is_active': user.is_active,
                'message': f'User {"activated" if user.is_active else "deactivated"}'
            })
        except CustomUser.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)


# ─── Venue Management ───────────────────────────────────────────────
class AdminVenueListView(ListAPIView):
    serializer_class = AdminVenueSerializer
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get_queryset(self):
        qs = Venue.objects.select_related('owner').order_by('-created_at')
        search = self.request.query_params.get('search')
        venue_type = self.request.query_params.get('venue_type')
        if search:
            qs = qs.filter(
                Q(venue_name__icontains=search) | Q(location__icontains=search)
            )
        if venue_type:
            qs = qs.filter(venue_type=venue_type)
        return qs


class AdminVenueDetailView(RetrieveUpdateDestroyAPIView):
    serializer_class = AdminVenueSerializer
    permission_classes = [IsAuthenticated, IsSuperAdmin]
    queryset = Venue.objects.all()


# ─── Booking Management ─────────────────────────────────────────────
class AdminBookingListView(ListAPIView):
    serializer_class = AdminBookingSerializer
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get_queryset(self):
        qs = Booking.objects.select_related('customer', 'venue').order_by('-created_at')
        status_filter = self.request.query_params.get('status')
        search = self.request.query_params.get('search')
        if status_filter:
            qs = qs.filter(status=status_filter)
        if search:
            qs = qs.filter(
                Q(customer__username__icontains=search) |
                Q(venue__venue_name__icontains=search)
            )
        return qs


class AdminBookingStatusView(APIView):
    """Approve or reject a booking."""
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def patch(self, request, pk):
        try:
            booking = Booking.objects.get(pk=pk)
            new_status = request.data.get('status')
            if new_status not in ['approved', 'rejected', 'pending']:
                return Response(
                    {'error': 'Invalid status. Use: pending, approved, rejected'},
                    status=400
                )
            booking.status = new_status
            booking.save(update_fields=['status'])
            return Response({
                'id': booking.id,
                'status': booking.status,
                'message': f'Booking {new_status}'
            })
        except Booking.DoesNotExist:
            return Response({'error': 'Booking not found'}, status=404)


class AdminBookingDeleteView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def delete(self, request, pk):
        try:
            booking = Booking.objects.get(pk=pk)
            booking.delete()
            return Response({'message': 'Booking deleted'}, status=204)
        except Booking.DoesNotExist:
            return Response({'error': 'Booking not found'}, status=404)
```

---

## 4. Create `admin_api/urls.py`

```python
from django.urls import path
from .views import (
    DashboardStatsView,
    AdminUserListView,
    AdminUserCreateView,
    AdminUserDetailView,
    AdminUserToggleView,
    AdminVenueListView,
    AdminVenueDetailView,
    AdminBookingListView,
    AdminBookingStatusView,
    AdminBookingDeleteView,
)

urlpatterns = [
    # Dashboard
    path('stats/', DashboardStatsView.as_view()),

    # Users
    path('users/', AdminUserListView.as_view()),
    path('users/create/', AdminUserCreateView.as_view()),
    path('users/<int:pk>/', AdminUserDetailView.as_view()),
    path('users/<int:pk>/toggle/', AdminUserToggleView.as_view()),

    # Venues
    path('venues/', AdminVenueListView.as_view()),
    path('venues/<int:pk>/', AdminVenueDetailView.as_view()),

    # Bookings
    path('bookings/', AdminBookingListView.as_view()),
    path('bookings/<int:pk>/status/', AdminBookingStatusView.as_view()),
    path('bookings/<int:pk>/delete/', AdminBookingDeleteView.as_view()),
]
```

---

## 5. Register in `venue_booking/urls.py`

```python
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/accounts/', include('accounts.urls')),
    path('api/venues/', include('venues.urls')),
    path('api/booking/', include('booking.urls')),
    path('api/admin/', include('admin_api.urls')),     # ← ADD THIS
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

---

## 6. Don't forget: Create `admin_api/__init__.py`

```bash
touch admin_api/__init__.py
```

That's it for the backend!
