from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TagViewSet, ArticleViewSet, CommentViewSet

router = DefaultRouter()
router.register(r'tags', TagViewSet, basename='tag')
router.register(r'articles', ArticleViewSet, basename='article')
router.register(r'comments', CommentViewSet, basename='comment')

urlpatterns = [
    path('', include(router.urls)),
]
