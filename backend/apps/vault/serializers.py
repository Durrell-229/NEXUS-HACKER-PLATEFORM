from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import Trophy, UserStats

User = get_user_model()


class TrophySerializer(serializers.ModelSerializer):
    class Meta:
        model = Trophy
        fields = ['id', 'name', 'description', 'icon', 'rarity', 'earned_at']
        read_only_fields = ['earned_at']


class UserStatsSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserStats
        fields = [
            'challenges_solved', 'ctf_wins', 'code_battles_won',
            'total_submissions', 'articles_written', 'snippets_shared',
        ]


class UserPublicSerializer(serializers.ModelSerializer):
    """Read-only public profile — safe to expose to anyone."""
    avatar_url = serializers.ReadOnlyField()
    trophies = TrophySerializer(many=True, read_only=True)
    stats = UserStatsSerializer(read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'avatar_url', 'bio', 'github_url',
            'xp_points', 'level', 'rank', 'is_verified',
            'trophies', 'stats', 'date_joined',
        ]


class UserPrivateSerializer(serializers.ModelSerializer):
    """Full profile visible only to the owner."""
    avatar_url = serializers.ReadOnlyField()
    trophies = TrophySerializer(many=True, read_only=True)
    stats = UserStatsSerializer(read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'avatar', 'avatar_url', 'bio',
            'github_url', 'website_url', 'xp_points', 'level', 'rank',
            'is_verified', 'two_factor_enabled', 'last_seen',
            'trophies', 'stats', 'date_joined',
        ]
        read_only_fields = [
            'xp_points', 'level', 'rank', 'is_verified', 'last_seen', 'date_joined',
        ]


class UserUpdateSerializer(serializers.ModelSerializer):
    """Partial update — only editable fields."""

    class Meta:
        model = User
        fields = ['username', 'avatar', 'bio', 'github_url', 'website_url']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm']

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({'password_confirm': 'Passwords do not match.'})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
        )
        UserStats.objects.get_or_create(user=user)
        return user


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({'new_password_confirm': 'Passwords do not match.'})
        return attrs


class LeaderboardSerializer(serializers.ModelSerializer):
    """Lightweight serializer for leaderboard listings."""
    avatar_url = serializers.ReadOnlyField()
    stats = UserStatsSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'avatar_url', 'xp_points', 'level', 'rank', 'stats']
