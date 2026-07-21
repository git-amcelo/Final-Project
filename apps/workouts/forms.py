"""
Template-site forms for workout sessions: create/edit form and the
search form (keyword box + predefined dropdowns).
"""
# pyrefly: ignore [missing-import]
from django import forms
# pyrefly: ignore [missing-import]
from django.utils import timezone

from .models import WorkoutSession


class WorkoutSessionForm(forms.ModelForm):
    """Create or edit a workout session."""

    scheduled_datetime = forms.DateTimeField(
        widget=forms.DateTimeInput(attrs={'class': 'form-control', 'type': 'datetime-local'}),
        help_text='When the workout takes place',
    )

    class Meta:
        model = WorkoutSession
        fields = (
            'title', 'description', 'session_type', 'scheduled_datetime',
            'duration_minutes', 'location', 'intensity', 'max_participants', 'notes',
        )
        widgets = {
            'title': forms.TextInput(attrs={'class': 'form-control',
                                            'placeholder': 'e.g. Leg Day at the Forge'}),
            'description': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
            'session_type': forms.Select(attrs={'class': 'form-select'}),
            'duration_minutes': forms.NumberInput(attrs={'class': 'form-control',
                                                         'min': 15, 'max': 480, 'step': 15}),
            'location': forms.TextInput(attrs={'class': 'form-control',
                                               'placeholder': 'e.g. Toldo Lancer Centre'}),
            'intensity': forms.Select(attrs={'class': 'form-select'}),
            'max_participants': forms.NumberInput(attrs={'class': 'form-control', 'min': 2, 'max': 20}),
            'notes': forms.Textarea(attrs={'class': 'form-control', 'rows': 2}),
        }

    def clean_scheduled_datetime(self):
        scheduled = self.cleaned_data['scheduled_datetime']
        if scheduled < timezone.now():
            raise forms.ValidationError('Sessions must be scheduled in the future.')
        return scheduled


class SessionSearchForm(forms.Form):
    """Search bar with keyword input plus predefined dropdown filters."""

    q = forms.CharField(
        required=False,
        label='Keyword',
        widget=forms.TextInput(attrs={'class': 'form-control',
                                      'placeholder': 'Search title, description or location...'}),
    )
    session_type = forms.ChoiceField(
        required=False,
        label='Type',
        choices=[('', 'All types')] + WorkoutSession.SESSION_TYPE_CHOICES,
        widget=forms.Select(attrs={'class': 'form-select'}),
    )
    intensity = forms.ChoiceField(
        required=False,
        label='Intensity',
        choices=[('', 'Any intensity')] + WorkoutSession.INTENSITY_CHOICES,
        widget=forms.Select(attrs={'class': 'form-select'}),
    )
    location = forms.CharField(
        required=False,
        label='Location',
        widget=forms.TextInput(attrs={'class': 'form-control',
                                      'placeholder': 'Location...'}),
    )
