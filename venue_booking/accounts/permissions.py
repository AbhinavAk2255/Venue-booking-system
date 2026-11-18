
from rest_framework.permissions import BasePermission


class IsCustomer(BasePermission):
    message = "Only customer accounts can apply to become hosts."

    def has_permission(self, request, view):
        user = request.user

        return (
            user
            and user.is_authenticated
            and not user.is_superuser
            and user.role == "customer"
        )
