from .base import *  # noqa: F401, F403

DEBUG = False

# Security hardening
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
# Render terminates SSL at the proxy — disable redirect to avoid infinite loop
SECURE_SSL_REDIRECT = False
# Tell Django the original request was HTTPS (via Render's proxy header)
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
X_FRAME_OPTIONS = 'DENY'
SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'

# Content Security Policy (add django-csp if needed)
# CSP_DEFAULT_SRC = ("'self'",)

# Static & media via cloud storage in production (S3/GCS)
# Uncomment and configure as needed:
# DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
# STATICFILES_STORAGE = 'storages.backends.s3boto3.S3StaticStorage'
# AWS_STORAGE_BUCKET_NAME = env('AWS_STORAGE_BUCKET_NAME')
# AWS_S3_REGION_NAME = env('AWS_S3_REGION_NAME', default='us-east-1')
# AWS_ACCESS_KEY_ID = env('AWS_ACCESS_KEY_ID')
# AWS_SECRET_ACCESS_KEY = env('AWS_SECRET_ACCESS_KEY')

# Email via SMTP in production
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = env('EMAIL_HOST', default='smtp.sendgrid.net')  # noqa: F405
EMAIL_PORT = env.int('EMAIL_PORT', default=587)  # noqa: F405
EMAIL_USE_TLS = True
EMAIL_HOST_USER = env('EMAIL_HOST_USER', default='')  # noqa: F405
EMAIL_HOST_PASSWORD = env('EMAIL_HOST_PASSWORD', default='')  # noqa: F405

# Sentry error tracking (optional — add sentry-sdk to requirements)
# import sentry_sdk
# from sentry_sdk.integrations.django import DjangoIntegration
# sentry_sdk.init(
#     dsn=env('SENTRY_DSN'),
#     integrations=[DjangoIntegration()],
#     traces_sample_rate=0.1,
#     send_default_pii=False,
# )

# Production logging — console only (Render/cloud captures stdout)
# File handler only if /app/logs directory exists (local/VPS deployments)
import os as _os
_log_dir = BASE_DIR / 'logs'  # noqa: F405
if _log_dir.exists():
    LOGGING['handlers']['file'] = {  # noqa: F405
        'class': 'logging.handlers.RotatingFileHandler',
        'filename': _log_dir / 'nexus.log',
        'maxBytes': 10 * 1024 * 1024,
        'backupCount': 5,
        'formatter': 'verbose',
    }
    _handlers = ['console', 'file']
else:
    _handlers = ['console']

LOGGING['root']['handlers'] = _handlers  # noqa: F405
LOGGING['loggers']['django']['handlers'] = _handlers  # noqa: F405
LOGGING['loggers']['apps']['handlers'] = _handlers  # noqa: F405
LOGGING['loggers']['apps']['level'] = 'INFO'  # noqa: F405

# Cache with Redis
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': env('REDIS_URL', default='redis://localhost:6379/1'),  # noqa: F405
    }
}

# Session engine via cache
SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
SESSION_CACHE_ALIAS = 'default'
