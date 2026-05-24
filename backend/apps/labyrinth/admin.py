from django.contrib import admin
from .models import Lab, LabSession


@admin.register(Lab)
class LabAdmin(admin.ModelAdmin):
    list_display = ['title', 'technology', 'difficulty', 'docker_image', 'time_limit', 'is_active']
    list_filter = ['technology', 'difficulty', 'is_active']
    search_fields = ['title', 'description', 'docker_image']


@admin.register(LabSession)
class LabSessionAdmin(admin.ModelAdmin):
    list_display = ['user', 'lab', 'status', 'port', 'started_at', 'expires_at']
    list_filter = ['status', 'lab__technology']
    search_fields = ['user__username', 'lab__title', 'container_id']
    raw_id_fields = ['user', 'lab']
    readonly_fields = ['started_at', 'stopped_at']
