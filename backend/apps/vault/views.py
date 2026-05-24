from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import viewsets, generics, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiParameter

from .models import Trophy, UserStats
from .serializers import (
    UserPublicSerializer,
    UserPrivateSerializer,
    UserUpdateSerializer,
    RegisterSerializer,
    ChangePasswordSerializer,
    LeaderboardSerializer,
    TrophySerializer,
    UserStatsSerializer,
)

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """POST /api/v1/auth/register/ — Create a new account."""
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {'detail': 'Account created. Welcome to NEXUS.', 'username': user.username},
            status=status.HTTP_201_CREATED,
        )


class UserViewSet(viewsets.ModelViewSet):
    """
    CRUD for user profiles.
    - list/retrieve: public info
    - update/partial_update: own profile only
    """
    queryset = User.objects.select_related('stats').prefetch_related('trophies').all()
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_serializer_class(self):
        if self.action in ('update', 'partial_update'):
            return UserUpdateSerializer
        if self.request.user.is_authenticated and self.get_object_pk() == self.request.user.pk:
            return UserPrivateSerializer
        return UserPublicSerializer

    def get_object_pk(self):
        try:
            return int(self.kwargs.get('pk', 0))
        except (TypeError, ValueError):
            return 0

    def get_permissions(self):
        if self.action in ('update', 'partial_update', 'destroy'):
            return [permissions.IsAuthenticated()]
        return super().get_permissions()

    def update(self, request, *args, **kwargs):
        if request.user.pk != self.get_object().pk:
            return Response({'detail': 'You can only edit your own profile.'}, status=403)
        return super().update(request, *args, **kwargs)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        """GET /api/v1/vault/users/me/ — Own full profile."""
        serializer = UserPrivateSerializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['patch'], permission_classes=[permissions.IsAuthenticated])
    def update_me(self, request):
        """PATCH /api/v1/vault/users/update_me/ — Update own profile."""
        serializer = UserUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def change_password(self, request):
        """POST /api/v1/vault/users/change_password/"""
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response({'old_password': 'Incorrect password.'}, status=400)
        user.set_password(serializer.validated_data['new_password'])
        user.save(update_fields=['password'])
        return Response({'detail': 'Password updated successfully.'})

    @action(detail=True, methods=['get'])
    def trophies(self, request, pk=None):
        """GET /api/v1/vault/users/{id}/trophies/"""
        user = self.get_object()
        trophies = user.trophies.all()
        serializer = TrophySerializer(trophies, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        """GET /api/v1/vault/users/{id}/stats/"""
        user = self.get_object()
        stats, _ = UserStats.objects.get_or_create(user=user)
        serializer = UserStatsSerializer(stats)
        return Response(serializer.data)


@extend_schema(
    parameters=[
        OpenApiParameter('limit', int, description='Number of users to return (max 100)'),
    ]
)
class LeaderboardView(generics.ListAPIView):
    """GET /api/v1/vault/leaderboard/ — Global XP leaderboard."""
    serializer_class = LeaderboardSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        limit = min(int(self.request.query_params.get('limit', 50)), 100)
        return (
            User.objects
            .select_related('stats')
            .filter(is_active=True)
            .order_by('-xp_points')[:limit]
        )
