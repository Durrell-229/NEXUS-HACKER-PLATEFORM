from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SystemLogViewSet, PlatformStatsViewSet, DashboardView, PlatformStatsSnapshotView, AIChatView

router = DefaultRouter()
router.register(r'logs', SystemLogViewSet, basename='system-log')
router.register(r'platform-stats', PlatformStatsViewSet, basename='platform-stats')

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    path('stats/today/', PlatformStatsSnapshotView.as_view(), name='stats-today'),
    path('ai/chat/', AIChatView.as_view(), name='ai-chat'),
]
