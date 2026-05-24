from django.urls import re_path
from .consumers import ChatConsumer

websocket_urlpatterns = [
    re_path(r'^ws/signal/(?P<channel_slug>[\w-]+)/$', ChatConsumer.as_asgi()),
]
