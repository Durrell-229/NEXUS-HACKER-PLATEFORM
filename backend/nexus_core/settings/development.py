from .base import *  # noqa: F401, F403

DEBUG = True

# Override with SQLite for quick local development (no Postgres needed)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'nexus_dev.sqlite3',  # noqa: F405
    }
}

# Relax throttling during development
REST_FRAMEWORK.update({  # noqa: F405
    'DEFAULT_THROTTLE_RATES': {
        'anon': '10000/day',
        'user': '50000/day',
    }
})

# Use in-memory channel layer for dev if Redis is not running
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer',
    }
}

# Allow all origins in development
CORS_ALLOW_ALL_ORIGINS = True

# Django Debug Toolbar (optional — install separately)
INTERNAL_IPS = ['127.0.0.1']

# Show emails in console
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Celery: run tasks synchronously in tests/dev
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True

# django_extensions already in base.py THIRD_PARTY_APPS

LOGGING['loggers']['apps']['level'] = 'DEBUG'  # noqa: F405
