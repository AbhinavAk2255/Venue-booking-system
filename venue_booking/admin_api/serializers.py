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
        user = CustomUser(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            role=validated_data.get('role', 'customer'),
            is_active=validated_data.get('is_active', True)
        )
        user.set_password(validated_data['password'])
        user.save()
        return user

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