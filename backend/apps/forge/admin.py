from django.contrib import admin
from .models import CodeSnippet, CodeSession


@admin.register(CodeSnippet)
class CodeSnippetAdmin(admin.ModelAdmin):
    list_display = ['title', 'language', 'author', 'views', 'likes', 'is_public', 'created_at']
    list_filter = ['language', 'is_public']
    search_fields = ['title', 'description', 'author__username']
    raw_id_fields = ['author']
    readonly_fields = ['views', 'likes', 'created_at', 'updated_at']


@admin.register(CodeSession)
class CodeSessionAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'language', 'status', 'is_public', 'created_at']
    list_filter = ['language', 'status', 'is_public']
    search_fields = ['title', 'user__username']
    raw_id_fields = ['user']
    readonly_fields = ['session_id', 'created_at', 'updated_at']
