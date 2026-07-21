"""
Rating model for user reviews and feedback
"""
# pyrefly: ignore [missing-import]
from django.db import models
# pyrefly: ignore [missing-import]
from django.core.validators import MinValueValidator, MaxValueValidator


class Rating(models.Model):
    """
    Rating given by one user to another after a workout session
    Builds trust and accountability in the community
    """
    from_user = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='given_ratings'
    )
    to_user = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='received_ratings'
    )
    session = models.ForeignKey(
        'workouts.WorkoutSession',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='ratings',
        help_text="The workout session this rating is for (optional)"
    )
    group = models.ForeignKey(
        'groups.WorkoutGroup',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='ratings',
        help_text="The group this rating is for (optional)"
    )

    # Rating score (1-5 stars)
    score = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Rating score from 1 to 5"
    )

    # Rating categories (detailed feedback)
    punctuality = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    communication = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    effort = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    knowledge = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )

    # Written feedback
    comment = models.TextField(
        max_length=1000,
        blank=True,
        help_text="Detailed feedback about the experience"
    )

    # Would work out with again
    would_workout_again = models.BooleanField(
        default=True,
        help_text="Would you work out with this person again?"
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "User Rating"
        verbose_name_plural = "User Ratings"
        ordering = ['-created_at']
        # One user can rate another user only once per session
        constraints = [
            models.UniqueConstraint(
                fields=['from_user', 'to_user', 'session'],
                condition=models.Q(session__isnull=False),
                name='unique_rating_per_session'
            ),
        ]
        indexes = [
            models.Index(fields=['to_user', 'score']),
            models.Index(fields=['from_user', 'created_at']),
        ]

    def __str__(self):
        target = self.to_user.username
        source = self.from_user.username
        return f"{source} rated {target}: {self.score}/5"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Update the recipient's average rating
        if hasattr(self.to_user, 'profile'):
            self.to_user.profile.update_rating()
