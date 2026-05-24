from rest_framework import serializers
from apps.vault.serializers import UserPublicSerializer
from .models import Tag, Article, Comment


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name', 'slug', 'color', 'description']
        read_only_fields = ['slug']


class CommentSerializer(serializers.ModelSerializer):
    author = UserPublicSerializer(read_only=True)
    replies = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = [
            'id', 'author', 'parent', 'content', 'likes',
            'is_edited', 'replies', 'created_at', 'updated_at',
        ]
        read_only_fields = ['likes', 'is_edited', 'created_at', 'updated_at']

    def get_replies(self, obj):
        # Only fetch top-level replies (depth 1) to avoid infinite recursion
        if obj.parent is None:
            return CommentSerializer(obj.replies.all(), many=True, context=self.context).data
        return []


class ArticleSerializer(serializers.ModelSerializer):
    author = UserPublicSerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(
        source='tags',
        many=True,
        queryset=Tag.objects.all(),
        write_only=True,
        required=False,
    )
    comments_count = serializers.SerializerMethodField()
    comments = CommentSerializer(many=True, read_only=True)

    class Meta:
        model = Article
        fields = [
            'id', 'title', 'slug', 'content', 'summary', 'cover_image',
            'author', 'tags', 'tag_ids', 'views', 'likes', 'published',
            'comments_count', 'comments', 'created_at', 'updated_at',
        ]
        read_only_fields = ['slug', 'views', 'likes', 'created_at', 'updated_at']

    def get_comments_count(self, obj):
        return obj.comments.filter(parent=None).count()

    def create(self, validated_data):
        from django.utils.text import slugify
        import uuid
        tags = validated_data.pop('tags', [])
        validated_data['slug'] = slugify(validated_data['title']) + '-' + str(uuid.uuid4())[:8]
        article = Article.objects.create(**validated_data)
        article.tags.set(tags)
        return article

    def update(self, instance, validated_data):
        tags = validated_data.pop('tags', None)
        instance = super().update(instance, validated_data)
        if tags is not None:
            instance.tags.set(tags)
        return instance


class ArticleListSerializer(serializers.ModelSerializer):
    author = UserPublicSerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)

    class Meta:
        model = Article
        fields = [
            'id', 'title', 'slug', 'summary', 'cover_image',
            'author', 'tags', 'views', 'likes', 'published', 'created_at',
        ]
