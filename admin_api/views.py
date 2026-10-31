from rest_framework.views import APIView
from rest_framework.generics import ListAPIView, RetrieveUpdateDestroyAPIView, CreateAPIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
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

class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        today = timezone.now().date()
        last_30_days = today - timedelta(days=30)

        # Safely calculate revenue
        approved_bookings = Booking.objects.filter(status='approved')
        revenue = sum([b.total_amount for b in approved_bookings if b.total_amount])

        latest = Booking.objects.select_related('customer', 'venue').order_by('-created_at')[:10]

        return Response({
            'total_users': CustomUser.objects.count(),
            'total_owners': CustomUser.objects.filter(role='owner').count(),
            'total_customers': CustomUser.objects.filter(role='customer').count(),
            'total_venues': Venue.objects.count(),
            'total_bookings': Booking.objects.count(),
            'pending_bookings': Booking.objects.filter(status='pending').count(),
            'approved_bookings': approved_bookings.count(),
            'rejected_bookings': Booking.objects.filter(status='rejected').count(),
            'total_revenue': float(revenue),
            'recent_bookings_30d': Booking.objects.filter(created_at__date__gte=last_30_days).count(),
            'new_users_30d': CustomUser.objects.filter(date_joined__date__gte=last_30_days).count(),
            'recent_activity': AdminBookingSerializer(latest, many=True).data,
        })

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
            qs = qs.filter(Q(username__icontains=search) | Q(email__icontains=search))
        return qs

class AdminUserCreateView(CreateAPIView):
    serializer_class = AdminUserCreateSerializer
    permission_classes = [IsAuthenticated, IsSuperAdmin]

class AdminUserDetailView(RetrieveUpdateDestroyAPIView):
    serializer_class = AdminUserSerializer
    permission_classes = [IsAuthenticated, IsSuperAdmin]
    queryset = CustomUser.objects.all()

class AdminUserToggleView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def patch(self, request, pk):
        try:
            user = CustomUser.objects.get(pk=pk)
            user.is_active = not user.is_active
            user.save()
            return Response({'id': user.id, 'is_active': user.is_active})
        except CustomUser.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)

class AdminVenueListView(ListAPIView):
    serializer_class = AdminVenueSerializer
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get_queryset(self):
        qs = Venue.objects.select_related('owner').order_by('-created_at')
        search = self.request.query_params.get('search')
        venue_type = self.request.query_params.get('venue_type')
        if search:
            qs = qs.filter(Q(venue_name__icontains=search) | Q(location__icontains=search))
        if venue_type:
            qs = qs.filter(venue_type=venue_type)
        return qs

class AdminVenueDetailView(RetrieveUpdateDestroyAPIView):
    serializer_class = AdminVenueSerializer
    permission_classes = [IsAuthenticated, IsSuperAdmin]
    queryset = Venue.objects.all()

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
            qs = qs.filter(Q(customer__username__icontains=search) | Q(venue__venue_name__icontains=search))
        return qs

class AdminBookingStatusView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def patch(self, request, pk):
        try:
            booking = Booking.objects.get(pk=pk)
            new_status = request.data.get('status')
            if new_status not in ['approved', 'rejected', 'pending']:
                return Response({'error': 'Invalid status'}, status=400)
            booking.status = new_status
            booking.save(update_fields=['status'])
            return Response({'id': booking.id, 'status': booking.status})
        except Booking.DoesNotExist:
            return Response({'error': 'Booking not found'}, status=404)

class AdminBookingDeleteView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def delete(self, request, pk):
        try:
            Booking.objects.get(pk=pk).delete()
            return Response({'message': 'Deleted'}, status=204)
        except Booking.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)