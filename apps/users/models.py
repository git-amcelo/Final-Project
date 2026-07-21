"""
Custom User and UserProfile models for GymBuddy
"""
# pyrefly: ignore [missing-import]
from django.db import models
# pyrefly: ignore [missing-import]
from django.contrib.auth.models import AbstractUser
# pyrefly: ignore [missing-import]
from django.core.validators import MinValueValidator, MaxValueValidator


class User(AbstractUser):
    """
    Custom User model extending Django's AbstractUser
    Adds role and student-specific fields
    """
    ROLE_CHOICES = [
        ('student', 'Student'),
        ('alumni', 'Alumni'),
    ]

    # Override AbstractUser fields to make them truly optional
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)

    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='student')
    student_id = models.CharField(max_length=20, unique=True, null=True, blank=True)
    phone = models.CharField(max_length=15, blank=True)
    email_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"


class UserProfile(models.Model):
    """
    Extended profile with fitness-specific information
    """
    GENDER_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'),
        ('O', 'Other'),
        ('N', 'Prefer not to say'),
    ]

    FITNESS_LEVEL_CHOICES = [
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
    ]

    GOAL_CHOICES = [
        ('weight_loss', 'Weight Loss'),
        ('muscle_gain', 'Muscle Gain'),
        ('endurance', 'Endurance'),
        ('strength', 'Strength'),
        ('general', 'General Fitness'),
        ('flexibility', 'Flexibility'),
        ('sports_performance', 'Sports Performance'),
    ]

    # Core profile fields
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    bio = models.TextField(max_length=500, blank=True, help_text="Tell others about your fitness journey")
    profile_picture = models.ImageField(
        upload_to='profiles/',
        null=True,
        blank=True,
        help_text="Upload a profile picture"
    )

    # Fitness attributes
    gender = models.CharField(
        max_length=1,
        choices=GENDER_CHOICES,
        null=True,
        blank=True,
        help_text="Your gender (for matching preferences)"
    )
    fitness_level = models.CharField(
        max_length=20,
        choices=FITNESS_LEVEL_CHOICES,
        default='beginner',
        help_text="Your current fitness level"
    )
    fitness_goals = models.JSONField(
        default=list,
        blank=True,
        help_text="List of fitness goals (e.g., ['strength', 'weight_loss'])"
    )

    # Matching preferences
    preferred_genders = models.JSONField(
        default=list,
        blank=True,
        help_text="Genders you prefer to work out with (e.g., ['M', 'F'])"
    )
    availability = models.JSONField(
        default=dict,
        blank=True,
        help_text="Weekly availability (e.g., {'monday': ['morning', 'evening']})"
    )
    gym_preferences = models.JSONField(
        default=list,
        blank=True,
        help_text="Preferred gym locations or facilities"
    )

    # Interests and specialties (for better matching)
    interests = models.JSONField(
        default=list,
        blank=True,
        help_text="Fitness interests (e.g., ['weightlifting', 'cardio', 'yoga'])"
    )
    certifications = models.JSONField(
        default=list,
        blank=True,
        help_text="Any fitness certifications or specialties"
    )

    # Ratings and stats
    average_rating = models.FloatField(
        default=0.0,
        validators=[MinValueValidator(0.0), MaxValueValidator(5.0)],
        help_text="Average rating from workout partners"
    )
    total_ratings = models.IntegerField(default=0)

    # Timestamps
    joined_date = models.DateTimeField(auto_now_add=True)
    last_active = models.DateTimeField(auto_now=True)

    # Profile visibility
    is_visible = models.BooleanField(
        default=True,
        help_text="Show profile in search results"
    )

    class Meta:
        verbose_name = "User Profile"
        verbose_name_plural = "User Profiles"
        ordering = ['-joined_date']

    def __str__(self):
        return f"{self.user.username}'s Profile"

    def update_rating(self):
        """Recalculate average rating from all received ratings"""
        from apps.ratings.models import Rating
        ratings = Rating.objects.filter(to_user=self.user)
        if ratings.exists():
            self.average_rating = round(sum(r.score for r in ratings) / ratings.count(), 1)
            self.total_ratings = ratings.count()
        else:
            self.average_rating = 0.0
            self.total_ratings = 0
        self.save(update_fields=['average_rating', 'total_ratings'])


class BlockedUser(models.Model):
    """
    Users blocked by another user (excluded from search/matching)
    """
    blocker = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='blocked_users'
    )
    blocked = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='blocked_by'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    reason = models.CharField(max_length=200, blank=True)

    class Meta:
        verbose_name = "Blocked User"
        verbose_name_plural = "Blocked Users"
        unique_together = ['blocker', 'blocked']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.blocker.username} blocked {self.blocked.username}"


class FavoriteUser(models.Model):
    """
    Users favorited by another user (quick access)
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='favorite_users'
    )
    favorite = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='favorited_by'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    notes = models.CharField(max_length=200, blank=True)

    class Meta:
        verbose_name = "Favorite User"
        verbose_name_plural = "Favorite Users"
        unique_together = ['user', 'favorite']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} favorited {self.favorite.username}"
