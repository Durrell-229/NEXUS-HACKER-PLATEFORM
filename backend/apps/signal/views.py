from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from .models import Channel, Message
from .serializers import (
    ChannelSerializer,
    ChannelListSerializer,
    MessageSerializer,
    MessageCreateSerializer,
)


class ChannelViewSet(viewsets.ModelViewSet):
    """CRUD for channels + join/leave/message actions."""
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_private']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']

    def get_queryset(self):
        user = self.request.user
        qs = Channel.objects.prefetch_related('members')
        if user.is_authenticated:
            # Public channels + private channels the user is a member of
            public = qs.filter(is_private=False)
            private_member = qs.filter(is_private=True, members=user)
            return (public | private_member).distinct()
        return qs.filter(is_private=False)

    def get_serializer_class(self):
        if self.action == 'list':
            return ChannelListSerializer
        return ChannelSerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        channel = serializer.save(creator=self.request.user)
        channel.members.add(self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def join(self, request, pk=None):
        """POST /api/v1/signal/channels/{id}/join/"""
        channel = self.get_object()
        if channel.is_private:
            return Response({'detail': 'This is a private channel. Request an invite.'}, status=403)
        channel.members.add(request.user)
        return Response({'detail': f'Joined #{channel.name}.'})

    @action(detail=True, methods=['delete'], permission_classes=[permissions.IsAuthenticated])
    def leave(self, request, pk=None):
        """DELETE /api/v1/signal/channels/{id}/leave/"""
        channel = self.get_object()
        channel.members.remove(request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def invite(self, request, pk=None):
        """POST /api/v1/signal/channels/{id}/invite/ — Add a user to a private channel."""
        channel = self.get_object()
        if channel.creator != request.user and not request.user.is_staff:
            return Response({'detail': 'Only the channel creator can invite.'}, status=403)
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'detail': 'user_id required.'}, status=400)
        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            target_user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=404)
        channel.members.add(target_user)
        return Response({'detail': f'{target_user.username} added to #{channel.name}.'})

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def messages(self, request, pk=None):
        """GET /api/v1/signal/channels/{id}/messages/ — Paginated message history."""
        channel = self.get_object()
        messages = (
            Message.objects
            .filter(channel=channel, is_deleted=False)
            .select_related('author', 'reply_to__author')
            .order_by('-created_at')
        )
        page = self.paginate_queryset(messages)
        if page is not None:
            serializer = MessageSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def send_message(self, request, pk=None):
        """POST /api/v1/signal/channels/{id}/send_message/ — REST fallback for messaging."""
        channel = self.get_object()
        serializer = MessageCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        msg = serializer.save(channel=channel, author=request.user)
        return Response(MessageSerializer(msg).data, status=status.HTTP_201_CREATED)


class MessageViewSet(viewsets.ModelViewSet):
    """CRUD for messages (own messages or admin)."""
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['channel', 'message_type']
    ordering_fields = ['created_at']

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Message.objects.select_related('author', 'channel').all()
        return Message.objects.select_related('author', 'channel').filter(author=user)

    def get_serializer_class(self):
        if self.action == 'create':
            return MessageCreateSerializer
        return MessageSerializer

    def get_permissions(self):
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def perform_update(self, serializer):
        msg = self.get_object()
        if msg.author != self.request.user and not self.request.user.is_staff:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('You can only edit your own messages.')
        serializer.save(is_edited=True)

    def destroy(self, request, *args, **kwargs):
        msg = self.get_object()
        if msg.author != request.user and not request.user.is_staff:
            return Response({'detail': 'Cannot delete.'}, status=403)
        msg.soft_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
