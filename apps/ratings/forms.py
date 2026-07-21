"""
Template-site form for rating a workout partner.
"""
# pyrefly: ignore [missing-import]
from django import forms

from .models import Rating

STAR_CHOICES = [(i, f'{i} ★') for i in range(1, 6)]


class RatingForm(forms.ModelForm):
    """Rate another member from 1 to 5 stars with optional details."""

    score = forms.TypedChoiceField(
        coerce=int,
        choices=STAR_CHOICES,
        label='Overall rating',
        widget=forms.Select(attrs={'class': 'form-select'}),
    )
    punctuality = forms.TypedChoiceField(
        coerce=int,
        required=False,
        empty_value=None,
        choices=[('', 'Not rated')] + STAR_CHOICES,
        widget=forms.Select(attrs={'class': 'form-select'}),
    )
    communication = forms.TypedChoiceField(
        coerce=int,
        required=False,
        empty_value=None,
        choices=[('', 'Not rated')] + STAR_CHOICES,
        widget=forms.Select(attrs={'class': 'form-select'}),
    )

    class Meta:
        model = Rating
        fields = ('score', 'punctuality', 'communication', 'comment', 'would_workout_again')
        widgets = {
            'comment': forms.Textarea(attrs={'class': 'form-control', 'rows': 3,
                                             'placeholder': 'How was the workout?'}),
            'would_workout_again': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
        }
