from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


class Challenge(models.Model):
    """A CTF-style challenge that users can solve."""

    class Category(models.TextChoices):
        WEB = 'WEB', _('Web')
        CRYPTO = 'CRYPTO', _('Cryptography')
        REVERSE = 'REVERSE', _('Reverse Engineering')
        PWN = 'PWN', _('Pwn / Exploitation')
        FORENSICS = 'FORENSICS', _('Forensics')
        MISC = 'MISC', _('Miscellaneous')

    class Difficulty(models.TextChoices):
        EASY = 'EASY', _('Easy')
        MEDIUM = 'MEDIUM', _('Medium')
        HARD = 'HARD', _('Hard')
        INSANE = 'INSANE', _('Insane')

    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.CharField(max_length=10, choices=Category.choices)
    difficulty = models.CharField(max_length=10, choices=Difficulty.choices)
    points = models.PositiveIntegerField(default=100)
    # Flag is write_only — never exposed via serializer
    flag = models.CharField(max_length=500)
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='authored_challenges',
    )
    hints = models.JSONField(default=list, blank=True)
    files = models.JSONField(default=list, blank=True)  # list of file URLs
    is_active = models.BooleanField(default=True)
    solves_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['difficulty', '-points']
        verbose_name = _('Challenge')
        verbose_name_plural = _('Challenges')

    def __str__(self):
        return f'[{self.category}] {self.title} ({self.difficulty})'


class Submission(models.Model):
    """A flag submission attempt by a user."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='submissions',
    )
    challenge = models.ForeignKey(
        Challenge,
        on_delete=models.CASCADE,
        related_name='submissions',
    )
    flag_submitted = models.CharField(max_length=500)
    is_correct = models.BooleanField()
    submitted_at = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        ordering = ['-submitted_at']
        verbose_name = _('Submission')
        verbose_name_plural = _('Submissions')

    def __str__(self):
        result = 'CORRECT' if self.is_correct else 'WRONG'
        return f'{self.user.username} → {self.challenge.title} [{result}]'


class Tournament(models.Model):
    """A timed CTF tournament."""

    class Status(models.TextChoices):
        UPCOMING = 'UPCOMING', _('Upcoming')
        ACTIVE = 'ACTIVE', _('Active')
        ENDED = 'ENDED', _('Ended')

    name = models.CharField(max_length=200)
    description = models.TextField()
    challenges = models.ManyToManyField(Challenge, blank=True, related_name='tournaments')
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    max_participants = models.PositiveIntegerField(default=0, help_text='0 = unlimited')
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.UPCOMING)
    banner = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-start_time']
        verbose_name = _('Tournament')
        verbose_name_plural = _('Tournaments')

    def __str__(self):
        return f'{self.name} [{self.status}]'

    @property
    def participant_count(self):
        return self.participants.count()


class TournamentParticipant(models.Model):
    """A user's participation record in a tournament."""

    tournament = models.ForeignKey(
        Tournament,
        on_delete=models.CASCADE,
        related_name='participants',
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='tournament_participations',
    )
    score = models.PositiveIntegerField(default=0)
    rank = models.PositiveIntegerField(null=True, blank=True)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [('tournament', 'user')]
        ordering = ['-score', 'joined_at']
        verbose_name = _('Tournament Participant')

    def __str__(self):
        return f'{self.user.username} @ {self.tournament.name} (score={self.score})'
