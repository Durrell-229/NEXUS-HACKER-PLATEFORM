from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ChallengeViewSet, SubmissionViewSet, TournamentViewSet

router = DefaultRouter()
router.register(r'challenges', ChallengeViewSet, basename='challenge')
router.register(r'submissions', SubmissionViewSet, basename='submission')
router.register(r'tournaments', TournamentViewSet, basename='tournament')

urlpatterns = [
    path('', include(router.urls)),
]
