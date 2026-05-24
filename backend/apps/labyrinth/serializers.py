from rest_framework import serializers
from .models import Lab, LabSession


class LabSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lab
        fields = [
            'id', 'title', 'description', 'objective', 'difficulty',
            'technology', 'docker_image', 'port_range_start', 'port_range_end',
            'time_limit', 'environment_vars', 'is_active', 'created_at',
        ]
        read_only_fields = ['created_at']


class LabListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lab
        fields = ['id', 'title', 'difficulty', 'technology', 'time_limit', 'is_active', 'created_at']


class LabSessionSerializer(serializers.ModelSerializer):
    lab = LabListSerializer(read_only=True)
    lab_id = serializers.PrimaryKeyRelatedField(
        source='lab', queryset=Lab.objects.filter(is_active=True), write_only=True,
    )
    is_expired = serializers.BooleanField(read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = LabSession
        fields = [
            'id', 'username', 'lab', 'lab_id', 'container_id', 'port',
            'status', 'started_at', 'expires_at', 'stopped_at', 'is_expired',
        ]
        read_only_fields = ['container_id', 'port', 'status', 'started_at', 'expires_at', 'stopped_at']


class StartLabSerializer(serializers.Serializer):
    """Input for starting a lab — currently no extra params needed."""
    pass
