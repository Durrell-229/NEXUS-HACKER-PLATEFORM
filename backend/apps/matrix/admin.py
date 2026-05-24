from django.contrib import admin
from .models import SystemLog, PlatformStats


@admin.register(SystemLog)
class SystemLogAdmin(admin.ModelAdmin):
    list_display = ['level', 'source', 'message_preview', 'created_at']
    list_filter = ['level', 'source']
    search_fields = ['message', 'source']
    readonly_fields = ['created_at']

    def message_preview(self, obj):
        return obj.message[:80]
    message_preview.short_description = 'Message'


@admin.register(PlatformStats)
class PlatformStatsAdmin(admin.ModelAdmin):
    list_display = [
        'date', 'active_users', 'new_users', 'submissions',
        'correct_submissions', 'messages_sent', 'timestamp',
    ]
    ordering = ['-date']
    readonly_fields = ['timestamp']
