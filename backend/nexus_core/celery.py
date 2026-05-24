"""
NEXUS Platform — Celery Configuration
Autodiscover tasks in all installed apps.
"""

import os

from celery import Celery
from celery.schedules import crontab
from django.conf import settings

# Set default Django settings module
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "nexus_core.settings.development")

# Create the Celery application
app = Celery("nexus_core")

# Use Django settings for configuration — namespace CELERY_ for all keys
app.config_from_object("django.conf:settings", namespace="CELERY")

# Auto-discover tasks.py in every app listed in INSTALLED_APPS
app.autodiscover_tasks(lambda: settings.INSTALLED_APPS)

# ─── Beat Schedule ────────────────────────────────────────────────────────────
app.conf.beat_schedule = {
    # Update challenge statistics every 5 minutes
    "update-challenge-stats-every-5min": {
        "task": "apps.arena.tasks.update_challenge_stats",
        "schedule": crontab(minute="*/5"),
        "options": {"queue": "stats"},
    },
    # Clean expired tokens every night at 2 AM
    "cleanup-expired-tokens-nightly": {
        "task": "apps.vault.tasks.cleanup_expired_tokens",
        "schedule": crontab(hour=2, minute=0),
        "options": {"queue": "default"},
    },
    # Refresh leaderboard every hour
    "refresh-leaderboard-hourly": {
        "task": "apps.arena.tasks.refresh_leaderboard",
        "schedule": crontab(minute=0),
        "options": {"queue": "stats"},
    },
    # Check and close finished tournaments every 30 minutes
    "check-tournament-status-every-30min": {
        "task": "apps.arena.tasks.check_tournament_status",
        "schedule": crontab(minute="*/30"),
        "options": {"queue": "default"},
    },
    # Send weekly digest every Monday at 9 AM
    "send-weekly-digest-monday": {
        "task": "apps.signal.tasks.send_weekly_digest",
        "schedule": crontab(day_of_week=1, hour=9, minute=0),
        "options": {"queue": "notifications"},
    },
}

# ─── Task Routes ──────────────────────────────────────────────────────────────
app.conf.task_routes = {
    "apps.arena.tasks.send_ctf_notification": {"queue": "notifications"},
    "apps.arena.tasks.update_challenge_stats": {"queue": "stats"},
    "apps.arena.tasks.refresh_leaderboard": {"queue": "stats"},
    "apps.signal.tasks.*": {"queue": "notifications"},
    "apps.vault.tasks.*": {"queue": "default"},
}

# ─── Celery Settings ──────────────────────────────────────────────────────────
app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    # Result expiry: 24 hours
    result_expires=86400,
    # Soft/hard time limits per task
    task_soft_time_limit=300,   # 5 min soft limit
    task_time_limit=600,        # 10 min hard limit
    # Default retry settings
    task_max_retries=3,
    task_default_retry_delay=60,
)


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    """Diagnostic Celery task."""
    print(f"Request: {self.request!r}")
