import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'nexus_core.settings.development')

django_asgi_app = get_asgi_application()

from apps.signal.routing import websocket_urlpatterns as signal_ws  # noqa: E402
from apps.forge.routing import websocket_urlpatterns as forge_ws    # noqa: E402

websocket_urlpatterns = signal_ws + forge_ws

application = ProtocolTypeRouter({
    'http': django_asgi_app,
    'websocket': AuthMiddlewareStack(
        URLRouter(websocket_urlpatterns)
    ),
})
