from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


class Tag(models.Model):
    """Reusable tag for articles, snippets, etc."""
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(max_length=60, unique=True)
    color = models.CharField(max_length=7, default='#6366f1', help_text='Hex color code')
    description = models.CharField(max_length=200, blank=True)

    class Meta:
        ordering = ['name']
        verbose_name = _('Tag')
        verbose_name_plural = _('Tags')

    def __str__(self):
        return self.name


class Article(models.Model):
    """Knowledge base article / wiki entry."""

    title = models.CharField(max_length=300)
    slug = models.SlugField(max_length=320, unique=True)
    content = models.TextField()
    summary = models.CharField(max_length=500, blank=True)
    cover_image = models.URLField(blank=True, null=True)
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='articles',
    )
    tags = models.ManyToManyField(Tag, blank=True, related_name='articles')
    views = models.PositiveIntegerField(default=0)
    likes = models.PositiveIntegerField(default=0)
    liked_by = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        blank=True,
        related_name='liked_articles',
    )
    published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = _('Article')
        verbose_name_plural = _('Articles')

    def __str__(self):
        status = 'Published' if self.published else 'Draft'
        return f'{self.title} [{status}]'


class Comment(models.Model):
    """Comment on a knowledge base article."""

    article = models.ForeignKey(
        Article,
        on_delete=models.CASCADE,
        related_name='comments',
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='codex_comments',
    )
    parent = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name='replies',
    )
    content = models.TextField(max_length=2000)
    likes = models.PositiveIntegerField(default=0)
    is_edited = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']
        verbose_name = _('Comment')
        verbose_name_plural = _('Comments')

    def __str__(self):
        return f'Comment by {self.author.username} on "{self.article.title}"'
