"""
Template-site forms for workout groups.
"""
# pyrefly: ignore [missing-import]
from django import forms

from .models import WorkoutGroup, GroupSession


class GroupForm(forms.ModelForm):
    """Create or edit a workout group (includes an image upload)."""

    def clean_name(self):
        name = self.cleaned_data.get('name', '').strip()
        if not name:
            raise forms.ValidationError('Group name is required.')
        return name

    def clean_max_members(self):
        max_members = self.cleaned_data.get('max_members')
        if max_members is not None and max_members < 2:
            raise forms.ValidationError('Maximum members must be at least 2.')
        return max_members

    class Meta:
        model = WorkoutGroup
        fields = (
            'name', 'tagline', 'description', 'group_type', 'max_members',
            'workout_frequency', 'primary_location', 'typical_time',
            'fitness_level_required', 'group_image',
        )
        widgets = {
            'name': forms.TextInput(attrs={'class': 'form-control',
                                           'placeholder': 'e.g. Sunrise Runners'}),
            'tagline': forms.TextInput(attrs={'class': 'form-control',
                                              'placeholder': 'A short catchy tagline'}),
            'description': forms.Textarea(attrs={'class': 'form-control', 'rows': 4}),
            'group_type': forms.Select(attrs={'class': 'form-select'}),
            'max_members': forms.NumberInput(attrs={'class': 'form-control', 'min': 2}),
            'workout_frequency': forms.Select(attrs={'class': 'form-select'}),
            'primary_location': forms.TextInput(attrs={'class': 'form-control'}),
            'typical_time': forms.TextInput(attrs={'class': 'form-control',
                                                   'placeholder': 'e.g. 6:00 AM - 7:30 AM'}),
            'fitness_level_required': forms.Select(attrs={'class': 'form-select'}),
            'group_image': forms.ClearableFileInput(attrs={'class': 'form-control',
                                                           'accept': 'image/*'}),
        }


class GroupSessionForm(forms.ModelForm):
    """Schedule a workout session for a group (admin/moderator only)."""

    scheduled_datetime = forms.DateTimeField(
        widget=forms.DateTimeInput(attrs={'class': 'form-control', 'type': 'datetime-local'}),
        help_text='When the session takes place',
    )

    class Meta:
        model = GroupSession
        fields = (
            'title', 'description', 'scheduled_datetime',
            'duration_minutes', 'location', 'max_attendees',
        )
        widgets = {
            'title': forms.TextInput(attrs={'class': 'form-control',
                                            'placeholder': 'e.g. Saturday Long Run'}),
            'description': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
            'duration_minutes': forms.NumberInput(attrs={'class': 'form-control',
                                                         'min': 15, 'max': 480, 'step': 15}),
            'location': forms.TextInput(attrs={'class': 'form-control',
                                               'placeholder': 'e.g. Riverside Trail'}),
            'max_attendees': forms.NumberInput(attrs={'class': 'form-control', 'min': 1}),
        }


class GroupSearchForm(forms.Form):
    """Keyword search plus predefined dropdown for the group directory."""

    q = forms.CharField(
        required=False,
        label='Keyword',
        widget=forms.TextInput(attrs={'class': 'form-control',
                                      'placeholder': 'Search groups by name or location'}),
    )
    group_type = forms.ChoiceField(
        required=False,
        label='Type',
        choices=[('', 'All types')] + WorkoutGroup.GROUP_TYPE_CHOICES,
        widget=forms.Select(attrs={'class': 'form-select'}),
    )
