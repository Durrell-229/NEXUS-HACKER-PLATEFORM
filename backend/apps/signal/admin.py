from django.contrib import admin
from .models import Channel, Message


@admin.register(Channel)
class ChannelAdmin(admin.ModelAdmin):
    list_display = ['name', 'creator', 'is_private', 'member_count', 'created_at']
    list_filter = ['is_private']
    search_fields = ['name', 'description']
    raw_id_fields = ['creator']
    filter_horizontal = ['members']
    readonly_fields = ['created_at']


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['author', 'channel', 'message_type', 'is_edited', 'is_deleted', 'created_at']
    list_filter = ['message_type', 'is_edited', 'is_deleted', 'channel']
    search_fields = ['content', 'author__username', 'channel__name']
    raw_id_fields = ['author', 'channel', 'reply_to']
    readonly_fields = ['created_at', 'updated_at']
