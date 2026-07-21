"""
Service layer for the buddy-matching algorithm.

Extracted from FindBuddiesView so both the DRF API and the Django
template-site views can run the exact same scoring/candidate logic.
"""
# pyrefly: ignore [missing-import]
from django.db.models import Q

from apps.users.models import UserProfile, BlockedUser


class MatchingAlgorithm:
    """
    Smart matching algorithm with weighted scoring
    Calculates compatibility between users based on multiple factors
    """

    # Weight configuration for each factor (total = 100)
    WEIGHTS = {
        'fitness_level': 20,      # Same fitness level
        'goals_overlap': 30,        # Shared fitness goals
        'availability': 25,         # Matching availability
        'location': 15,             # Same gym/location preference
        'interests': 10,            # Shared interests
    }

    def __init__(self, user_profile):
        self.user_profile = user_profile

    def calculate_compatibility(self, other_profile):
        """
        Calculate overall compatibility score (0-100)
        Returns tuple: (score, breakdown)
        """
        score = 0
        breakdown = {}

        # 1. Fitness Level Match (20 points)
        fitness_score, fitness_details = self._fitness_level_match(other_profile)
        score += fitness_score
        breakdown['fitness_level'] = fitness_details

        # 2. Goals Overlap (30 points)
        goals_score, goals_details = self._goals_overlap(other_profile)
        score += goals_score
        breakdown['goals'] = goals_details

        # 3. Availability Match (25 points)
        availability_score, availability_details = self._availability_match(other_profile)
        score += availability_score
        breakdown['availability'] = availability_details

        # 4. Location/Gym Preference (15 points)
        location_score, location_details = self._location_match(other_profile)
        score += location_score
        breakdown['location'] = location_details

        # 5. Interests Overlap (10 points)
        interests_score, interests_details = self._interests_overlap(other_profile)
        score += interests_score
        breakdown['interests'] = interests_details

        return min(score, 100), breakdown

    def _fitness_level_match(self, other):
        """Check if fitness levels match"""
        if self.user_profile.fitness_level == other.fitness_level:
            details = {
                'matched': True,
                'level': other.fitness_level,
                'points': self.WEIGHTS['fitness_level'],
                'reason': f"Same fitness level: {other.get_fitness_level_display()}"
            }
            return self.WEIGHTS['fitness_level'], details

        # Partial match for adjacent levels
        levels = ['beginner', 'intermediate', 'advanced']
        try:
            my_idx = levels.index(self.user_profile.fitness_level)
            other_idx = levels.index(other.fitness_level)
            if abs(my_idx - other_idx) == 1:
                details = {
                    'matched': True,
                    'level': other.fitness_level,
                    'points': self.WEIGHTS['fitness_level'] // 2,
                    'reason': f"Similar fitness level: {other.get_fitness_level_display()}"
                }
                return self.WEIGHTS['fitness_level'] // 2, details
        except ValueError:
            pass

        details = {
            'matched': False,
            'level': other.fitness_level,
            'points': 0,
            'reason': f"Different fitness levels"
        }
        return 0, details

    def _goals_overlap(self, other):
        """Calculate goal overlap score"""
        my_goals = set(self.user_profile.fitness_goals or [])
        their_goals = set(other.fitness_goals or [])

        if not my_goals or not their_goals:
            details = {
                'overlap': [],
                'points': 0,
                'reason': "No goals specified"
            }
            return 0, details

        overlap = my_goals & their_goals
        overlap_count = len(overlap)

        if overlap_count > 0:
            points = min(overlap_count * 10, self.WEIGHTS['goals_overlap'])
            details = {
                'overlap': list(overlap),
                'points': points,
                'reason': f"Shared goals: {', '.join(overlap)}"
            }
            return points, details

        details = {
            'overlap': [],
            'points': 0,
            'reason': "No shared goals"
        }
        return 0, details

    def _availability_match(self, other):
        """Calculate availability overlap"""
        my_availability = self.user_profile.availability or {}
        their_availability = other.availability or {}

        if not my_availability or not their_availability:
            details = {
                'overlap_days': [],
                'points': 0,
                'reason': "Availability not specified"
            }
            return 0, details

        overlap_days = []
        for day, my_times in my_availability.items():
            their_times = their_availability.get(day, [])
            if my_times and their_times:
                # Check for time overlap
                time_overlap = set(my_times) & set(their_times)
                if time_overlap:
                    overlap_days.append(day)

        if overlap_days:
            points = min(len(overlap_days) * 5, self.WEIGHTS['availability'])
            details = {
                'overlap_days': overlap_days,
                'points': points,
                'reason': f"Available on: {', '.join(overlap_days)}"
            }
            return points, details

        details = {
            'overlap_days': [],
            'points': 0,
            'reason': "No matching availability"
        }
        return 0, details

    def _location_match(self, other):
        """Check gym/location preference overlap"""
        my_gyms = set(self.user_profile.gym_preferences or [])
        their_gyms = set(other.gym_preferences or [])

        if not my_gyms or not their_gyms:
            details = {
                'matched_gyms': [],
                'points': 0,
                'reason': "Gym preferences not specified"
            }
            return 0, details

        matched_gyms = my_gyms & their_gyms

        if matched_gyms:
            points = min(len(matched_gyms) * 8, self.WEIGHTS['location'])
            details = {
                'matched_gyms': list(matched_gyms),
                'points': points,
                'reason': f"Shared gyms: {', '.join(matched_gyms)}"
            }
            return points, details

        details = {
            'matched_gyms': [],
            'points': 0,
            'reason': "Different gym preferences"
        }
        return 0, details

    def _interests_overlap(self, other):
        """Calculate interests overlap"""
        my_interests = set(self.user_profile.interests or [])
        their_interests = set(other.interests or [])

        if not my_interests or not their_interests:
            details = {
                'overlap': [],
                'points': 0,
                'reason': "Interests not specified"
            }
            return 0, details

        overlap = my_interests & their_interests

        if overlap:
            points = min(len(overlap) * 5, self.WEIGHTS['interests'])
            details = {
                'overlap': list(overlap),
                'points': points,
                'reason': f"Shared interests: {', '.join(overlap)}"
            }
            return points, details

        details = {
            'overlap': [],
            'points': 0,
            'reason': "No shared interests"
        }
        return 0, details


