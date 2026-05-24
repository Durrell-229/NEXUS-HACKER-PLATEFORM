from django.contrib import admin
from .models import Tag, Article, Comment


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'color']
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ['name']


@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    list_display = ['title', 'author', 'published', 'views', 'likes', 'created_at']
    list_filter = ['published', 'tags']
    search_fields = ['title', 'content']
    prepopulated_fields = {'slug': ('title',)}
    raw_id_fields = ['author']
    filter_horizontal = ['tags', 'liked_by']
    readonly_fields = ['views', 'likes', 'created_at', 'updated_at']


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ['author', 'article', 'parent', 'is_edited', 'created_at']
    list_filter = ['is_edited']
    search_fields = ['content', 'author__username']
    raw_id_fields = ['author', 'article', 'parent']
