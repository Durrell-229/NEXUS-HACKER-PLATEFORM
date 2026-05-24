from django.db.models import F
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from .models import Tag, Article, Comment
from .serializers import (
    TagSerializer,
    ArticleSerializer,
    ArticleListSerializer,
    CommentSerializer,
)


class TagViewSet(viewsets.ModelViewSet):
    """CRUD for tags."""
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'description']

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]


class ArticleViewSet(viewsets.ModelViewSet):
    """CRUD for knowledge-base articles."""
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['published', 'tags']
    search_fields = ['title', 'content', 'summary']
    ordering_fields = ['created_at', 'views', 'likes']

    def get_queryset(self):
        qs = Article.objects.select_related('author').prefetch_related('tags', 'comments__author')
        if self.request.user.is_authenticated and self.request.user.is_staff:
            return qs.all()
        return qs.filter(published=True)

    def get_serializer_class(self):
        if self.action == 'list':
            return ArticleListSerializer
        return ArticleSerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [permissions.AllowAny()]
        if self.action in ('like', 'comments'):
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def perform_update(self, serializer):
        article = self.get_object()
        if article.author != self.request.user and not self.request.user.is_staff:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('You can only edit your own articles.')
        serializer.save()

    def retrieve(self, request, *args, **kwargs):
        """Increment view count on every retrieve."""
        instance = self.get_object()
        Article.objects.filter(pk=instance.pk).update(views=F('views') + 1)
        return super().retrieve(request, *args, **kwargs)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def like(self, request, pk=None):
        """POST /api/v1/codex/articles/{id}/like/ — Toggle like."""
        article = self.get_object()
        user = request.user
        if user in article.liked_by.all():
            article.liked_by.remove(user)
            Article.objects.filter(pk=article.pk).update(likes=F('likes') - 1)
            return Response({'liked': False, 'likes': article.likes - 1})
        else:
            article.liked_by.add(user)
            Article.objects.filter(pk=article.pk).update(likes=F('likes') + 1)
            return Response({'liked': True, 'likes': article.likes + 1})

    @action(detail=True, methods=['get', 'post'], permission_classes=[permissions.IsAuthenticatedOrReadOnly])
    def comments(self, request, pk=None):
        """GET/POST /api/v1/codex/articles/{id}/comments/"""
        article = self.get_object()

        if request.method == 'GET':
            top_level = article.comments.filter(parent=None).select_related('author').prefetch_related('replies__author')
            serializer = CommentSerializer(top_level, many=True)
            return Response(serializer.data)

        # POST
        serializer = CommentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(article=article, author=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class CommentViewSet(viewsets.ModelViewSet):
    """CRUD for comments (admin or own)."""
    serializer_class = CommentSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['article']

    def get_queryset(self):
        return Comment.objects.select_related('author', 'article').filter(parent=None)

    def get_permissions(self):
        if self.action in ('update', 'partial_update', 'destroy'):
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticatedOrReadOnly()]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def perform_update(self, serializer):
        comment = self.get_object()
        if comment.author != self.request.user and not self.request.user.is_staff:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('You can only edit your own comments.')
        serializer.save(is_edited=True)
