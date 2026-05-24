from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

API_V1 = 'api/v1/'

urlpatterns = [
    # Django admin
    path('admin/', admin.site.urls),

    # OpenAPI schema & docs
    path(f'{API_V1}schema/', SpectacularAPIView.as_view(), name='schema'),
    path(f'{API_V1}docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path(f'{API_V1}redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    # JWT auth
    path(f'{API_V1}auth/', include('apps.vault.auth_urls')),

    # App routers
    path(f'{API_V1}vault/', include('apps.vault.urls')),
    path(f'{API_V1}arena/', include('apps.arena.urls')),
    path(f'{API_V1}labyrinth/', include('apps.labyrinth.urls')),
    path(f'{API_V1}codex/', include('apps.codex.urls')),
    path(f'{API_V1}forge/', include('apps.forge.urls')),
    path(f'{API_V1}signal/', include('apps.signal.urls')),
    path(f'{API_V1}matrix/', include('apps.matrix.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
