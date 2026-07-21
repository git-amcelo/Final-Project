"""
Site-wide forms (Contact Us)
"""
# pyrefly: ignore [missing-import]
from django import forms

SUBJECT_CHOICES = [
    ('general', 'General Question'),
    ('bug', 'Report a Problem'),
    ('partnership', 'Gym Partnership'),
    ('feedback', 'Feedback'),
]


class ContactForm(forms.Form):
    name = forms.CharField(
        max_length=100,
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Your name'}),
    )
    email = forms.EmailField(
        widget=forms.EmailInput(attrs={'class': 'form-control', 'placeholder': 'you@uwindsor.ca'}),
    )
    subject = forms.ChoiceField(
        choices=SUBJECT_CHOICES,
        widget=forms.Select(attrs={'class': 'form-select'}),
    )
    message = forms.CharField(
        widget=forms.Textarea(attrs={'class': 'form-control', 'rows': 5, 'placeholder': 'How can we help?'}),
    )
