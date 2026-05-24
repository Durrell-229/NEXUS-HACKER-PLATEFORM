from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class Lab(models.Model):
    """A sandboxed lab environment powered by Docker."""

    class Difficulty(models.TextChoices):
        BEGINNER = 'BEGINNER', _('Beginner')
        INTERMEDIATE = 'INTERMEDIATE', _('Intermediate')
        ADVANCED = 'ADVANCED', _('Advanced')
        EXPERT = 'EXPERT', _('Expert')

    class Technology(models.TextChoices):
        PYTHON = 'PYTHON', _('Python')
        JAVASCRIPT = 'JAVASCRIPT', _('JavaScript / Node.js')
        RUST = 'RUST', _('Rust')
        GO = 'GO', _('Go')
        C = 'C', _('C / C++')
        JAVA = 'JAVA', _('Java')
        BASH = 'BASH', _('Bash / Shell')
        GENERIC = 'GENERIC', _('Generic Linux')

    title = models.CharField(max_length=200)
    description = models.TextField()
    objective = models.TextField(blank=True, help_text='What the user is expected to accomplish.')
    difficulty = models.CharField(max_length=15, choices=Difficulty.choices, default=Difficulty.BEGINNER)
    technology = models.CharField(max_length=15, choices=Technology.choices, default=Technology.GENERIC)
    docker_image = models.CharField(max_length=300)
    port_range_start = models.PositiveIntegerField(default=10000)
    port_range_end = models.PositiveIntegerField(default=20000)
    time_limit = models.PositiveIntegerField(default=3600, help_text='Session time limit in seconds.')
    environment_vars = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['difficulty', 'title']
        verbose_name = _('Lab')
        verbose_name_plural = _('Labs')

    def __str__(self):
        return f'{self.title} [{self.technology}] ({self.difficulty})'


class LabSession(models.Model):
    """An active (or historical) lab session for a user."""

    class SessionStatus(models.TextChoices):
        STARTING = 'STARTING', _('Starting')
        RUNNING = 'RUNNING', _('Running')
        STOPPED = 'STOPPED', _('Stopped')
        FAILED = 'FAILED', _('Failed')
        EXPIRED = 'EXPIRED', _('Expired')

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='lab_sessions',
    )
    lab = models.ForeignKey(
        Lab,
        on_delete=models.CASCADE,
        related_name='sessions',
    )
    container_id = models.CharField(max_length=100, blank=True)
    port = models.PositiveIntegerField(null=True, blank=True)
    status = models.CharField(
        max_length=10,
        choices=SessionStatus.choices,
        default=SessionStatus.STARTING,
    )
    started_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    stopped_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-started_at']
        verbose_name = _('Lab Session')
        verbose_name_plural = _('Lab Sessions')

    def __str__(self):
        return f'{self.user.username} — {self.lab.title} [{self.status}]'

    def is_expired(self):
        if self.expires_at:
            return timezone.now() > self.expires_at
        return False

    def stop(self):
        self.status = self.SessionStatus.STOPPED
        self.stopped_at = timezone.now()
        self.save(update_fields=['status', 'stopped_at'])
