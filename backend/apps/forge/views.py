from django.db.models import F
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from .models import CodeSnippet, CodeSession
from .serializers import (
    CodeSnippetSerializer,
    CodeSnippetListSerializer,
    CodeSessionSerializer,
    CodeSessionCreateSerializer,
)


class CodeSnippetViewSet(viewsets.ModelViewSet):
    """CRUD for shared code snippets."""
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['language', 'is_public']
    search_fields = ['title', 'description', 'code']
    ordering_fields = ['created_at', 'views', 'likes']

    def get_queryset(self):
        qs = CodeSnippet.objects.select_related('author')
        if self.request.user.is_authenticated:
            # Authenticated users see public snippets + their own private ones
            return qs.filter(is_public=True) | qs.filter(author=self.request.user)
        return qs.filter(is_public=True)

    def get_serializer_class(self):
        if self.action == 'list':
            return CodeSnippetListSerializer
        return CodeSnippetSerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        CodeSnippet.objects.filter(pk=instance.pk).update(views=F('views') + 1)
        return super().retrieve(request, *args, **kwargs)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def like(self, request, pk=None):
        """POST /api/v1/forge/snippets/{id}/like/ — Toggle like."""
        snippet = self.get_object()
        user = request.user
        if user in snippet.liked_by.all():
            snippet.liked_by.remove(user)
            CodeSnippet.objects.filter(pk=snippet.pk).update(likes=F('likes') - 1)
            return Response({'liked': False})
        snippet.liked_by.add(user)
        CodeSnippet.objects.filter(pk=snippet.pk).update(likes=F('likes') + 1)
        return Response({'liked': True})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def fork(self, request, pk=None):
        """POST /api/v1/forge/snippets/{id}/fork/ — Fork a snippet."""
        original = self.get_object()
        fork = CodeSnippet.objects.create(
            title=f'Fork of {original.title}',
            description=original.description,
            code=original.code,
            language=original.language,
            author=request.user,
            is_public=True,
            tags=original.tags,
        )
        serializer = CodeSnippetSerializer(fork)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class CodeSessionViewSet(viewsets.ModelViewSet):
    """CRUD for live code sessions."""
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['language', 'status', 'is_public']
    ordering_fields = ['created_at']

    def get_queryset(self):
        user = self.request.user
        if self.action == 'list':
            if user.is_authenticated:
                return CodeSession.objects.filter(is_public=True) | CodeSession.objects.filter(user=user)
            return CodeSession.objects.filter(is_public=True)
        if user.is_staff:
            return CodeSession.objects.all()
        return CodeSession.objects.filter(user=user) | CodeSession.objects.filter(participants=user)

    def get_serializer_class(self):
        if self.action == 'create':
            return CodeSessionCreateSerializer
        return CodeSessionSerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def join(self, request, pk=None):
        """POST /api/v1/forge/sessions/{id}/join/"""
        session = self.get_object()
        if session.status == CodeSession.Status.CLOSED:
            return Response({'detail': 'Session is closed.'}, status=400)
        session.participants.add(request.user)
        return Response({'detail': 'Joined session.'})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def close(self, request, pk=None):
        """POST /api/v1/forge/sessions/{id}/close/"""
        session = self.get_object()
        if session.user != request.user and not request.user.is_staff:
            return Response({'detail': 'Only the session owner can close it.'}, status=403)
        session.status = CodeSession.Status.CLOSED
        session.save(update_fields=['status'])
        return Response({'detail': 'Session closed.'})
