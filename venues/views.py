from django.shortcuts import render
from rest_framework.views import APIView
from .serializers import VenueSerializer
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.generics import ListAPIView,UpdateAPIView
from .models import Venue
from .permissions import *


class VenueCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):

        serializer = VenueSerializer(
            data=request.data
        )

        if serializer.is_valid():

            serializer.save(
                owner=request.user
            )

            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )
    
class ListVenueView(ListAPIView):
    queryset = Venue.objects.all().order_by('-created_at')
    serializer_class = VenueSerializer
    permission_classes = []


class VenueDashboardView(ListAPIView):
    serializer_class = VenueSerializer
    permission_classes = [
        IsOwner,
        IsAuthenticated
    ]
    
    def get_queryset(self):
        return Venue.objects.filter(
            owner = self.request.user
        ).order_by('-created_at')

class VenueUpdateView(APIView):
    permission_classes = [
        IsAuthenticated,
        IsOwner
    ]

    def put(self, request, pk):
        
        try:
            data = request.data
            venues = Venue.objects.get(
                id = pk,
                owner = request.user
            )
            serializer = VenueSerializer(
                venues,
                data,
                partial = True
            )
            if serializer.is_valid():
                serializer.save()

                return Response({
                    'data' : serializer.data,
                    'message' : 'venue Update successfuly...',
                }, status=status.HTTP_201_CREATED)
            
            return Response({
                'errors' : serializer.errors
            }, status=status.HTTP_404_NOT_FOUND)
        
        except Exception as e:
            return Response({
                'error': str(e),
                'message':'someting went wrong',
                }, status= status.HTTP_400_BAD_REQUEST)
        
class VenueDeleteView(APIView):
    permission_classes = [
        IsAuthenticated,
        IsOwner
    ]

    def delete(self, request, pk):
        print(request.user)
        print(pk)

        try:
            venue = Venue.objects.get(
                id = pk,
                owner = request.user
            )
            venue.delete()
            return Response({
                'data' : {},
                'message' : 'Venue Deleted successfuly',
            }, status=status.HTTP_204_NO_CONTENT)
        
        except Exception as e:
            return Response({
                'error' : str(e),
                'message' : 'something went wrong..',
            }, status=status.HTTP_400_BAD_REQUEST)
        
