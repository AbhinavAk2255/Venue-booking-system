from django.shortcuts import render
from rest_framework.views import APIView
from .serializers import BookingSerializer,ReviewSerializer
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from .permissions import Iscustomer
from rest_framework.generics import ListAPIView
from .models import Booking,Payment, Notification,Review
from venues.permissions import IsOwner
from django.conf import settings
from django.utils import timezone
from rest_framework.exceptions import APIException
import razorpay
from decimal import Decimal

from django.db import transaction
from django.utils import timezone

import json
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator


def create_notification(user, booking, notification_type, title, message):
    Notification.objects.get_or_create(
        user=user,
        booking=booking,
        notification_type=notification_type,
        defaults={
            'title': title,
            'message': message,
        }
    )

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
                booking = serializer.save(customer=request.user)

                # Notify the customer
                create_notification(
                    user=request.user,
                    booking=booking,
                    notification_type='booking_submitted',
                    title='Booking Request Submitted',
                    message=f'Your booking request for {booking.venue.venue_name} has been submitted successfully.'
                )

                # Notify the venue owner
                create_notification(
                    user=booking.venue.owner,
                    booking=booking,
                    notification_type='booking_submitted',
                    title='New Booking Request',
                    message=f'{request.user.username} has requested to book your venue: {booking.venue.venue_name}.'
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


class BookingUpdateView(APIView):

    permission_classes = [
        IsAuthenticated,
        Iscustomer
    ]

    def put(self, request, pk):

        try:
            booking = Booking.objects.get(
                id = pk,
                customer = request.user
            )

            if booking.status != 'pending':
                return Response({
                    'message': 'Approved or rejected bookings cannot be edited.'
                }, status=status.HTTP_400_BAD_REQUEST)

            serializer = BookingSerializer(
                booking,
                data = request.data,
                partial=True
            )

            if serializer.is_valid():
                serializer.save()

                return Response({
                    'data' : serializer.data,
                    'message': 'Booking updated successfully.'
                }, status=status.HTTP_200_OK)

        except Booking.DoesNotExist:
            return Response({
                'message': 'Booking not found.'
            }, status=status.HTTP_404_NOT_FOUND)

        except Exception as e:
            return Response({

                'error': str(e),
                'message': 'Something went wrong.'

            }, status=status.HTTP_400_BAD_REQUEST)




class UpdateBookingStatusView(APIView):
    permission_classes = [IsAuthenticated, IsOwner]

    def patch(self, request, pk):
        try:
            booking = Booking.objects.get(
                pk=pk,
                venue__owner=request.user
            )

            if booking.status != 'pending':
                return Response({
                    'error': 'Only pending bookings can be updated.'
                }, status=status.HTTP_400_BAD_REQUEST)

            new_status = request.data.get('status')

            if new_status not in ['approved', 'rejected']:
                return Response({
                    'error': 'Status must be approved or rejected.'
                }, status=status.HTTP_400_BAD_REQUEST)

            booking.status = new_status
            booking.save(update_fields=['status'])
            create_notification(
            user=booking.customer,
            booking=booking,
            notification_type=f'booking_{new_status}',
            title=f'Booking {new_status.capitalize()}',
            message=f'Your booking request for {booking.venue.venue_name} has been {new_status}.')

            return Response({
                'id': booking.id,
                'status': booking.status,
                'message': f'Booking {new_status} successfully.'
            }, status=status.HTTP_200_OK)

        except Booking.DoesNotExist:
            return Response({
                'error': 'Booking not found.'
            }, status=status.HTTP_404_NOT_FOUND)


class CancelBookingView(APIView):
    permission_classes = [IsAuthenticated, Iscustomer]

    def patch(self, request, pk):
        try:
            booking = Booking.objects.get(
                pk=pk,
                customer=request.user
            )

            if booking.status != 'pending':
                return Response({
                    'error': 'Only pending bookings can be cancelled.'
                }, status=status.HTTP_400_BAD_REQUEST)

            booking.status = 'cancelled'
            booking.save(update_fields=['status'])

            create_notification(
            user=booking.venue.owner,
            booking=booking,
            notification_type='booking_cancelled',
            title='Booking Cancelled',
            message=f'{booking.customer.username} has cancelled their booking for {booking.venue.venue_name}.')

            return Response({
                'id': booking.id,
                'status': booking.status,
                'message': 'Booking cancelled successfully.'
            }, status=status.HTTP_200_OK)

        except Booking.DoesNotExist:
            return Response({
                'error': 'Booking not found.'
            }, status=status.HTTP_404_NOT_FOUND)




class CreatePaymentOrderView(APIView):

    permission_classes = [IsAuthenticated, Iscustomer]

    def post(self, request):

        booking_id = request.data.get('booking_id')

        if not booking_id:
            return Response({
                'error': 'Booking ID is required.'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            booking = Booking.objects.get(
                id=booking_id,
                customer=request.user
            )

            if booking.status != 'approved':
                return Response({
                    'error': 'Your booking must be approved before payment.'
                }, status=status.HTTP_400_BAD_REQUEST)

            if Payment.objects.filter(
                booking=booking,
                status='paid'
            ).exists():
                return Response({
                    'error': 'This booking has already been paid.'
                }, status=status.HTTP_400_BAD_REQUEST)

            if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
                return Response({
                    'error': 'Payment gateway is not configured.'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            client = razorpay.Client(
                auth=(
                    settings.RAZORPAY_KEY_ID,
                    settings.RAZORPAY_KEY_SECRET
                )
            )

            # Convert rupees into paise.
            amount_in_paise = int(
                (booking.total_amount * Decimal('100')).quantize(
                    Decimal('1')
                )
            )

            if amount_in_paise <= 0:
                return Response({
                    'error': 'Invalid booking amount.'
                }, status=status.HTTP_400_BAD_REQUEST)

            order_data = {
                'amount': amount_in_paise,
                'currency': 'INR',
                'receipt': f'booking_{booking.id}',
            }

            razorpay_order = client.order.create(
                data=order_data
            )

            payment = Payment.objects.create(
                booking=booking,
                razorpay_order_id=razorpay_order['id'],
                amount=booking.total_amount,
                currency='INR',
                status='created'
            )

            return Response({
                'message': 'Payment order created successfully.',
                'payment_id': payment.id,
                'razorpay_order_id': razorpay_order['id'],
                'razorpay_key_id': settings.RAZORPAY_KEY_ID,
                'amount': amount_in_paise,
                'currency': 'INR',
                'booking_id': booking.id,
            }, status=status.HTTP_201_CREATED)

        except Booking.DoesNotExist:
            return Response({
                'error': 'Booking not found.'
            }, status=status.HTTP_404_NOT_FOUND)

        except Exception as e:
            print("RAZORPAY ERROR:", repr(e))
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



class VerifyPaymentView(APIView):

    permission_classes = [IsAuthenticated, Iscustomer]

    def post(self, request):

        razorpay_order_id = request.data.get('razorpay_order_id')
        razorpay_payment_id = request.data.get('razorpay_payment_id')
        razorpay_signature = request.data.get('razorpay_signature')

        if not all([
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        ]):
            return Response({
                'error': 'Payment verification details are required.'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            payment = Payment.objects.select_related(
                'booking'
            ).get(
                razorpay_order_id=razorpay_order_id,
                booking__customer=request.user
            )

            if payment.status == 'paid':
                if payment.razorpay_payment_id == razorpay_payment_id:
                    return Response({
                        'message': 'Payment already verified.',
                        'status': 'paid'
                    })

                return Response({
                    'error': 'This order has already been paid.'
                }, status=status.HTTP_400_BAD_REQUEST)

            if payment.booking.status != 'approved':
                return Response({
                    'error': 'Booking is not approved.'
                }, status=status.HTTP_400_BAD_REQUEST)

            client = razorpay.Client(
                auth=(
                    settings.RAZORPAY_KEY_ID,
                    settings.RAZORPAY_KEY_SECRET
                )
            )

            # Verify Razorpay's payment signature.
            client.utility.verify_payment_signature({
                'razorpay_order_id': razorpay_order_id,
                'razorpay_payment_id': razorpay_payment_id,
                'razorpay_signature': razorpay_signature
            })

            # Retrieve payment details directly from Razorpay.
            razorpay_payment = client.payment.fetch(
                razorpay_payment_id
            )

            if razorpay_payment.get('order_id') != razorpay_order_id:
                return Response({
                    'error': 'Payment order mismatch.'
                }, status=status.HTTP_400_BAD_REQUEST)

            if razorpay_payment.get('status') != 'captured':
                return Response({
                    'error': 'Payment has not been captured yet.'
                }, status=status.HTTP_400_BAD_REQUEST)

            if int(razorpay_payment.get('amount', 0)) != int(
                payment.amount * 100
            ):
                return Response({
                    'error': 'Payment amount mismatch.'
                }, status=status.HTTP_400_BAD_REQUEST)

            if razorpay_payment.get('currency') != payment.currency:
                return Response({
                    'error': 'Payment currency mismatch.'
                }, status=status.HTTP_400_BAD_REQUEST)

            with transaction.atomic():
                payment = Payment.objects.select_for_update().get(
                    pk=payment.pk
                )

                if payment.status == 'paid':
                    return Response({
                        'message': 'Payment already verified.',
                        'status': 'paid'
                    })

                payment.razorpay_payment_id = razorpay_payment_id
                payment.razorpay_signature = razorpay_signature
                payment.status = 'paid'
                payment.paid_at = timezone.now()

                payment.save(update_fields=[
                    'razorpay_payment_id',
                    'razorpay_signature',
                    'status',
                    'paid_at'
                ])

                create_notification(
                    user=payment.booking.customer,
                    booking=payment.booking,
                    notification_type='payment_success',
                    title='Payment Successful',
                    message=f'Your payment of ₹{payment.amount} for {payment.booking.venue.venue_name} was successful.'
                )

            return Response({
                'message': 'Payment verified successfully.',
                'payment_id': payment.id,
                'booking_id': payment.booking.id,
                'status': 'paid'
            }, status=status.HTTP_200_OK)

        except Payment.DoesNotExist:
            return Response({
                'error': 'Payment order not found.'
            }, status=status.HTTP_404_NOT_FOUND)

        except razorpay.errors.SignatureVerificationError:
            return Response({
                'error': 'Invalid payment signature.'
            }, status=status.HTTP_400_BAD_REQUEST)

        except Exception:
            return Response({
                'error': 'Payment verification failed.'
            }, status=status.HTTP_400_BAD_REQUEST)




@method_decorator(csrf_exempt, name='dispatch')
class RazorpayWebhookView(APIView):

    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):

        webhook_secret = settings.RAZORPAY_WEBHOOK_SECRET

        if not webhook_secret:
            return Response(
                {'error': 'Webhook is not configured.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        signature = request.headers.get('X-Razorpay-Signature')

        if not signature:
            return Response(
                {'error': 'Missing webhook signature.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        client = razorpay.Client(
            auth=(
                settings.RAZORPAY_KEY_ID,
                settings.RAZORPAY_KEY_SECRET
            )
        )

        try:
            # Verify the webhook using the original request body.
            client.utility.verify_webhook_signature(
                request.body.decode('utf-8'),
                signature,
                webhook_secret
            )

            event_data = json.loads(request.body)

            event = event_data.get('event')

            # We process successful captured payments only.
            if event != 'payment.captured':
                return Response({
                    'message': 'Event received but not processed.'
                }, status=status.HTTP_200_OK)

            payment_entity = (
                event_data.get('payload', {})
                .get('payment', {})
                .get('entity', {})
            )

            razorpay_order_id = payment_entity.get('order_id')
            razorpay_payment_id = payment_entity.get('id')

            if not razorpay_order_id or not razorpay_payment_id:
                return Response({
                    'error': 'Invalid payment information.'
                }, status=status.HTTP_400_BAD_REQUEST)

            with transaction.atomic():

                payment = Payment.objects.select_for_update().get(
                    razorpay_order_id=razorpay_order_id
                )

                # Ignore duplicate webhook deliveries.
                if payment.status == 'paid':
                    return Response({
                        'message': 'Payment already processed.'
                    }, status=status.HTTP_200_OK)

                if payment_entity.get('status') != 'captured':
                    return Response({
                        'message': 'Payment is not captured.'
                    }, status=status.HTTP_200_OK)

                expected_amount = int(
                    payment.amount * Decimal('100')
                )

                if int(payment_entity.get('amount', 0)) != expected_amount:
                    return Response({
                        'error': 'Payment amount mismatch.'
                    }, status=status.HTTP_400_BAD_REQUEST)

                if payment_entity.get('currency') != payment.currency:
                    return Response({
                        'error': 'Payment currency mismatch.'
                    }, status=status.HTTP_400_BAD_REQUEST)

                if payment.razorpay_payment_id and (
                    payment.razorpay_payment_id != razorpay_payment_id
                ):
                    return Response({
                        'error': 'Payment ID mismatch.'
                    }, status=status.HTTP_400_BAD_REQUEST)

                payment.razorpay_payment_id = razorpay_payment_id
                payment.status = 'paid'
                payment.paid_at = timezone.now()

                payment.save(update_fields=[
                    'razorpay_payment_id',
                    'status',
                    'paid_at'
                ])

                create_notification(
                    user=payment.booking.customer,
                    booking=payment.booking,
                    notification_type='payment_success',
                    title='Payment Successful',
                    message=f'Your payment of ₹{payment.amount} for {payment.booking.venue.venue_name} was successful.'
                )

            return Response({
                'message': 'Webhook processed successfully.'
            }, status=status.HTTP_200_OK)

        except razorpay.errors.SignatureVerificationError:
            return Response({
                'error': 'Invalid webhook signature.'
            }, status=status.HTTP_400_BAD_REQUEST)

        except Payment.DoesNotExist:
            return Response({
                'error': 'Payment order not found.'
            }, status=status.HTTP_404_NOT_FOUND)

        except Exception:
            return Response({
                'error': 'Webhook processing failed.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PaymentReceiptView(APIView):
    permission_classes = [IsAuthenticated, Iscustomer]

    def get(self, request, booking_id):
        payment = Payment.objects.filter(
            booking_id=booking_id,
            booking__customer=request.user,
            status='paid'
        ).order_by('-paid_at').first()

        if not payment:
            return Response({
                'error': 'No successful payment found for this booking.'
            }, status=status.HTTP_404_NOT_FOUND)

        return Response({
            'receipt_number': f'VEN-PAY-{payment.id}',
            'payment_id': payment.id,
            'booking_id': payment.booking.id,
            'razorpay_payment_id': payment.razorpay_payment_id,
            'razorpay_order_id': payment.razorpay_order_id,
            'amount': str(payment.amount),
            'currency': payment.currency,
            'payment_status': payment.status,
            'paid_at': payment.paid_at,
        }, status=status.HTTP_200_OK)


class NotificationListView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        notifications = Notification.objects.filter(
            user=request.user
        ).order_by('-created_at')

        data = []

        for notification in notifications:
            data.append({
                'id': notification.id,
                'booking_id': notification.booking_id,
                'notification_type': notification.notification_type,
                'title': notification.title,
                'message': notification.message,
                'is_read': notification.is_read,
                'created_at': notification.created_at,
            })

        return Response({
            'notifications': data,
            'unread_count': notifications.filter(is_read=False).count()
        }, status=status.HTTP_200_OK)


class MarkNotificationReadView(APIView):

    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):

        try:
            notification = Notification.objects.get(
                pk=pk,
                user=request.user
            )

            notification.is_read = True
            notification.save(update_fields=['is_read'])

            return Response({
                'message': 'Notification marked as read.',
                'id': notification.id,
                'is_read': notification.is_read
            }, status=status.HTTP_200_OK)

        except Notification.DoesNotExist:

            return Response({
                'error': 'Notification not found.'
            }, status=status.HTTP_404_NOT_FOUND)


class CreateReviewView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        booking_id = request.data.get("booking")

        try:
            booking = Booking.objects.get(
                id=booking_id,
                customer=request.user
            )

        except Booking.DoesNotExist:
            return Response(
                {"error": "Booking not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Booking must be approved
        if booking.status != "approved":
            return Response(
                {"error": "Only approved bookings can be reviewed."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Booking date must have passed
        # if booking.booking_date >= timezone.localdate():
        #     return Response(
        #         {"error": "You can review after the booking date."},
        #         status=status.HTTP_400_BAD_REQUEST
        #     )

        # TESTING: Temporarily allow reviews before the booking date.
# Only approved bookings belonging to the logged-in customer are allowed.

        # Prevent duplicate review
        if Review.objects.filter(booking=booking).exists():
            return Response(
                {"error": "You have already reviewed this booking."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = ReviewSerializer(data=request.data)

        if serializer.is_valid():

            serializer.save(
                customer=request.user,
                venue=booking.venue,
                booking=booking
            )

            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class VenueReviewListView(ListAPIView):

    serializer_class = ReviewSerializer
    permission_classes = []

    def get_queryset(self):

        venue_id = self.kwargs.get("venue_id")

        return Review.objects.filter(
            venue_id=venue_id
        ).order_by("-created_at")