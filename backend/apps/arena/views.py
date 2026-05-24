from django.db import transaction
from django.utils import timezone
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema

from apps.vault.models import UserStats
from .models import Challenge, Submission, Tournament, TournamentParticipant
from .serializers import (
    ChallengeSerializer,
    ChallengeListSerializer,
    FlagSubmitSerializer,
    SubmissionSerializer,
    TournamentSerializer,
    TournamentListSerializer,
    TournamentParticipantSerializer,
)


class ChallengeViewSet(viewsets.ModelViewSet):
    """
    CRUD for CTF challenges.
    Custom action: POST {id}/submit/ — submit a flag.
    """
    queryset = Challenge.objects.select_related('author').filter(is_active=True)
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'difficulty', 'is_active']
    search_fields = ['title', 'description']
    ordering_fields = ['points', 'solves_count', 'created_at', 'difficulty']

    def get_serializer_class(self):
        if self.action == 'list':
            return ChallengeListSerializer
        if self.action == 'submit':
            return FlagSubmitSerializer
        return ChallengeSerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [permissions.IsAuthenticatedOrReadOnly()]
        if self.action == 'submit':
            return [permissions.IsAuthenticated()]
        return [permissions.IsAdminUser()]

    @extend_schema(
        request=FlagSubmitSerializer,
        responses={200: {'type': 'object', 'properties': {'correct': {'type': 'boolean'}, 'message': {'type': 'string'}}}},
    )
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def submit(self, request, pk=None):
        """POST /api/v1/arena/challenges/{id}/submit/ — Submit a flag attempt."""
        challenge = self.get_object()
        serializer = FlagSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        submitted_flag = serializer.validated_data['flag'].strip()
        is_correct = submitted_flag == challenge.flag

        # Prevent duplicate correct submissions
        already_solved = Submission.objects.filter(
            user=request.user, challenge=challenge, is_correct=True
        ).exists()

        if already_solved:
            return Response(
                {'correct': True, 'message': 'You already solved this challenge!'},
                status=status.HTTP_200_OK,
            )

        # Get client IP
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        ip = x_forwarded_for.split(',')[0] if x_forwarded_for else request.META.get('REMOTE_ADDR')

        with transaction.atomic():
            Submission.objects.create(
                user=request.user,
                challenge=challenge,
                flag_submitted=submitted_flag,
                is_correct=is_correct,
                ip_address=ip,
            )

            if is_correct:
                # Increment challenge solve counter atomically
                Challenge.objects.filter(pk=challenge.pk).update(
                    solves_count=models_update_inc('solves_count')
                )
                # Add XP to user
                request.user.add_xp(challenge.points)
                # Update stats
                UserStats.objects.filter(user=request.user).update(
                    challenges_solved=models_update_inc('challenges_solved'),
                    total_submissions=models_update_inc('total_submissions'),
                )
            else:
                # Still count the attempt
                UserStats.objects.filter(user=request.user).update(
                    total_submissions=models_update_inc('total_submissions'),
                )

        msg = 'Correct flag! XP awarded.' if is_correct else 'Wrong flag. Keep trying!'
        return Response(
            {'correct': is_correct, 'message': msg},
            status=status.HTTP_200_OK,
        )


def models_update_inc(field_name):
    """Helper for F() expression import-free usage."""
    from django.db.models import F
    return F(field_name) + 1


class SubmissionViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only listing of submissions (admin or own)."""
    serializer_class = SubmissionSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['challenge', 'is_correct']
    ordering_fields = ['submitted_at']

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Submission.objects.select_related('user', 'challenge').all()
        return Submission.objects.select_related('user', 'challenge').filter(user=user)


class TournamentViewSet(viewsets.ModelViewSet):
    """CRUD for tournaments + join/leave actions."""
    queryset = Tournament.objects.prefetch_related('challenges', 'participants__user').all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['name', 'description']
    ordering_fields = ['start_time', 'end_time', 'created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return TournamentListSerializer
        return TournamentSerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [permissions.AllowAny()]
        if self.action in ('join', 'leave', 'scoreboard'):
            return [permissions.IsAuthenticated()]
        return [permissions.IsAdminUser()]

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def join(self, request, pk=None):
        """POST /api/v1/arena/tournaments/{id}/join/"""
        tournament = self.get_object()

        if tournament.status == Tournament.Status.ENDED:
            return Response({'detail': 'Tournament has ended.'}, status=400)

        if tournament.max_participants > 0:
            if tournament.participants.count() >= tournament.max_participants:
                return Response({'detail': 'Tournament is full.'}, status=400)

        participant, created = TournamentParticipant.objects.get_or_create(
            tournament=tournament,
            user=request.user,
        )
        if not created:
            return Response({'detail': 'Already registered.'}, status=400)

        serializer = TournamentParticipantSerializer(participant)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['delete'], permission_classes=[permissions.IsAuthenticated])
    def leave(self, request, pk=None):
        """DELETE /api/v1/arena/tournaments/{id}/leave/"""
        tournament = self.get_object()
        deleted, _ = TournamentParticipant.objects.filter(
            tournament=tournament, user=request.user
        ).delete()
        if not deleted:
            return Response({'detail': 'You are not a participant.'}, status=400)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['get'])
    def scoreboard(self, request, pk=None):
        """GET /api/v1/arena/tournaments/{id}/scoreboard/"""
        tournament = self.get_object()
        participants = tournament.participants.select_related('user').order_by('-score', 'joined_at')
        serializer = TournamentParticipantSerializer(participants, many=True)
        return Response(serializer.data)
