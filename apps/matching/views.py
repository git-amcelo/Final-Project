"""
Smart Matching Algorithm for Finding Compatible Workout Buddies
"""
# pyrefly: ignore [missing-import]
from rest_framework import views, permissions, status
# pyrefly: ignore [missing-import]
from rest_framework.response import Response
# pyrefly: ignore [missing-import]
from django.shortcuts import get_object_or_404

from apps.users.models import UserProfile
from apps.users.serializers import PublicProfileSerializer
from .serializers import (
    MatchRequestSerializer,
    MatchedUserSerializer,
    MatchingPreferencesSerializer,
    MatchCompatibilityDetailSerializer,
)
from .services import MatchingAlgorithm, find_matches_for_user


# ==================== Matching Views ====================

class FindBuddiesView(views.APIView):
    """
    Find compatible workout buddies using smart matching algorithm
    POST /api/matching/find-buddies/
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        # Get user's profile
        user_profile = getattr(request.user, 'profile', None)
        if not user_profile:
            return Response(
                {'error': 'Please complete your profile first'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Parse and validate filters
        filters = MatchRequestSerializer(data=request.data)
        filters.is_valid(raise_exception=True)

        matches, total_found = find_matches_for_user(
            request.user, filters.validated_data, limit=20
        )

        return Response({
            'matches': [
                {
                    'profile': PublicProfileSerializer(m['profile'], context={'request': request}).data,
                    'compatibility_score': m['compatibility_score'],
                    'match_reasons': m['match_reasons'],
                    'breakdown': m['breakdown'],
                }
                for m in matches
            ],
            'total_found': total_found
        })


class CompatibilityDetailView(views.APIView):
    """
    Get detailed compatibility breakdown with a specific user
    GET /api/matching/compatibility/{user_id}/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, user_id):
        # Get both profiles
        my_profile = getattr(request.user, 'profile', None)
        if not my_profile:
            return Response(
                {'error': 'Please complete your profile first'},
                status=status.HTTP_400_BAD_REQUEST
            )

        other_profile = get_object_or_404(
            UserProfile,
            user_id=user_id,
            is_visible=True
        )

        # Calculate compatibility
        algorithm = MatchingAlgorithm(my_profile)
        score, breakdown = algorithm.calculate_compatibility(other_profile)

        return Response({
            'user_id': user_id,
            'username': other_profile.user.username,
            'overall_score': score,
            'breakdown': breakdown,
            'recommendation': self._get_recommendation(score)
        })

    def _get_recommendation(self, score):
        """Get recommendation based on score"""
        if score >= 80:
            return "Excellent match! Highly compatible workout buddy."
        elif score >= 60:
            return "Good match with several shared interests."
        elif score >= 40:
            return "Moderate compatibility. Some shared interests."
        elif score >= 20:
            return "Low compatibility. Consider other matches."
        else:
            return "Very low compatibility. Different fitness profiles."


class MatchingPreferencesView(views.APIView):
    """
    Get or update user's matching preferences
    GET /api/matching/preferences/
    PUT/PATCH /api/matching/preferences/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Get user's current matching preferences (from profile)"""
        profile = getattr(request.user, 'profile', None)
        if not profile:
            return Response(
                {'error': 'Please complete your profile first'},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response({
            'preferred_genders': profile.preferred_genders,
            'availability': profile.availability,
            'gym_preferences': profile.gym_preferences,
            'fitness_goals': profile.fitness_goals,
            'interests': profile.interests
        })

    def put(self, request):
        """Update matching preferences"""
        profile = getattr(request.user, 'profile', None)
        if not profile:
            # Create profile if it doesn't exist
            profile = UserProfile.objects.create(user=request.user)

        serializer = MatchingPreferencesSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Update preferences
        for field in ['preferred_genders', 'availability', 'gym_preferences', 'interests']:
            if field in serializer.validated_data:
                setattr(profile, field, serializer.validated_data[field])

        profile.save()

        return Response(self.get(request).data)


class TopMatchesView(views.APIView):
    """
    Get top matches without additional filters
    GET /api/matching/top-matches/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Get top 10 matches based on profile alone"""
        user_profile = getattr(request.user, 'profile', None)
        if not user_profile:
            return Response(
                {'error': 'Please complete your profile first'},
                status=status.HTTP_400_BAD_REQUEST
            )

        matches, total_found = find_matches_for_user(request.user, limit=10)

        return Response({
            'matches': [
                {
                    'profile': PublicProfileSerializer(m['profile'], context={'request': request}).data,
                    'compatibility_score': m['compatibility_score'],
                    'match_reasons': m['match_reasons'],
                    'breakdown': m['breakdown'],
                }
                for m in matches
            ],
            'total_found': total_found
        })
