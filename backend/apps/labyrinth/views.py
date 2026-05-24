import random
from django.utils import timezone
from datetime import timedelta
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from .models import Lab, LabSession
from .serializers import LabSerializer, LabListSerializer, LabSessionSerializer


class LabViewSet(viewsets.ModelViewSet):
    """
    CRUD for lab environments.
    Custom action: POST {id}/start/ — spin up a session.
    """
    queryset = Lab.objects.filter(is_active=True)
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['difficulty', 'technology', 'is_active']
    search_fields = ['title', 'description', 'technology']
    ordering_fields = ['difficulty', 'created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return LabListSerializer
        return LabSerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [permissions.IsAuthenticatedOrReadOnly()]
        if self.action == 'start':
            return [permissions.IsAuthenticated()]
        return [permissions.IsAdminUser()]

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def start(self, request, pk=None):
        """
        POST /api/v1/labyrinth/labs/{id}/start/
        Allocates a new lab session for the requesting user.
        In a real deployment, this would trigger a Celery task that
        calls the Docker/K8s API to spin up the container.
        """
        lab = self.get_object()

        # Check if user already has an active session for this lab
        active_session = LabSession.objects.filter(
            user=request.user,
            lab=lab,
            status__in=[LabSession.SessionStatus.STARTING, LabSession.SessionStatus.RUNNING],
        ).first()

        if active_session:
            if active_session.is_expired():
                active_session.status = LabSession.SessionStatus.EXPIRED
                active_session.save(update_fields=['status'])
            else:
                serializer = LabSessionSerializer(active_session)
                return Response(
                    {'detail': 'Session already active.', 'session': serializer.data},
                    status=status.HTTP_200_OK,
                )

        # Allocate a port from the lab's range
        used_ports = set(
            LabSession.objects.filter(
                lab=lab,
                status=LabSession.SessionStatus.RUNNING,
            ).values_list('port', flat=True)
        )
        available = [
            p for p in range(lab.port_range_start, lab.port_range_end)
            if p not in used_ports
        ]
        if not available:
            return Response({'detail': 'No available ports. Try again later.'}, status=503)

        port = random.choice(available)
        expires_at = timezone.now() + timedelta(seconds=lab.time_limit)

        session = LabSession.objects.create(
            user=request.user,
            lab=lab,
            port=port,
            status=LabSession.SessionStatus.STARTING,
            expires_at=expires_at,
            # container_id would be set by the Celery task after Docker spawns
        )

        # TODO: dispatch Celery task → start_lab_container.delay(session.id)
        # For now, immediately mark as RUNNING for dev purposes
        session.status = LabSession.SessionStatus.RUNNING
        session.container_id = f'nexus_{lab.id}_{session.id}'
        session.save(update_fields=['status', 'container_id'])

        serializer = LabSessionSerializer(session)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def stop(self, request, pk=None):
        """POST /api/v1/labyrinth/labs/{id}/stop/"""
        lab = self.get_object()
        session = LabSession.objects.filter(
            user=request.user, lab=lab,
            status=LabSession.SessionStatus.RUNNING,
        ).first()
        if not session:
            return Response({'detail': 'No active session found.'}, status=404)
        session.stop()
        return Response({'detail': 'Session stopped.'})


class LabSessionViewSet(viewsets.ReadOnlyModelViewSet):
    """List and retrieve lab sessions (own sessions, or all for admins)."""
    serializer_class = LabSessionSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'lab']
    ordering_fields = ['started_at', 'expires_at']

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return LabSession.objects.select_related('user', 'lab').all()
        return LabSession.objects.select_related('user', 'lab').filter(user=user)
