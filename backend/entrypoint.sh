#!/bin/sh
set -e

echo "==> Creating required directories..."
mkdir -p /app/logs

echo "==> Running database migrations..."
python manage.py migrate --noinput

echo "==> Collecting static files..."
python manage.py collectstatic --noinput

echo "==> Creating superuser if not exists..."
python manage.py shell -c "
from django.contrib.auth import get_user_model
import os
User = get_user_model()
username = os.environ.get('DJANGO_SUPERUSER_USERNAME', 'nexus_admin')
email    = os.environ.get('DJANGO_SUPERUSER_EMAIL',    'admin@nexus-platform.io')
password = os.environ.get('DJANGO_SUPERUSER_PASSWORD', 'N3xus@Admin2026!')
if not User.objects.filter(username=username).exists():
    User.objects.create_superuser(username=username, email=email, password=password)
    print(f'Superuser [{username}] created.')
else:
    print(f'Superuser [{username}] already exists.')
"

echo "==> Starting Gunicorn on port ${PORT:-8000}..."
exec gunicorn nexus_core.asgi:application \
  --bind "0.0.0.0:${PORT:-8000}" \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --timeout 120 \
  --log-level info
