"""
Serializers for workout groups
"""
# pyrefly: ignore [missing-import]
from rest_framework import serializers
# pyrefly: ignore [missing-import]
from django.utils.text import slugify
from .models import WorkoutGroup, GroupMembership, GroupSession, GroupSessionAttendance


class GroupMembershipSerializer(serializers.ModelSerializer):
    """
    Serializer for group membership
    """
    username = serializers.CharField(source='user.username', read_only=True)
    user_profile = serializers.SerializerMethodField()

    class Meta:
        model = GroupMembership
        fields = [
            'id', 'user', 'username', 'user_profile', 'role', 'status',
            'joined_at', 'last_active', 'message'
        ]
        read_only_fields = ['joined_at', 'last_active']

    def get_user_profile(self, obj):
        # pyrefly: ignore [missing-import]
        from apps.users.serializers import PublicProfileSerializer
        if hasattr(obj.user, 'profile'):
            return PublicProfileSerializer(obj.user.profile).data
        return None


class WorkoutGroupSerializer(serializers.ModelSerializer):
    """
    Complete serializer for workout groups
    """
    creator_name = serializers.CharField(source='creator.username', read_only=True)
    creator_profile = serializers.SerializerMethodField()
    member_count_actual = serializers.IntegerField(read_only=True)
    members_list = GroupMembershipSerializer(
        source='members',
        many=True,
        read_only=True
    )
    group_image_url = serializers.SerializerMethodField()
    is_member = serializers.SerializerMethodField()
    user_role = serializers.SerializerMethodField()
    is_creator = serializers.SerializerMethodField()

    class Meta:
        model = WorkoutGroup
        fields = [
            'id', 'name', 'slug', 'description', 'tagline',
            'group_type', 'max_members', 'member_count', 'member_count_actual',
            'focus_areas', 'workout_frequency',
            'primary_location', 'meeting_days', 'typical_time',
            'fitness_level_required', 'equipment_needed', 'requirements',
            'group_image', 'group_image_url',
            'creator', 'creator_name', 'creator_profile',
            'session_count', 'is_active', 'is_featured',
            'members_list', 'is_member', 'user_role', 'is_creator',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['creator', 'member_count', 'session_count', 'created_at', 'updated_at']

    def get_creator_profile(self, obj):
        # pyrefly: ignore [missing-import]
        from apps.users.serializers import PublicProfileSerializer
        if hasattr(obj.creator, 'profile'):
            return PublicProfileSerializer(obj.creator.profile).data
        return None

    def get_group_image_url(self, obj):
        if obj.group_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.group_image.url)
        return None

    def get_is_member(self, obj):
        """Check if current user is a member"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return GroupMembership.objects.filter(
                group=obj,
                user=request.user,
                status='active'
            ).exists()
        return False

    def get_user_role(self, obj):
        """Get user's role in the group"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            membership = GroupMembership.objects.filter(
                group=obj,
                user=request.user,
                status='active'
            ).first()
            if membership:
                return membership.role
        return None

    def get_is_creator(self, obj):
        """Check if current user is the group creator"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.creator == request.user
        return False



class CreateWorkoutGroupSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for creating groups
    """
    # Allow frontend field names and map them to backend fields
    location = serializers.CharField(required=False, write_only=True)
    skill_level = serializers.CharField(required=False, write_only=True)
    is_private = serializers.BooleanField(required=False, write_only=True)
    interests = serializers.ListField(required=False, write_only=True)

    class Meta:
        model = WorkoutGroup
        fields = [
            'name', 'description', 'tagline', 'group_type', 'max_members',
            'focus_areas', 'workout_frequency',
            'primary_location', 'location', 'meeting_days', 'typical_time',
            'fitness_level_required', 'skill_level',
            'equipment_needed', 'requirements', 'group_image',
            'is_private', 'interests'
        ]
        extra_kwargs = {
            'primary_location': {'required': False},
            'fitness_level_required': {'required': False},
        }

    def validate(self, attrs):
        # Map frontend field names to backend field names
        if 'location' in attrs:
            attrs['primary_location'] = attrs.pop('location')
        if 'skill_level' in attrs:
            attrs['fitness_level_required'] = attrs.pop('skill_level')
        if 'is_private' in attrs:
            is_private = attrs.pop('is_private')
            attrs['group_type'] = 'closed' if is_private else 'open'
        if 'interests' in attrs:
            attrs['focus_areas'] = attrs.pop('interests')
        return attrs

    def create(self, validated_data):
        # Generate unique slug from name
        name = validated_data.get('name')
        base_slug = slugify(name, allow_unicode=True)
        slug = base_slug
        counter = 1
        while WorkoutGroup.objects.filter(slug=slug).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1
        validated_data['slug'] = slug

        # Ensure creator is set
        validated_data['creator'] = self.context['request'].user

        group = WorkoutGroup.objects.create(**validated_data)
        # Creator becomes admin member
        GroupMembership.objects.create(
            group=group,
            user=self.context['request'].user,
            role='admin',
            status='active'
        )
        return group


