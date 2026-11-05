from django.shortcuts import render
from django.contrib.auth.models import User
from .serializers import UserSerializer, PasswordResetRequestSerializer, PasswordResetConfirmSerializer
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from django.conf import settings

# Create your views here.
class UserCreateView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    return Response({
        "email": request.user.email,
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_request(request):
    serializer = PasswordResetRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    email = serializer.validated_data['email']

    users = User.objects.filter(email__iexact=email)

    for user in users:
        uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)

        reset_link = (
            f"{settings.FRONTEND_URL}/reset-password"
            f"?uidb64={uidb64}&token={token}"
        )

        send_mail(
            subject="NoteNest Password Reset",
            message=(
                f"Hello {user.username},\n\n"
                f"We received a request to reset your NoteNest password.\n\n"
                f"Click the link below to reset your password:\n"
                f"{reset_link}\n\n"
                f"If you did not request this, you can ignore this email."
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )

    return Response(
        {
            "message": (
                "If an account with that email exists, "
                "a password reset link has been sent."
            )
        },
        status=status.HTTP_200_OK
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_confirm(request):
    serializer = PasswordResetConfirmSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    user = serializer.validated_data['user']
    new_password = serializer.validated_data['password1']

    user.set_password(new_password)
    user.save()

    return Response(
        {"message": "Your password has been reset successfully."},
        status=status.HTTP_200_OK
    )