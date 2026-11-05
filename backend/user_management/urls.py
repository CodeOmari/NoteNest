from django.urls import path, include
from .views import UserCreateView, current_user, password_reset_request, password_reset_confirm
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView


urlpatterns = [
    path('user/register/', UserCreateView.as_view(), name='register'),
    path('token/', TokenObtainPairView.as_view(), name='get_token'),
    path('token/refresh/', TokenRefreshView.as_view(), name='refresh'),

    path('password-reset/', password_reset_request, name='password_reset'),
    path('password-reset/confirm/', password_reset_confirm, name='password_reset_confirm'),

    path('user/', current_user),
    
    path('api-auth/', include('rest_framework.urls')),
]