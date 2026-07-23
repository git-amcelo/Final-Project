from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse

from .models import GroupMembership, WorkoutGroup


class LeaveGroupWebViewTests(TestCase):
    def test_leaving_group_decrements_member_count(self):
        User = get_user_model()
        creator = User.objects.create_user(
            username='creator',
            email='creator@example.com',
            password='password123',
        )
        member = User.objects.create_user(
            username='member',
            email='member@example.com',
            password='password123',
        )

        group = WorkoutGroup.objects.create(
            name='Test Group',
            slug='test-group',
            description='A test group',
            creator=creator,
            member_count=0,
        )
        GroupMembership.objects.create(group=group, user=creator, role='admin', status='active')
        GroupMembership.objects.create(group=group, user=member, role='member', status='active')

        self.client.force_login(member)
        response = self.client.post(reverse('groups_web:leave', kwargs={'slug': group.slug}))

        self.assertEqual(response.status_code, 302)
        group.refresh_from_db()
        self.assertEqual(group.member_count, 1)
