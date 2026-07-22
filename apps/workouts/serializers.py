"""
Serializers for workout sessions
"""
# pyrefly: ignore [missing-import]
from rest_framework import serializers
# pyrefly: ignore [missing-import]
from django.utils import timezone
from .models import WorkoutSession, SessionParticipant, SessionRequest


class SessionParticipantSerializer(serializers.ModelSerializer):
    """
    Serializer for session participants (group workouts)
    """
    username = serializers.CharField(source='user.username', read_only=True)
    profile_picture = serializers.ImageField(source='user.profile.profile_picture', read_only=True)

    class Meta:
        model = SessionParticipant
        fields = ['id', 'user', 'username', 'profile_picture', 'status', 'joined_at']
        read_only_fields = ['session', 'joined_at']


class SessionRequestSerializer(serializers.ModelSerializer):
    """
    Serializer for session join requests
    """
    requester_username = serializers.CharField(source='requester.username', read_only=True)
    requester_profile = serializers.SerializerMethodField()

    class Meta:
        model = SessionRequest
        fields = [
            'id', 'requester', 'requester_username', 'requester_profile',
            'message', 'status', 'created_at', 'responded_at'
        ]
        read_only_fields = ['session', 'created_at', 'responded_at']

    def get_requester_profile(self, obj):
        # pyrefly: ignore [missing-import]
        from apps.users.serializers import PublicProfileSerializer
        if hasattr(obj.requester, 'profile'):
            return PublicProfileSerializer(obj.requester.profile).data
        return None


class WorkoutSessionSerializer(serializers.ModelSerializer):
    """
    Complete serializer for workout sessions
    """
    creator_name = serializers.CharField(source='creator.username', read_only=True)
    creator_profile = serializers.SerializerMethodField()
    participant_name = serializers.CharField(source='participant.username', read_only=True)
    participant_profile = serializers.SerializerMethodField()
    is_past = serializers.BooleanField(read_only=True)
    can_join = serializers.BooleanField(read_only=True)
    is_creator = serializers.SerializerMethodField()
    is_participant = serializers.SerializerMethodField()
    has_pending_request = serializers.SerializerMethodField()
    participants_list = SessionParticipantSerializer(
        source='participants',
        many=True,
        read_only=True
    )
    join_requests = SessionRequestSerializer(many=True, read_only=True)

    class Meta:
        model = WorkoutSession
        fields = [
            'id', 'title', 'description',
            'creator', 'creator_name', 'creator_profile',
            'participant', 'participant_name', 'participant_profile',
            'session_type', 'status',
            'scheduled_datetime', 'duration_minutes', 'location', 'intensity',
            'focus_areas', 'equipment_needed',
            'max_participants', 'current_participants',
            'participants_list', 'join_requests',
            'is_past', 'can_join', 'is_creator', 'is_participant',
            'has_pending_request', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['creator', 'current_participants', 'status', 'created_at', 'updated_at']

    def get_creator_profile(self, obj):
        # pyrefly: ignore [missing-import]
        from apps.users.serializers import PublicProfileSerializer
        if hasattr(obj.creator, 'profile'):
            return PublicProfileSerializer(obj.creator.profile).data
        return None

    def get_participant_profile(self, obj):
        # pyrefly: ignore [missing-import]
        from apps.users.serializers import PublicProfileSerializer
        if obj.participant and hasattr(obj.participant, 'profile'):
            return PublicProfileSerializer(obj.participant.profile).data
        return None

    def get_is_creator(self, obj):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            return obj.creator == request.user
        return False

    def get_is_participant(self, obj):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            user = request.user
            if obj.participant == user:
                return True
            # Also check group participants
            return obj.participants.filter(user=user, status='accepted').exists()
        return False

    def get_has_pending_request(self, obj):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            return obj.join_requests.filter(
                requester=request.user, status='pending'
            ).exists()
        return False

    def validate_scheduled_datetime(self, value):
        """Ensure scheduled datetime is in the future"""
        if value <= timezone.now():
            raise serializers.ValidationError(
                "Workout sessions must be scheduled in the future"
            )
        return value

    def validate_participant(self, value):
        """Prevent inviting self or blocked users"""
        request = self.context.get('request')
        if request and value == request.user:
            raise serializers.ValidationError("Cannot invite yourself to a session")
        return value


class CreateWorkoutSessionSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for creating workout sessions
    """
    class Meta:
        model = WorkoutSession
        fields = [
            'title', 'description', 'participant', 'session_type',
            'scheduled_datetime', 'duration_minutes', 'location', 'intensity',
            'focus_areas', 'equipment_needed', 'max_participants', 'notes'
        ]

    def validate_scheduled_datetime(self, value):
        """Ensure scheduled datetime is in the future"""
        if value <= timezone.now():
            raise serializers.ValidationError(
                "Workout sessions must be scheduled in the future"
            )
        return value


class WorkoutSessionListSerializer(serializers.ModelSerializer):
    """
    Minimal serializer for listing sessions
    """
    creator_name = serializers.CharField(source='creator.username', read_only=True)
    participant_name = serializers.CharField(source='participant.username', read_only=True)
    creator_picture = serializers.ImageField(source='creator.profile.profile_picture', read_only=True)
    is_past = serializers.BooleanField(read_only=True)
    spots_available = serializers.SerializerMethodField()

    class Meta:
        model = WorkoutSession
        fields = [
            'id', 'title', 'session_type', 'status', 'intensity',
            'creator_name', 'participant_name', 'creator_picture',
            'scheduled_datetime', 'duration_minutes', 'location',
            'focus_areas', 'max_participants', 'current_participants',
            'is_past', 'spots_available'
        ]

    def get_spots_available(self, obj):
        """Calculate spots available for group sessions"""
        if obj.session_type == 'group':
            return obj.max_participants - obj.current_participants
        return 1 if obj.participant is None else 0
