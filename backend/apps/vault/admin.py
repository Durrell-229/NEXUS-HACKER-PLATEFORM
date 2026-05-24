from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from .models import User, Trophy, UserStats


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'rank', 'level', 'xp_points', 'is_verified', 'is_staff']
    list_filter = ['rank', 'is_verified', 'is_staff', 'is_active']
    search_fields = ['username', 'email']
    ordering = ['-xp_points']
    readonly_fields = ['last_seen', 'date_joined', 'last_login']

    fieldsets = BaseUserAdmin.fieldsets + (
        (_('NEXUS Profile'), {
            'fields': ('avatar', 'bio', 'github_url', 'website_url'),
        }),
        (_('Gamification'), {
            'fields': ('xp_points', 'level', 'rank'),
        }),
        (_('Security'), {
            'fields': ('is_verified', 'two_factor_enabled'),
        }),
        (_('Activity'), {
            'fields': ('last_seen',),
        }),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        (_('Profile'), {
            'fields': ('email',),
        }),
    )


@admin.register(Trophy)
class TrophyAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'rarity', 'earned_at']
    list_filter = ['rarity']
    search_fields = ['name', 'user__username']
    raw_id_fields = ['user']


@admin.register(UserStats)
class UserStatsAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'challenges_solved', 'ctf_wins',
        'code_battles_won', 'total_submissions',
    ]
    search_fields = ['user__username']
    raw_id_fields = ['user']
