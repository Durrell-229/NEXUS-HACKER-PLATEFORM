from django.contrib import admin
from .models import Challenge, Submission, Tournament, TournamentParticipant


@admin.register(Challenge)
class ChallengeAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'difficulty', 'points', 'solves_count', 'is_active', 'created_at']
    list_filter = ['category', 'difficulty', 'is_active']
    search_fields = ['title', 'description']
    readonly_fields = ['solves_count', 'created_at', 'updated_at']
    raw_id_fields = ['author']


@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = ['user', 'challenge', 'is_correct', 'submitted_at', 'ip_address']
    list_filter = ['is_correct', 'challenge__category']
    search_fields = ['user__username', 'challenge__title']
    raw_id_fields = ['user', 'challenge']


class TournamentParticipantInline(admin.TabularInline):
    model = TournamentParticipant
    extra = 0
    raw_id_fields = ['user']


@admin.register(Tournament)
class TournamentAdmin(admin.ModelAdmin):
    list_display = ['name', 'status', 'start_time', 'end_time', 'max_participants']
    list_filter = ['status']
    search_fields = ['name']
    inlines = [TournamentParticipantInline]
    filter_horizontal = ['challenges']
