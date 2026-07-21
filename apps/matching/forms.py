"""
Form for the template-site buddy-matching filter bar.
"""
# pyrefly: ignore [missing-import]
from django import forms

from apps.users.models import UserProfile


class MatchFilterForm(forms.Form):
    """Optional filters mirrored from MatchRequestSerializer (API), minus
    availability_day/max_distance — both are validated by the API but never
    actually applied by FindBuddiesView, so there's no real behavior to
    expose here."""

    fitness_level = forms.ChoiceField(
        required=False,
        label='Fitness level',
        choices=[('', 'Any level')] + UserProfile.FITNESS_LEVEL_CHOICES,
        widget=forms.Select(attrs={'class': 'form-select'}),
    )
    gender = forms.ChoiceField(
        required=False,
        label='Gender',
        choices=[('', 'Any')] + UserProfile.GENDER_CHOICES,
        widget=forms.Select(attrs={'class': 'form-select'}),
    )
    goals = forms.ChoiceField(
        required=False,
        label='Goal',
        choices=[('', 'Any goal')] + UserProfile.GOAL_CHOICES,
        widget=forms.Select(attrs={'class': 'form-select'}),
    )
    interests = forms.CharField(
        required=False,
        label='Interests',
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'e.g. yoga, running (comma-separated)',
        }),
    )
    location = forms.CharField(
        required=False,
        label='Gym / location',
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'e.g. Downtown Fitness',
        }),
    )
    min_rating = forms.ChoiceField(
        required=False,
        label='Minimum rating',
        choices=[('', 'Any rating')] + [(str(n), f'{n}+ stars') for n in range(1, 6)],
        widget=forms.Select(attrs={'class': 'form-select'}),
    )

    def cleaned_filters(self):
        """Convert to the dict shape find_matches_for_user() expects."""
        data = self.cleaned_data
        interests = [i.strip() for i in data.get('interests', '').split(',') if i.strip()]
        return {
            'fitness_level': data.get('fitness_level') or None,
            'gender': data.get('gender') or None,
            'goals': [data['goals']] if data.get('goals') else [],
            'interests': interests,
            'location': data.get('location') or '',
            'min_rating': float(data['min_rating']) if data.get('min_rating') else None,
        }
