from rest_framework import serializers
from .models import SystemLog, PlatformStats


class SystemLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemLog
        fields = ['id', 'level', 'message', 'source', 'extra', 'created_at']
        read_only_fields = ['created_at']


class PlatformStatsSerializer(serializers.ModelSerializer):
    submission_accuracy = serializers.SerializerMethodField()

    class Meta:
        model = PlatformStats
        fields = [
            'id', 'date', 'active_users', 'new_users', 'new_challenges',
            'submissions', 'correct_submissions', 'submission_accuracy',
            'lab_sessions_started', 'articles_published', 'snippets_shared',
            'messages_sent', 'timestamp',
        ]
        read_only_fields = ['timestamp']

    def get_submission_accuracy(self, obj):
        if obj.submissions == 0:
            return 0.0
        return round(obj.correct_submissions / obj.submissions * 100, 2)


class DashboardSummarySerializer(serializers.Serializer):
    """Aggregated overview for the admin dashboard."""
    total_users = serializers.IntegerField()
    total_challenges = serializers.IntegerField()
    total_submissions = serializers.IntegerField()
    total_lab_sessions = serializers.IntegerField()
    total_articles = serializers.IntegerField()
    total_snippets = serializers.IntegerField()
    total_messages = serializers.IntegerField()
    recent_logs = SystemLogSerializer(many=True)
    stats_last_7_days = PlatformStatsSerializer(many=True)
