from django.test import TestCase
from rest_framework.test import APIClient

from apps.users.models import BlockedUser, User, UserProfile

from .services import find_matches_for_user


class MatchingPreferencesTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='preferences-user',
            password='test-password',
        )
        self.profile = UserProfile.objects.create(user=self.user)
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def test_patch_updates_all_exposed_preferences(self):
        response = self.client.patch(
            '/api/matching/preferences/',
            {
                'preferred_genders': ['F', 'O'],
                'fitness_goals': ['strength'],
                'interests': ['yoga'],
            },
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.preferred_genders, ['F', 'O'])
        self.assertEqual(self.profile.fitness_goals, ['strength'])
        self.assertEqual(self.profile.interests, ['yoga'])


class BlockedMatchingTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='searcher')
        self.user_profile = UserProfile.objects.create(
            user=self.user,
            fitness_goals=['strength'],
        )
        self.blocker = User.objects.create_user(username='blocker')
        UserProfile.objects.create(
            user=self.blocker,
            fitness_goals=['strength'],
        )

    def test_user_who_blocked_searcher_is_not_returned(self):
        BlockedUser.objects.create(blocker=self.blocker, blocked=self.user)

        matches, total = find_matches_for_user(self.user)

        self.assertEqual(matches, [])
        self.assertEqual(total, 0)
