"""
Serializers for smart matching algorithm
"""
# pyrefly: ignore [missing-import]
from rest_framework import serializers


class MatchRequestSerializer(serializers.Serializer):
    """
    Serializer for matching request parameters
    All fields are optional - more filters = more specific results
    """
    fitness_level = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    gender = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    goals = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        allow_null=True
    )
    availability_day = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    location = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    interests = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        allow_null=True
    )
    min_rating = serializers.FloatField(required=False, allow_null=True, min_value=0, max_value=5)
    max_distance = serializers.IntegerField(required=False, allow_null=True)  # For future geolocation


class MatchedUserSerializer(serializers.Serializer):
    """
    Serializer for matched user with compatibility score
    """
    id = serializers.IntegerField()
    username = serializers.CharField()
    bio = serializers.CharField(allow_blank=True, allow_null=True)
    profile_picture = serializers.ImageField(allow_null=True)
    profile_picture_url = serializers.CharField(allow_null=True)
    fitness_level = serializers.CharField()
    fitness_goals = serializers.ListField()
    interests = serializers.ListField()
    average_rating = serializers.FloatField()
    compatibility_score = serializers.FloatField()
    match_reasons = serializers.ListField()
    location = serializers.CharField(allow_null=True)


class MatchingPreferencesSerializer(serializers.Serializer):
    """
    Serializer for user's matching preferences
    """
    preferred_genders = serializers.ListField(required=False)
    availability = serializers.DictField(required=False)
    gym_preferences = serializers.ListField(required=False)
    fitness_level_preference = serializers.CharField(required=False)
    goal_priorities = serializers.ListField(required=False)


class MatchCompatibilityDetailSerializer(serializers.Serializer):
    """
    Detailed compatibility breakdown
    """
    overall_score = serializers.IntegerField()
    fitness_level_match = serializers.DictField()
    goals_overlap = serializers.DictField()
    availability_match = serializers.DictField()
    location_match = serializers.DictField()
    interests_overlap = serializers.DictField()
    rating_factor = serializers.DictField()
