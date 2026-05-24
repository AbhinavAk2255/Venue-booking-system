from django.shortcuts import render
from rest_framework.views import APIView
from .serializers import BookingSerializer
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .permissions import Iscustomer
from rest_framework.generics import ListAPIView
from .models import Booking
from venues.permissions import IsOwner
# Create your views here.

class CreateBookingView(APIView):
    permission_classes = [
        IsAuthenticated,
        Iscustomer
    ]

    def post(self, request):

        try:
            data = request.data
            serializer = BookingSerializer(data = data)

            if serializer.is_valid():
                serializer.save(
                    customer = request.user
                )
                return Response({
                    'data': serializer.data,
                    'message': 'Vemue Booked successfully.'
                }, status=status.HTTP_200_OK)
            
            return Response({
                'errors': serializer.errors

            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                    'error': str(e),
                    'message':'someting went wrong',

                }, status= status.HTTP_400_BAD_REQUEST)
        

class ListBookingView(ListAPIView):
    permission_classes = [
        IsAuthenticated,
        Iscustomer
    ]
    serializer_class = BookingSerializer

    def get_queryset(self):
        return Booking.objects.filter(
            customer = self.request.user
        ).order_by('-created_at')
    
class BookingOwnerView(ListAPIView):
    
    serializer_class = BookingSerializer

    permission_classes = [
        IsAuthenticated,
        IsOwner
    ]

    def get_queryset(self):
        return Booking.objects.filter(
            venue__owner = self.request.user
        ).order_by('-created_at')
    
    

