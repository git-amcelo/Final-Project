from django.test import TestCase
from rest_framework.test import APIClient

from .models import BlockedUser, User, UserProfile


class SocialSafetyTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='current-user')
        UserProfile.objects.create(user=self.user)
        self.other = User.objects.create_user(username='other-user')
        UserProfile.objects.create(user=self.other)
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def test_cannot_favorite_self_with_form_encoded_id(self):
        response = self.client.post(
            '/api/favorites/',
            {'favorite': str(self.user.id)},
            format='multipart',
        )

        self.assertEqual(response.status_code, 400)

    def test_cannot_block_self_with_form_encoded_id(self):
        response = self.client.post(
            '/api/blocked/',
            {'blocked': str(self.user.id)},
            format='multipart',
        )

        self.assertEqual(response.status_code, 400)

    def test_user_list_hides_people_who_blocked_current_user(self):
        BlockedUser.objects.create(blocker=self.other, blocked=self.user)

        response = self.client.get('/api/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['results'], [])
