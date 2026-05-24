import uuid
from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


LANGUAGE_CHOICES = [
    ('python', 'Python'),
    ('javascript', 'JavaScript'),
    ('typescript', 'TypeScript'),
    ('rust', 'Rust'),
    ('go', 'Go'),
    ('c', 'C'),
    ('cpp', 'C++'),
    ('java', 'Java'),
    ('bash', 'Bash'),
    ('sql', 'SQL'),
    ('html', 'HTML'),
    ('css', 'CSS'),
    ('json', 'JSON'),
    ('yaml', 'YAML'),
    ('markdown', 'Markdown'),
    ('other', 'Other'),
]


class CodeSnippet(models.Model):
    """A shareable code snippet."""

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    code = models.TextField()
    language = models.CharField(max_length=20, choices=LANGUAGE_CHOICES, default='python')
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='snippets',
    )
    views = models.PositiveIntegerField(default=0)
    likes = models.PositiveIntegerField(default=0)
    liked_by = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        blank=True,
        related_name='liked_snippets',
    )
    is_public = models.BooleanField(default=True)
    tags = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = _('Code Snippet')
        verbose_name_plural = _('Code Snippets')

    def __str__(self):
        return f'{self.title} ({self.language}) by {self.author.username}'


class CodeSession(models.Model):
    """
    A live collaborative code editing session.
    Content is stored in Redis for low-latency access;
    this model is the persistent record.
    """

    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', _('Active')
        CLOSED = 'CLOSED', _('Closed')

    session_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='code_sessions',
    )
    language = models.CharField(max_length=20, choices=LANGUAGE_CHOICES, default='python')
    code = models.TextField(blank=True)
    title = models.CharField(max_length=200, blank=True, default='Untitled Session')
    is_public = models.BooleanField(default=False)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.ACTIVE)
    participants = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        blank=True,
        related_name='joined_code_sessions',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = _('Code Session')
        verbose_name_plural = _('Code Sessions')

    def __str__(self):
        return f'Session {self.session_id} ({self.language}) — {self.user.username}'
