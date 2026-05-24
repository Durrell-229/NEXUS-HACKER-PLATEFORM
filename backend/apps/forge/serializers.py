from rest_framework import serializers
from apps.vault.serializers import UserPublicSerializer
from .models import CodeSnippet, CodeSession


class CodeSnippetSerializer(serializers.ModelSerializer):
    author = UserPublicSerializer(read_only=True)

    class Meta:
        model = CodeSnippet
        fields = [
            'id', 'title', 'description', 'code', 'language',
            'author', 'views', 'likes', 'is_public', 'tags',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['views', 'likes', 'created_at', 'updated_at']


class CodeSnippetListSerializer(serializers.ModelSerializer):
    author = UserPublicSerializer(read_only=True)

    class Meta:
        model = CodeSnippet
        fields = [
            'id', 'title', 'language', 'author', 'views',
            'likes', 'is_public', 'tags', 'created_at',
        ]


class CodeSessionSerializer(serializers.ModelSerializer):
    user = UserPublicSerializer(read_only=True)
    participants = UserPublicSerializer(many=True, read_only=True)

    class Meta:
        model = CodeSession
        fields = [
            'id', 'session_id', 'user', 'language', 'code', 'title',
            'is_public', 'status', 'participants', 'created_at', 'updated_at',
        ]
        read_only_fields = ['session_id', 'created_at', 'updated_at']


class CodeSessionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CodeSession
        fields = ['language', 'title', 'code', 'is_public']
