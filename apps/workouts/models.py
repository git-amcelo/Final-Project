"""
WorkoutSession model for booking and managing workout sessions
"""
# pyrefly: ignore [missing-import]
from django.db import models
# pyrefly: ignore [missing-import]
from django.core.validators import MinValueValidator, MaxValueValidator
# pyrefly: ignore [missing-import]
from django.utils import timezone


class WorkoutSession(models.Model):
    """
    Represents a workout session between users
    Can be 1-on-1 or group sessions
    """
    SESSION_TYPE_CHOICES = [
        ('1on1', 'One-on-One'),
        ('group', 'Group'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    INTENSITY_CHOICES = [
        ('low', 'Low Intensity'),
        ('moderate', 'Moderate Intensity'),
        ('high', 'High Intensity'),
    ]

    # Basic session info
    title = models.CharField(max_length=200, help_text="Workout title or theme")
    description = models.TextField(blank=True, help_text="Detailed description of the workout")

    # Participants
    creator = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='created_sessions'
    )
    participant = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='invited_sessions',
        null=True,
        blank=True,
        help_text="The invited participant (null for open sessions)"
    )

    # Session type and status
    session_type = models.CharField(
        max_length=10,
        choices=SESSION_TYPE_CHOICES,
        default='1on1'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )

    # Scheduling
    scheduled_datetime = models.DateTimeField(help_text="When the workout is scheduled")
    duration_minutes = models.IntegerField(
        default=60,
        validators=[MinValueValidator(15), MaxValueValidator(480)],
        help_text="Duration in minutes (15-480)"
    )

    # Location and workout details
    location = models.CharField(
        max_length=200,
        help_text="Gym name, facility, or meeting location"
    )
    intensity = models.CharField(
        max_length=20,
        choices=INTENSITY_CHOICES,
        default='moderate',
        blank=True
    )

    # Workout focus areas
    focus_areas = models.JSONField(
        default=list,
        blank=True,
        help_text="List of focus areas (e.g., ['strength', 'cardio'])"
    )

    # Equipment needed
    equipment_needed = models.JSONField(
        default=list,
        blank=True,
        help_text="List of equipment participants should bring"
    )

    # Group session details (if applicable)
    max_participants = models.IntegerField(
        default=2,
        validators=[MinValueValidator(2), MaxValueValidator(20)],
        help_text="Maximum number of participants (for group sessions)"
    )
    current_participants = models.IntegerField(
        default=1,
        validators=[MinValueValidator(1)]
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Metadata
    notes = models.TextField(blank=True, help_text="Private notes for participants")

    class Meta:
        verbose_name = "Workout Session"
        verbose_name_plural = "Workout Sessions"
        ordering = ['scheduled_datetime']
        indexes = [
            models.Index(fields=['status', 'scheduled_datetime']),
            models.Index(fields=['creator', 'status']),
            models.Index(fields=['participant', 'status']),
        ]

    def __str__(self):
        participant_name = self.participant.username if self.participant else "Open"
        return f"{self.title} - {self.get_status_display()} ({participant_name})"

    @property
    def is_past(self):
        """Check if session is in the past"""
        return self.scheduled_datetime < timezone.now()

    @property
    def can_join(self):
        """Check if new participants can join (for group sessions)"""
        return (
            self.session_type == 'group' and
            self.status == 'accepted' and
            not self.is_past and
            self.current_participants < self.max_participants
        )


class SessionParticipant(models.Model):
    """
    Participants for group workout sessions
    """
    session = models.ForeignKey(
        WorkoutSession,
        on_delete=models.CASCADE,
        related_name='participants'
    )
    user = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='group_sessions'
    )
    joined_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ('invited', 'Invited'),
            ('accepted', 'Accepted'),
            ('declined', 'Declined'),
            ('attended', 'Attended'),
            ('no_show', 'No Show'),
        ],
        default='invited'
    )

    class Meta:
        verbose_name = "Session Participant"
        verbose_name_plural = "Session Participants"
        unique_together = ['session', 'user']
        ordering = ['joined_at']

    def __str__(self):
        return f"{self.user.username} - {self.session.title}"


class SessionRequest(models.Model):
    """
    Requests to join workout sessions (for group sessions)
    """
    session = models.ForeignKey(
        WorkoutSession,
        on_delete=models.CASCADE,
        related_name='join_requests'
    )
    requester = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='session_requests'
    )
    message = models.TextField(blank=True, help_text="Message to session creator")
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('accepted', 'Accepted'),
            ('rejected', 'Rejected'),
            ('cancelled', 'Cancelled'),
        ],
        default='pending'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    responded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Session Request"
        verbose_name_plural = "Session Requests"
        unique_together = ['session', 'requester']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.requester.username} -> {self.session.title}"