class WorkoutGroupListSerializer(serializers.ModelSerializer):
    """
    Minimal serializer for listing groups
    """
    creator_name = serializers.CharField(source='creator.username', read_only=True)
    member_count_actual = serializers.SerializerMethodField()
    group_image_url = serializers.SerializerMethodField()
    is_member = serializers.SerializerMethodField()

    class Meta:
        model = WorkoutGroup
        fields = [
            'id', 'name', 'slug', 'description', 'tagline', 'group_type',
            'member_count', 'member_count_actual', 'max_members',
            'focus_areas', 'primary_location', 'workout_frequency',
            'session_count', 'group_image_url', 'is_member', 'is_featured', 'created_at',
            'creator_name'
        ]

    def get_member_count_actual(self, obj):
        return obj.members.filter(status='active').count()

    def get_group_image_url(self, obj):
        if obj.group_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.group_image.url)
        return None

    def get_is_member(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return GroupMembership.objects.filter(
                group=obj,
                user=request.user,
                status='active'
            ).exists()
        return False


class GroupSessionSerializer(serializers.ModelSerializer):
    """
    Serializer for group sessions
    """
    group_name = serializers.CharField(source='group.name', read_only=True)
    creator_name = serializers.CharField(source='created_by.username', read_only=True)
    attendee_count = serializers.SerializerMethodField()
    is_attending = serializers.SerializerMethodField()

    class Meta:
        model = GroupSession
        fields = [
            'id', 'group', 'group_name', 'title', 'description',
            'scheduled_datetime', 'duration_minutes', 'location',
            'max_attendees', 'current_attendees', 'attendee_count',
            'is_recurring', 'recurring_pattern',
            'is_attending', 'created_at', 'created_by', 'creator_name'
        ]
        read_only_fields = ['current_attendees', 'created_at', 'created_by']

    def get_attendee_count(self, obj):
        return obj.attendances.filter(status__in=['going', 'attended']).count()

    def get_is_attending(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            attendance = GroupSessionAttendance.objects.filter(
                session=obj,
                user=request.user
            ).first()
            if attendance:
                return attendance.status
        return False


class CreateGroupSessionSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for creating group sessions
    """
    class Meta:
        model = GroupSession
        fields = [
            'title', 'description', 'scheduled_datetime',
            'duration_minutes', 'location', 'max_attendees',
            'is_recurring', 'recurring_pattern'
        ]

    def validate_group(self, value):
        """Ensure user is admin/mod of the group"""
        request = self.context.get('request')
        membership = GroupMembership.objects.filter(
            group=value,
            user=request.user,
            status='active',
            role__in=['admin', 'moderator']
        ).exists()

        if not membership:
            raise serializers.ValidationError(
                "You must be an admin or moderator to create sessions"
            )
        return value


class GroupSessionAttendanceSerializer(serializers.ModelSerializer):
    """
    Serializer for session attendance
    """
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = GroupSessionAttendance
        fields = ['id', 'user', 'username', 'status', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']