def find_matches_for_user(user, filters=None, limit=20):
    """
    Score and rank compatible workout buddies for `user`.

    `filters` mirrors MatchRequestSerializer.validated_data: optional
    fitness_level, gender, min_rating, goals, interests, location.

    Returns (matches, total_found):
    - matches: top `limit` results, each
      {'profile': UserProfile, 'compatibility_score': int,
       'match_reasons': [str], 'breakdown': dict}
    - total_found: count of all positive-score matches before slicing
      to `limit` (matches the API's existing semantics).
    """
    filters = filters or {}
    user_profile = getattr(user, 'profile', None)
    if not user_profile:
        return [], 0

    blocked_ids = BlockedUser.objects.filter(
        blocker=user
    ).values_list('blocked_id', flat=True)

    queryset = UserProfile.objects.filter(
        is_visible=True
    ).exclude(
        Q(user_id__in=blocked_ids) | Q(user_id=user.id)
    ).select_related('user')

    if filters.get('fitness_level') and str(filters['fitness_level']).strip():
        queryset = queryset.filter(fitness_level=filters['fitness_level'])

    if filters.get('gender') and str(filters['gender']).strip():
        queryset = queryset.filter(gender=filters['gender'])

    if filters.get('min_rating'):
        queryset = queryset.filter(average_rating__gte=filters['min_rating'])

    algorithm = MatchingAlgorithm(user_profile)
    matches = []

    target_goals = filters.get('goals') or []
    target_interests = filters.get('interests') or []
    target_location = filters.get('location') or ''
    target_location = str(target_location).strip().lower()

    # Slice candidates first, then filter in Python
    for profile in queryset[:100]:
        # 1. Goal overlap filter
        if target_goals:
            profile_goals = set(profile.fitness_goals or [])
            if not profile_goals.intersection(target_goals):
                continue

        # 2. Interests overlap filter
        if target_interests:
            profile_interests = set(profile.interests or [])
            if not profile_interests.intersection(target_interests):
                continue

        # 3. Location filter (matches gym preferences case-insensitively)
        if target_location:
            profile_gyms = [str(g).strip().lower() for g in (profile.gym_preferences or [])]
            if not any(target_location in g for g in profile_gyms):
                continue

        score, breakdown = algorithm.calculate_compatibility(profile)

        # Only include matches with some compatibility
        if score > 0:
            reasons = [
                detail['reason']
                for detail in breakdown.values()
                if detail.get('points', 0) > 0
            ]
            matches.append({
                'profile': profile,
                'compatibility_score': score,
                'match_reasons': reasons,
                'breakdown': breakdown,
            })

    matches.sort(key=lambda x: x['compatibility_score'], reverse=True)

    return matches[:limit], len(matches)
