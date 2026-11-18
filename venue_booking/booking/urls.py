from django.urls import path
from .views import *

urlpatterns = [
    path('booking_venue/', CreateBookingView.as_view()),
    path('booking_list/', ListBookingView.as_view()),
    path('owner_booking_list/', BookingOwnerView.as_view()),
    path('booing_update/<int:pk>/', BookingUpdateView.as_view()),
    path('update_status/<int:pk>/', UpdateBookingStatusView.as_view()),
    path('cancel_booking/<int:pk>/', CancelBookingView.as_view()),
    path('create_payment_order/',CreatePaymentOrderView.as_view()),
    path('verify_payment/',VerifyPaymentView.as_view()),
    path('razorpay-webhook/',RazorpayWebhookView.as_view()),
    path('payment_receipt/<int:booking_id>/',PaymentReceiptView.as_view(),name='payment_receipt'),

    path('notifications/', NotificationListView.as_view(), name='notifications'),
    path('notifications/<int:pk>/read/', MarkNotificationReadView.as_view(), name='mark_notification_read'),

    path("reviews/create/", CreateReviewView.as_view(), name="create_review"),
    path("venues/<int:venue_id>/reviews/",VenueReviewListView.as_view(),name="venue_reviews"),
]