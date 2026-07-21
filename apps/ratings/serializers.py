"""
Serializers for user ratings
"""
# pyrefly: ignore [missing-import]
from rest_framework import serializers
from .models import Rating


class RatingSerializer(serializers.ModelSerializer):
    """
    Complete serializer for ratings
    """
    from_user_name = serializers.CharField(source='from_user.username', read_only=True)
    to_user_name = serializers.CharField(source='to_user.username', read_only=True)
    from_user_profile = serializers.SerializerMethodField()
    to_user_profile = serializers.SerializerMethodField()
    session_title = serializers.CharField(source='session.title', read_only=True)
    group_name = serializers.CharField(source='group.name', read_only=True)

    class Meta:
        model = Rating
        fields = [
            'id', 'from_user', 'from_user_name', 'from_user_profile',
            'to_user', 'to_user_name', 'to_user_profile',
            'session', 'session_title', 'group', 'group_name',
            'score', 'punctuality', 'communication', 'effort', 'knowledge',
            'comment', 'would_workout_again',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['from_user', 'created_at', 'updated_at']

    def get_from_user_profile(self, obj):
        from apps.users.serializers import PublicProfileSerializer
        if hasattr(obj.from_user, 'profile'):
            return PublicProfileSerializer(obj.from_user.profile).data
        return None

    def get_to_user_profile(self, obj):
        from apps.users.serializers import PublicProfileSerializer
        if hasattr(obj.to_user, 'profile'):
            return PublicProfileSerializer(obj.to_user.profile).data
        return None

    def validate(self, data):
        """
        Validate rating data
        """
        from_user = self.context['request'].user
        to_user = data.get('to_user')

        # Cannot rate self
        if to_user and from_user == to_user:
            raise serializers.ValidationError("Cannot rate yourself")

        # Check if session is provided and unique constraint
        session = data.get('session')
        if session:
            existing = Rating.objects.filter(
                from_user=from_user,
                to_user=to_user,
                session=session
            ).exists()
            if existing and self.instance is None:
                raise serializers.ValidationError(
                    "You have already rated this user for this session"
                )

        return data


class CreateRatingSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for creating ratings
    """
    class Meta:
        model = Rating
        fields = [
            'to_user', 'session', 'group', 'score',
            'punctuality', 'communication', 'effort', 'knowledge',
            'comment', 'would_workout_again'
        ]

    def validate_to_user(self, value):
        """Prevent rating self"""
        if value == self.context['request'].user:
            raise serializers.ValidationError("Cannot rate yourself")
        return value


class RatingSummarySerializer(serializers.Serializer):
    """
    Serializer for rating summary statistics
    """
    total_ratings = serializers.IntegerField()
    average_score = serializers.FloatField()
    score_distribution = serializers.DictField()
    would_workout_again_percentage = serializers.FloatField()
