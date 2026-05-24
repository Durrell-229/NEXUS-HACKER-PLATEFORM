from django.db import models
from django.utils.translation import gettext_lazy as _


class SystemLog(models.Model):
    """Platform-level log entries for admin monitoring."""

    class Level(models.TextChoices):
        INFO = 'INFO', _('Info')
        WARNING = 'WARNING', _('Warning')
        ERROR = 'ERROR', _('Error')
        CRITICAL = 'CRITICAL', _('Critical')

    level = models.CharField(max_length=10, choices=Level.choices, default=Level.INFO)
    message = models.TextField()
    source = models.CharField(max_length=200, blank=True, help_text='Module or component that generated this log.')
    extra = models.JSONField(default=dict, blank=True, help_text='Additional structured data.')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = _('System Log')
        verbose_name_plural = _('System Logs')
        indexes = [
            models.Index(fields=['level', 'created_at']),
            models.Index(fields=['source']),
        ]

    def __str__(self):
        return f'[{self.level}] {self.source}: {self.message[:80]}'


class PlatformStats(models.Model):
    """Daily aggregated platform metrics snapshot."""

    date = models.DateField(unique=True)
    active_users = models.PositiveIntegerField(default=0)
    new_users = models.PositiveIntegerField(default=0)
    new_challenges = models.PositiveIntegerField(default=0)
    submissions = models.PositiveIntegerField(default=0)
    correct_submissions = models.PositiveIntegerField(default=0)
    lab_sessions_started = models.PositiveIntegerField(default=0)
    articles_published = models.PositiveIntegerField(default=0)
    snippets_shared = models.PositiveIntegerField(default=0)
    messages_sent = models.PositiveIntegerField(default=0)
    timestamp = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date']
        verbose_name = _('Platform Stats')
        verbose_name_plural = _('Platform Stats')

    def __str__(self):
        return f'Stats {self.date}: {self.active_users} active users'
