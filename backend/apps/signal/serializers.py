from rest_framework import serializers
from apps.vault.serializers import UserPublicSerializer
from .models import Channel, Message


class MessageSerializer(serializers.ModelSerializer):
    author = UserPublicSerializer(read_only=True)
    reply_to_preview = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = [
            'id', 'channel', 'author', 'content', 'message_type',
            'code_language', 'file_url', 'reply_to', 'reply_to_preview',
            'reactions', 'is_edited', 'is_deleted', 'created_at', 'updated_at',
        ]
        read_only_fields = ['reactions', 'is_edited', 'is_deleted', 'created_at', 'updated_at']
        extra_kwargs = {'channel': {'required': False}}

    def get_reply_to_preview(self, obj):
        if obj.reply_to and not obj.reply_to.is_deleted:
            return {
                'id': obj.reply_to.id,
                'author': obj.reply_to.author.username,
                'content': obj.reply_to.content[:100],
            }
        return None


class MessageCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['content', 'message_type', 'code_language', 'file_url', 'reply_to']


class ChannelSerializer(serializers.ModelSerializer):
    creator = UserPublicSerializer(read_only=True)
    members = UserPublicSerializer(many=True, read_only=True)
    member_ids = serializers.PrimaryKeyRelatedField(
        source='members',
        many=True,
        write_only=True,
        required=False,
        queryset=Channel._meta.get_field('members').related_model.objects.all(),
    )
    member_count = serializers.ReadOnlyField()
    latest_message = serializers.SerializerMethodField()

    class Meta:
        model = Channel
        fields = [
            'id', 'name', 'slug', 'description', 'is_private',
            'creator', 'members', 'member_ids', 'member_count',
            'icon', 'latest_message', 'created_at',
        ]
        read_only_fields = ['slug', 'created_at']

    def get_latest_message(self, obj):
        msg = obj.messages.filter(is_deleted=False).last()
        if msg:
            return {
                'id': msg.id,
                'author': msg.author.username,
                'content': msg.content[:80],
                'created_at': msg.created_at,
            }
        return None

    def create(self, validated_data):
        from django.utils.text import slugify
        import uuid
        members = validated_data.pop('members', [])
        validated_data['slug'] = slugify(validated_data['name']) + '-' + str(uuid.uuid4())[:6]
        channel = Channel.objects.create(**validated_data)
        if members:
            channel.members.set(members)
        if validated_data.get('creator'):
            channel.members.add(validated_data['creator'])
        return channel


class ChannelListSerializer(serializers.ModelSerializer):
    member_count = serializers.ReadOnlyField()

    class Meta:
        model = Channel
        fields = ['id', 'name', 'slug', 'description', 'is_private', 'member_count', 'icon', 'created_at']
