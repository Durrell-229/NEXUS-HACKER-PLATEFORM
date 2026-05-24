from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LabViewSet, LabSessionViewSet

router = DefaultRouter()
router.register(r'labs', LabViewSet, basename='lab')
router.register(r'sessions', LabSessionViewSet, basename='lab-session')

urlpatterns = [
    path('', include(router.urls)),
]
