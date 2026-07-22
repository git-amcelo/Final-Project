"""
Serializers for User Authentication and Profile Management
"""
# pyrefly: ignore [missing-import]
from rest_framework import serializers
# pyrefly: ignore [missing-import]
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
# pyrefly: ignore [missing-import]
from django.contrib.auth.password_validation import validate_password
from .models import User, UserProfile, BlockedUser, FavoriteUser


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT token serializer with additional user data
    """
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims
        token['username'] = user.username
        token['email'] = user.email
        token['role'] = user.role
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        # Add additional user info to response
        data['user'] = {
            'id': self.user.id,
            'username': self.user.username,
            'email': self.user.email,
            'role': self.user.role,
            'has_profile': hasattr(self.user, 'profile'),
        }
        return data


class RegisterSerializer(serializers.ModelSerializer):
    """
    User registration serializer
    """
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    gender = serializers.ChoiceField(
        choices=UserProfile.GENDER_CHOICES,
        write_only=True,
        required=False,
        allow_blank=True,
    )

    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password_confirm',
            'first_name', 'last_name', 'role', 'student_id', 'phone', 'gender'
        ]
        extra_kwargs = {
            'first_name': {'required': False, 'allow_blank': True},
            'last_name': {'required': False, 'allow_blank': True},
            'student_id': {'required': False, 'allow_blank': True},
            'phone': {'required': False, 'allow_blank': True},
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                'password': "Password fields didn't match."
            })
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')

        if 'first_name' in validated_data and not validated_data['first_name']:
            validated_data.pop('first_name')
        if 'last_name' in validated_data and not validated_data['last_name']:
            validated_data.pop('last_name')

        email = validated_data.get('email')
        if email:
            validated_data['email'] = email.lower().strip()

        gender = validated_data.pop('gender', '')

        user = User.objects.create_user(
            password=password,
            **validated_data,
        )
        UserProfile.objects.create(user=user, gender=gender)
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Complete profile serializer including user data
    """
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name', required=False)
    last_name = serializers.CharField(source='user.last_name', required=False)
    role = serializers.CharField(source='user.role', read_only=True)
    profile_picture_url = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'role',
            'bio', 'profile_picture', 'profile_picture_url',
            'gender', 'fitness_level', 'fitness_goals',
            'preferred_genders', 'availability', 'gym_preferences',
            'interests', 'certifications',
            'average_rating', 'total_ratings',
            'joined_date', 'last_active', 'is_visible'
        ]
        read_only_fields = [
            'id', 'average_rating', 'total_ratings', 
            'joined_date', 'last_active'
        ]

    def get_profile_picture_url(self, obj):
        if obj.profile_picture:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_picture.url)
        return None

    def update(self, instance, validated_data):
        user_fields = ['first_name', 'last_name', 'email', 'phone']
        nested_user_data = {}

        for field in user_fields:
            if field in validated_data:
                nested_user_data[field] = validated_data.pop(field)

        for attr, value in nested_user_data.items():
            if attr == 'email' and value:
                value = value.lower().strip()
            setattr(instance.user, attr, value)
        instance.user.save()

        # Update profile fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class PublicProfileSerializer(serializers.ModelSerializer):
    """
    Public profile with limited information (for other users to view)
    """
    username = serializers.CharField(source='user.username', read_only=True)
    profile_picture_url = serializers.SerializerMethodField()
    fitness_goals_display = serializers.SerializerMethodField()

    user_id = serializers.IntegerField(source='user.id', read_only=True)

    class Meta:
        model = UserProfile
        fields = [
            'id', 'user_id', 'username', 'bio', 'profile_picture', 'profile_picture_url',
            'fitness_level', 'fitness_goals', 'fitness_goals_display',
            'interests', 'average_rating', 'total_ratings', 'joined_date'
        ]

    def get_profile_picture_url(self, obj):
        if obj.profile_picture:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_picture.url)
        return None

    def get_fitness_goals_display(self, obj):
        """Get display names for fitness goals"""
        goal_dict = dict(UserProfile.GOAL_CHOICES)
        return [goal_dict.get(goal, goal) for goal in obj.fitness_goals]


class BlockedUserSerializer(serializers.ModelSerializer):
    """
    Serializer for blocked users
    """
    blocked_username = serializers.CharField(source='blocked.username', read_only=True)
    blocked_profile = PublicProfileSerializer(source='blocked.profile', read_only=True)

    class Meta:
        model = BlockedUser
        fields = ['id', 'blocked', 'blocked_username', 'blocked_profile', 'created_at', 'reason']
        read_only_fields = ['blocker', 'created_at']


class FavoriteUserSerializer(serializers.ModelSerializer):
    """
    Serializer for favorite users
    """
    favorite_username = serializers.CharField(source='favorite.username', read_only=True)
    favorite_profile = PublicProfileSerializer(source='favorite.profile', read_only=True)

    class Meta:
        model = FavoriteUser
        fields = ['id', 'favorite', 'favorite_username', 'favorite_profile', 'created_at', 'notes']
        read_only_fields = ['user', 'created_at']


class UserListSerializer(serializers.ModelSerializer):
    """
    Minimal user serializer for lists/search results
    """
    username = serializers.CharField(source='user.username', read_only=True)
    profile_picture_url = serializers.SerializerMethodField()
    compatibility_score = serializers.FloatField(required=False)

    class Meta:
        model = UserProfile
        fields = [
            'id', 'username', 'profile_picture', 'profile_picture_url',
            'fitness_level', 'fitness_goals', 'average_rating',
            'compatibility_score'
        ]

    def get_profile_picture_url(self, obj):
        if obj.profile_picture:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_picture.url)
        return None
