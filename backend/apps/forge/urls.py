from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CodeSnippetViewSet, CodeSessionViewSet

router = DefaultRouter()
router.register(r'snippets', CodeSnippetViewSet, basename='snippet')
router.register(r'sessions', CodeSessionViewSet, basename='code-session')

urlpatterns = [
    path('', include(router.urls)),
]
