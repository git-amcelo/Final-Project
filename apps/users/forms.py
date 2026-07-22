"""
Template-site forms: sign up, login, password reset, profile editing,
and the buddy directory search form.
"""
# pyrefly: ignore [missing-import]
from django import forms
# pyrefly: ignore [missing-import]
from django.contrib.auth.forms import (
    AuthenticationForm,
    PasswordResetForm,
    SetPasswordForm,
    UserCreationForm,
)

from .models import User, UserProfile


class SignUpForm(UserCreationForm):
    """Registration form for the custom User model."""

    email = forms.EmailField(
        required=True,
        widget=forms.EmailInput(attrs={'class': 'form-control', 'placeholder': 'you@uwindsor.ca'}),
    )

    class Meta(UserCreationForm.Meta):
        model = User
        fields = ('username', 'email', 'first_name', 'last_name', 'role', 'student_id', 'phone')
        widgets = {
            'username': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Choose a username'}),
            'first_name': forms.TextInput(attrs={'class': 'form-control'}),
            'last_name': forms.TextInput(attrs={'class': 'form-control'}),
            'role': forms.Select(attrs={'class': 'form-select'}),
            'student_id': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Optional'}),
            'phone': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Optional'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['password1'].widget.attrs.update({'class': 'form-control'})
        self.fields['password2'].widget.attrs.update({'class': 'form-control'})

    def clean_username(self):
        username = self.cleaned_data['username'].strip()
        return username

    def clean_email(self):
        email = self.cleaned_data['email'].strip().lower()
        if User.objects.filter(email__iexact=email).exists():
            raise forms.ValidationError('An account with this email already exists.')
        return email

    def clean_student_id(self):
        # Blank must be stored as NULL, otherwise the unique constraint
        # rejects the second user who leaves it empty
        return self.cleaned_data.get('student_id') or None


class LoginForm(AuthenticationForm):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['username'].widget.attrs.update(
            {'class': 'form-control', 'placeholder': 'Username'})
        self.fields['password'].widget.attrs.update(
            {'class': 'form-control', 'placeholder': 'Password'})


class PasswordResetRequestForm(PasswordResetForm):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['email'].widget.attrs.update(
            {'class': 'form-control', 'placeholder': 'you@uwindsor.ca'})


class SetNewPasswordForm(SetPasswordForm):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['new_password1'].widget.attrs.update({'class': 'form-control'})
        self.fields['new_password2'].widget.attrs.update({'class': 'form-control'})


class UserForm(forms.ModelForm):
    """Basic account fields, edited together with the profile."""

    class Meta:
        model = User
        fields = ('first_name', 'last_name', 'email', 'phone')
        widgets = {
            'first_name': forms.TextInput(attrs={'class': 'form-control'}),
            'last_name': forms.TextInput(attrs={'class': 'form-control'}),
            'email': forms.EmailInput(attrs={'class': 'form-control'}),
            'phone': forms.TextInput(attrs={'class': 'form-control'}),
        }

    def clean_email(self):
        email = self.cleaned_data['email'].strip().lower()
        if User.objects.filter(email__iexact=email).exclude(pk=self.instance.pk).exists():
            raise forms.ValidationError('An account with this email already exists.')
        return email


class ProfileForm(forms.ModelForm):
    """Fitness profile, including the profile picture upload."""

    class Meta:
        model = UserProfile
        fields = ('profile_picture', 'bio', 'gender', 'fitness_level', 'is_visible')
        widgets = {
            'profile_picture': forms.ClearableFileInput(attrs={'class': 'form-control', 'accept': 'image/*'}),
            'bio': forms.Textarea(attrs={'class': 'form-control', 'rows': 3,
                                         'placeholder': 'Tell others about your fitness journey'}),
            'gender': forms.Select(attrs={'class': 'form-select'}),
            'fitness_level': forms.Select(attrs={'class': 'form-select'}),
            'is_visible': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
        }

    def clean_bio(self):
        return self.cleaned_data['bio'].strip()

    def clean_profile_picture(self):
        uploaded_file = self.cleaned_data.get('profile_picture')
        if uploaded_file is None:
            return uploaded_file

        if uploaded_file.size > 5 * 1024 * 1024:
            raise forms.ValidationError('Profile pictures must be 5MB or smaller.')

        allowed_content_types = {'image/jpeg', 'image/png', 'image/webp'}
        if getattr(uploaded_file, 'content_type', None) and uploaded_file.content_type not in allowed_content_types:
            raise forms.ValidationError('Only JPEG, PNG, and WebP images are allowed.')

        return uploaded_file


class MemberSearchForm(forms.Form):
    """Search bar + predefined dropdown for the buddy directory."""

    q = forms.CharField(
        required=False,
        label='Keyword',
        widget=forms.TextInput(attrs={'class': 'form-control',
                                      'placeholder': 'Search by name or bio...'}),
    )
    fitness_level = forms.ChoiceField(
        required=False,
        label='Fitness level',
        choices=[('', 'All levels')] + UserProfile.FITNESS_LEVEL_CHOICES,
        widget=forms.Select(attrs={'class': 'form-select'}),
    )
