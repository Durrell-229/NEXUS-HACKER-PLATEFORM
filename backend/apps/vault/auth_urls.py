from django.urls import path
from rest_framework_simplejwt.views import (
    TokenRefreshView,
    TokenVerifyView,
    TokenBlacklistView,
)
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from .views import RegisterView


class NexusTokenSerializer(TokenObtainPairSerializer):
    """JWT with extra claims: username, is_staff, is_superuser."""
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['is_staff'] = user.is_staff
        token['is_superuser'] = user.is_superuser
        token['rank'] = user.rank
        token['level'] = user.level
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['username'] = self.user.username
        data['is_staff'] = self.user.is_staff
        data['is_superuser'] = self.user.is_superuser
        data['rank'] = self.user.rank
        data['level'] = self.user.level
        return data


class NexusTokenView(TokenObtainPairView):
    serializer_class = NexusTokenSerializer


urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth-register'),
    path('token/', NexusTokenView.as_view(), name='token-obtain-pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='token-verify'),
    path('token/blacklist/', TokenBlacklistView.as_view(), name='token-blacklist'),
]
