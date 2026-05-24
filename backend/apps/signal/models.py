from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


class Channel(models.Model):
    """A messaging channel (public or private group)."""

    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True)
    description = models.TextField(blank=True, max_length=500)
    is_private = models.BooleanField(default=False)
    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_channels',
    )
    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        blank=True,
        related_name='channels',
    )
    icon = models.CharField(max_length=10, default='#', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']
        verbose_name = _('Channel')
        verbose_name_plural = _('Channels')

    def __str__(self):
        visibility = 'private' if self.is_private else 'public'
        return f'#{self.name} ({visibility})'

    @property
    def member_count(self):
        return self.members.count()


class Message(models.Model):
    """A message in a channel."""

    class MessageType(models.TextChoices):
        TEXT = 'TEXT', _('Text')
        CODE = 'CODE', _('Code Block')
        FILE = 'FILE', _('File')
        SYSTEM = 'SYSTEM', _('System')

    channel = models.ForeignKey(
        Channel,
        on_delete=models.CASCADE,
        related_name='messages',
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='signal_messages',
    )
    content = models.TextField(max_length=4000)
    message_type = models.CharField(
        max_length=10,
        choices=MessageType.choices,
        default=MessageType.TEXT,
    )
    code_language = models.CharField(max_length=30, blank=True)
    file_url = models.URLField(blank=True)
    reply_to = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='replies',
    )
    reactions = models.JSONField(default=dict, blank=True)  # {"emoji": [user_id, ...]}
    is_edited = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']
        verbose_name = _('Message')
        verbose_name_plural = _('Messages')

    def __str__(self):
        return f'{self.author.username} in #{self.channel.name}: {self.content[:50]}'

    def soft_delete(self):
        self.is_deleted = True
        self.content = '[message deleted]'
        self.save(update_fields=['is_deleted', 'content'])
