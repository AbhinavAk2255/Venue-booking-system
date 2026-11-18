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

from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from accounts.models import HostApplication


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




# Admin: view all host applications
class AdminHostApplicationListView(APIView):

    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        application_status = request.query_params.get("status")

        applications = HostApplication.objects.select_related(
            "user", "reviewed_by"
        ).all()

        if application_status:
            allowed_statuses = ["pending", "approved", "rejected"]

            if application_status not in allowed_statuses:
                return Response(
                    {"message": "Invalid application status"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            applications = applications.filter(
                status=application_status
            )

        data = []

        for application in applications:
            data.append({
                "id": application.id,
                "user_id": application.user.id,
                "username": application.user.username,
                "email": application.user.email,
                "business_name": application.business_name,
                "contact_number": application.contact_number,
                "location": application.location,
                "reason": application.reason,
                "status": application.status,
                "admin_note": application.admin_note,
                "created_at": application.created_at,
                "reviewed_at": application.reviewed_at,
                "reviewed_by": (
                    application.reviewed_by.username
                    if application.reviewed_by else None
                ),
            })

        return Response(data, status=status.HTTP_200_OK)


# Admin: approve or reject a host application
class AdminHostApplicationReviewView(APIView):

    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def patch(self, request, pk):

        new_status = request.data.get("status")
        admin_note = request.data.get("admin_note", "")

        if new_status not in ["approved", "rejected"]:
            return Response(
                {
                    "message": "Status must be approved or rejected"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not isinstance(admin_note, str):
            return Response(
                {"message": "Admin note must be text"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():

            application = get_object_or_404(
                HostApplication.objects.select_for_update().select_related("user"),
                pk=pk,
            )

            if application.status != "pending":
                return Response(
                    {
                        "message": "This application has already been reviewed"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            user = application.user

            if new_status == "approved":

                # Only a normal customer can become a host.
                if user.role != "customer" or user.is_superuser:
                    return Response(
                        {
                            "message": "This user cannot be approved as a host"
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                user.role = "owner"
                user.save(update_fields=["role"])

            application.status = new_status
            application.admin_note = admin_note.strip()
            application.reviewed_by = request.user
            application.reviewed_at = timezone.now()

            application.save(
                update_fields=[
                    "status",
                    "admin_note",
                    "reviewed_by",
                    "reviewed_at",
                ]
            )

        return Response(
            {
                "message": (
                    "Host application approved successfully"
                    if new_status == "approved"
                    else "Host application rejected successfully"
                ),
                "application_id": application.id,
                "status": application.status,
                "user_id": user.id,
                "user_role": user.role,
            },
            status=status.HTTP_200_OK,
        )
