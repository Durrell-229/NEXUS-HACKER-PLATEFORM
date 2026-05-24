"""
NEXUS Signal — WebSocket Consumer
Handles real-time messaging for channels.

Connection URL: ws://host/ws/signal/{channel_slug}/
Authentication: JWT token passed as query param ?token=<access_token>
"""

import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.utils import timezone

logger = logging.getLogger(__name__)
User = get_user_model()


class ChatConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for a single channel room.
    Group naming: 'signal_<channel_slug>'
    """

    async def connect(self):
        self.channel_slug = self.scope['url_route']['kwargs']['channel_slug']
        self.room_group_name = f'signal_{self.channel_slug}'
        self.user = self.scope.get('user')

        # Authenticate
        if not self.user or not self.user.is_authenticated:
            # Try JWT from query string
            self.user = await self._authenticate_from_query()
            if not self.user:
                await self.close(code=4001)
                return

        # Check channel exists and user has access
        channel = await self._get_channel(self.channel_slug)
        if not channel:
            await self.close(code=4004)
            return

        if channel.is_private:
            has_access = await self._is_member(channel, self.user)
            if not has_access:
                await self.close(code=4003)
                return

        # Join the room group
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        # Broadcast presence notification
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'user_joined',
                'username': self.user.username,
                'user_id': self.user.id,
            },
        )

        # Send last 50 messages on connect
        messages = await self._get_recent_messages(self.channel_slug, limit=50)
        await self.send(text_data=json.dumps({
            'type': 'history',
            'messages': messages,
        }))

        # Update last_seen
        await self._update_last_seen(self.user)
        logger.info(f'WS connect: {self.user.username} → #{self.channel_slug}')

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'user_left',
                    'username': getattr(self.user, 'username', 'unknown'),
                    'user_id': getattr(self.user, 'id', None),
                },
            )
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
        logger.info(f'WS disconnect: code={close_code}')

    async def receive(self, text_data):
        """Handle incoming WebSocket messages from client."""
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            await self.send_error('Invalid JSON payload.')
            return

        msg_type = data.get('type', 'message')

        if msg_type == 'message':
            await self._handle_message(data)
        elif msg_type == 'edit':
            await self._handle_edit(data)
        elif msg_type == 'delete':
            await self._handle_delete(data)
        elif msg_type == 'react':
            await self._handle_reaction(data)
        elif msg_type == 'typing':
            await self._handle_typing(data)
        else:
            await self.send_error(f'Unknown message type: {msg_type}')

    # ─── Handlers ─────────────────────────────────────────────────────────────

    async def _handle_message(self, data):
        content = data.get('content', '').strip()
        if not content:
            await self.send_error('Message content cannot be empty.')
            return

        message_type = data.get('message_type', 'TEXT')
        code_language = data.get('code_language', '')
        reply_to_id = data.get('reply_to')

        saved_msg = await self._save_message(
            channel_slug=self.channel_slug,
            user=self.user,
            content=content,
            message_type=message_type,
            code_language=code_language,
            reply_to_id=reply_to_id,
        )

        if saved_msg:
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': saved_msg,
                },
            )

    async def _handle_edit(self, data):
        message_id = data.get('message_id')
        new_content = data.get('content', '').strip()
        if not message_id or not new_content:
            return

        updated = await self._edit_message(message_id, self.user, new_content)
        if updated:
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'message_edited',
                    'message_id': message_id,
                    'content': new_content,
                    'editor': self.user.username,
                },
            )

    async def _handle_delete(self, data):
        message_id = data.get('message_id')
        if not message_id:
            return

        deleted = await self._delete_message(message_id, self.user)
        if deleted:
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'message_deleted',
                    'message_id': message_id,
                },
            )

    async def _handle_reaction(self, data):
        message_id = data.get('message_id')
        emoji = data.get('emoji', '')
        if not message_id or not emoji:
            return

        reactions = await self._toggle_reaction(message_id, self.user, emoji)
        if reactions is not None:
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'reaction_updated',
                    'message_id': message_id,
                    'reactions': reactions,
                },
            )

    async def _handle_typing(self, data):
        """Broadcast typing indicator to room (not persisted)."""
        is_typing = data.get('is_typing', False)
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'typing_indicator',
                'username': self.user.username,
                'is_typing': is_typing,
            },
        )

    # ─── Group event handlers (called by channel layer) ───────────────────────

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'message',
            'message': event['message'],
        }))

    async def message_edited(self, event):
        await self.send(text_data=json.dumps({
            'type': 'edit',
            'message_id': event['message_id'],
            'content': event['content'],
            'editor': event['editor'],
        }))

    async def message_deleted(self, event):
        await self.send(text_data=json.dumps({
            'type': 'delete',
            'message_id': event['message_id'],
        }))

    async def reaction_updated(self, event):
        await self.send(text_data=json.dumps({
            'type': 'reaction',
            'message_id': event['message_id'],
            'reactions': event['reactions'],
        }))

    async def typing_indicator(self, event):
        # Don't echo typing indicator back to sender
        if event['username'] != self.user.username:
            await self.send(text_data=json.dumps({
                'type': 'typing',
                'username': event['username'],
                'is_typing': event['is_typing'],
            }))

    async def user_joined(self, event):
        await self.send(text_data=json.dumps({
            'type': 'presence',
            'event': 'joined',
            'username': event['username'],
            'user_id': event['user_id'],
        }))

    async def user_left(self, event):
        await self.send(text_data=json.dumps({
            'type': 'presence',
            'event': 'left',
            'username': event['username'],
            'user_id': event['user_id'],
        }))

    # ─── Helpers ──────────────────────────────────────────────────────────────

    async def send_error(self, message: str):
        await self.send(text_data=json.dumps({'type': 'error', 'message': message}))

    @database_sync_to_async
    def _authenticate_from_query(self):
        """Extract and validate JWT token from ?token= query param."""
        from rest_framework_simplejwt.tokens import AccessToken
        from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

        query_string = self.scope.get('query_string', b'').decode()
        params = dict(
            item.split('=') for item in query_string.split('&') if '=' in item
        )
        token_str = params.get('token')
        if not token_str:
            return None
        try:
            token = AccessToken(token_str)
            user_id = token['user_id']
            return User.objects.get(id=user_id, is_active=True)
        except (InvalidToken, TokenError, User.DoesNotExist, KeyError):
            return None

    @database_sync_to_async
    def _get_channel(self, slug):
        from .models import Channel
        try:
            return Channel.objects.get(slug=slug)
        except Channel.DoesNotExist:
            return None

    @database_sync_to_async
    def _is_member(self, channel, user):
        return channel.members.filter(pk=user.pk).exists()

    @database_sync_to_async
    def _get_recent_messages(self, channel_slug, limit=50):
        from .models import Message
        messages = (
            Message.objects
            .filter(channel__slug=channel_slug, is_deleted=False)
            .select_related('author')
            .order_by('-created_at')[:limit]
        )
        return [
            {
                'id': m.id,
                'author': m.author.username,
                'author_id': m.author.id,
                'content': m.content,
                'message_type': m.message_type,
                'code_language': m.code_language,
                'reactions': m.reactions,
                'is_edited': m.is_edited,
                'created_at': m.created_at.isoformat(),
                'reply_to': m.reply_to_id,
            }
            for m in reversed(list(messages))
        ]

    @database_sync_to_async
    def _save_message(self, channel_slug, user, content, message_type, code_language, reply_to_id):
        from .models import Channel, Message
        try:
            channel = Channel.objects.get(slug=channel_slug)
            msg = Message.objects.create(
                channel=channel,
                author=user,
                content=content,
                message_type=message_type,
                code_language=code_language or '',
                reply_to_id=reply_to_id,
            )
            return {
                'id': msg.id,
                'author': user.username,
                'author_id': user.id,
                'content': msg.content,
                'message_type': msg.message_type,
                'code_language': msg.code_language,
                'reactions': msg.reactions,
                'is_edited': False,
                'created_at': msg.created_at.isoformat(),
                'reply_to': reply_to_id,
            }
        except Channel.DoesNotExist:
            return None

    @database_sync_to_async
    def _edit_message(self, message_id, user, new_content):
        from .models import Message
        try:
            msg = Message.objects.get(pk=message_id, author=user, is_deleted=False)
            msg.content = new_content
            msg.is_edited = True
            msg.save(update_fields=['content', 'is_edited', 'updated_at'])
            return True
        except Message.DoesNotExist:
            return False

    @database_sync_to_async
    def _delete_message(self, message_id, user):
        from .models import Message
        try:
            msg = Message.objects.get(pk=message_id)
            if msg.author == user or user.is_staff:
                msg.soft_delete()
                return True
            return False
        except Message.DoesNotExist:
            return False

    @database_sync_to_async
    def _toggle_reaction(self, message_id, user, emoji):
        from .models import Message
        try:
            msg = Message.objects.get(pk=message_id, is_deleted=False)
            reactions = msg.reactions or {}
            user_list = reactions.get(emoji, [])
            uid = str(user.id)
            if uid in user_list:
                user_list.remove(uid)
            else:
                user_list.append(uid)
            if user_list:
                reactions[emoji] = user_list
            else:
                reactions.pop(emoji, None)
            msg.reactions = reactions
            msg.save(update_fields=['reactions'])
            return reactions
        except Message.DoesNotExist:
            return None

    @database_sync_to_async
    def _update_last_seen(self, user):
        User.objects.filter(pk=user.pk).update(last_seen=timezone.now())
