from rest_framework import serializers
from apps.vault.serializers import UserPublicSerializer
from .models import Challenge, Submission, Tournament, TournamentParticipant


class ChallengeSerializer(serializers.ModelSerializer):
    author = UserPublicSerializer(read_only=True)
    author_id = serializers.PrimaryKeyRelatedField(
        source='author',
        queryset=Challenge._meta.get_field('author').related_model.objects.all(),
        write_only=True,
        required=False,
    )
    # Never expose the actual flag in API responses
    flag = serializers.CharField(write_only=True)

    class Meta:
        model = Challenge
        fields = [
            'id', 'title', 'description', 'category', 'difficulty',
            'points', 'flag', 'author', 'author_id', 'hints', 'files',
            'is_active', 'solves_count', 'created_at', 'updated_at',
        ]
        read_only_fields = ['solves_count', 'created_at', 'updated_at']


class ChallengeListSerializer(serializers.ModelSerializer):
    """Lighter serializer for list views — no hints, no author details."""

    class Meta:
        model = Challenge
        fields = [
            'id', 'title', 'category', 'difficulty', 'points',
            'is_active', 'solves_count', 'created_at',
        ]


class FlagSubmitSerializer(serializers.Serializer):
    """Input for flag submission endpoint."""
    flag = serializers.CharField(max_length=500)


class SubmissionSerializer(serializers.ModelSerializer):
    user = UserPublicSerializer(read_only=True)
    challenge_title = serializers.CharField(source='challenge.title', read_only=True)

    class Meta:
        model = Submission
        fields = [
            'id', 'user', 'challenge', 'challenge_title',
            'flag_submitted', 'is_correct', 'submitted_at', 'ip_address',
        ]
        read_only_fields = ['is_correct', 'submitted_at', 'ip_address']
        extra_kwargs = {
            'flag_submitted': {'write_only': True},
        }


class TournamentParticipantSerializer(serializers.ModelSerializer):
    user = UserPublicSerializer(read_only=True)

    class Meta:
        model = TournamentParticipant
        fields = ['id', 'user', 'score', 'rank', 'joined_at']
        read_only_fields = ['score', 'rank', 'joined_at']


class TournamentSerializer(serializers.ModelSerializer):
    participants = TournamentParticipantSerializer(many=True, read_only=True)
    participant_count = serializers.ReadOnlyField()
    challenges = ChallengeListSerializer(many=True, read_only=True)
    challenge_ids = serializers.PrimaryKeyRelatedField(
        source='challenges',
        many=True,
        queryset=Challenge.objects.all(),
        write_only=True,
        required=False,
    )

    class Meta:
        model = Tournament
        fields = [
            'id', 'name', 'description', 'challenges', 'challenge_ids',
            'start_time', 'end_time', 'max_participants', 'status',
            'banner', 'participant_count', 'participants', 'created_at',
        ]
        read_only_fields = ['created_at']


class TournamentListSerializer(serializers.ModelSerializer):
    participant_count = serializers.ReadOnlyField()

    class Meta:
        model = Tournament
        fields = [
            'id', 'name', 'status', 'start_time', 'end_time',
            'max_participants', 'participant_count', 'created_at',
        ]
