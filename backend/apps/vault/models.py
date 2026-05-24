from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _


class User(AbstractUser):
    """
    Custom user model for the NEXUS platform.
    Extends AbstractUser to add hacker-specific fields.
    """

    class Rank(models.TextChoices):
        NOVICE = 'NOVICE', _('Novice')
        HACKER = 'HACKER', _('Hacker')
        ELITE = 'ELITE', _('Elite')
        GHOST = 'GHOST', _('Ghost')

    # Override email to make it unique and required
    email = models.EmailField(_('email address'), unique=True)

    # Profile
    avatar = models.URLField(blank=True, null=True)
    bio = models.TextField(blank=True, max_length=500)
    github_url = models.URLField(blank=True)
    website_url = models.URLField(blank=True)

    # Gamification
    xp_points = models.PositiveIntegerField(default=0)
    level = models.PositiveSmallIntegerField(default=1)
    rank = models.CharField(max_length=10, choices=Rank.choices, default=Rank.NOVICE)

    # Security
    is_verified = models.BooleanField(default=False)
    two_factor_enabled = models.BooleanField(default=False)
    two_factor_secret = models.CharField(max_length=32, blank=True)

    # Timestamps
    last_seen = models.DateTimeField(null=True, blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        verbose_name = _('User')
        verbose_name_plural = _('Users')
        ordering = ['-xp_points']

    def __str__(self):
        return f'{self.username} ({self.email})'

    def add_xp(self, points: int) -> None:
        """Add XP and automatically compute level and rank."""
        self.xp_points += points
        self.level = max(1, self.xp_points // 500 + 1)
        # Rank thresholds
        if self.xp_points >= 50_000:
            self.rank = self.Rank.GHOST
        elif self.xp_points >= 15_000:
            self.rank = self.Rank.ELITE
        elif self.xp_points >= 3_000:
            self.rank = self.Rank.HACKER
        else:
            self.rank = self.Rank.NOVICE
        self.save(update_fields=['xp_points', 'level', 'rank'])

    @property
    def avatar_url(self):
        if self.avatar:
            return self.avatar.url
        # Gravatar-style default
        return f'https://api.dicebear.com/8.x/bottts/svg?seed={self.username}'


class Trophy(models.Model):
    """Achievement / badge earned by a user."""

    class Rarity(models.TextChoices):
        COMMON = 'COMMON', _('Common')
        RARE = 'RARE', _('Rare')
        LEGENDARY = 'LEGENDARY', _('Legendary')

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='trophies',
    )
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, default='trophy')  # icon identifier / emoji
    rarity = models.CharField(max_length=10, choices=Rarity.choices, default=Rarity.COMMON)
    earned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Trophy')
        verbose_name_plural = _('Trophies')
        ordering = ['-earned_at']
        unique_together = [('user', 'name')]

    def __str__(self):
        return f'{self.name} — {self.user.username} [{self.rarity}]'


class UserStats(models.Model):
    """Aggregate statistics for a user — maintained via signals/tasks."""

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='stats',
    )
    challenges_solved = models.PositiveIntegerField(default=0)
    ctf_wins = models.PositiveIntegerField(default=0)
    code_battles_won = models.PositiveIntegerField(default=0)
    total_submissions = models.PositiveIntegerField(default=0)
    articles_written = models.PositiveIntegerField(default=0)
    snippets_shared = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = _('User Stats')
        verbose_name_plural = _('User Stats')

    def __str__(self):
        return f'Stats for {self.user.username}'
