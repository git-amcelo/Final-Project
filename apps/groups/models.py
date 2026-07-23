"""
WorkoutGroup and GroupMembership models for group workout communities
"""
# pyrefly: ignore [missing-import]
from django.db import models
# pyrefly: ignore [missing-import]
from django.core.validators import MinValueValidator


class WorkoutGroup(models.Model):
    """
    Represents a workout group/community
    Groups can organize regular sessions and build micro-communities
    """
    GROUP_TYPE_CHOICES = [
        ('open', 'Open - Anyone can join'),
        ('closed', 'Closed - Requires approval'),
        ('private', 'Private - Invite only'),
    ]

    FREQUENCY_CHOICES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('bi_weekly', 'Bi-Weekly'),
        ('monthly', 'Monthly'),
        ('one_time', 'One-time Event'),
    ]

    # Basic group info
    name = models.CharField(max_length=100, help_text="Group name")
    slug = models.SlugField(max_length=100, unique=True, allow_unicode=True)
    description = models.TextField(max_length=1000, help_text="Group description and purpose")
    tagline = models.CharField(max_length=200, blank=True, help_text="Short catchy tagline")

    # Group settings
    group_type = models.CharField(
        max_length=20,
        choices=GROUP_TYPE_CHOICES,
        default='open',
        help_text="How people can join this group"
    )
    max_members = models.IntegerField(
        default=20,
        validators=[MinValueValidator(2)],
        help_text="Maximum number of members"
    )

    # Focus and schedule
    focus_areas = models.JSONField(
        default=list,
        blank=True,
        help_text="Primary focus areas (e.g., ['strength', 'cardio', 'yoga'])"
    )
    workout_frequency = models.CharField(
        max_length=20,
        choices=FREQUENCY_CHOICES,
        default='weekly',
        help_text="How often the group meets"
    )

    # Location and schedule details
    primary_location = models.CharField(
        max_length=200,
        blank=True,
        help_text="Primary meeting location"
    )
    meeting_days = models.JSONField(
        default=list,
        blank=True,
        help_text="Days of week the group meets (e.g., ['monday', 'wednesday'])"
    )
    typical_time = models.CharField(
        max_length=100,
        blank=True,
        help_text="Typical meeting time (e.g., '6:00 AM - 7:30 AM')"
    )

    # Requirements and expectations
    fitness_level_required = models.CharField(
        max_length=20,
        choices=[
            ('any', 'All Levels'),
            ('beginner', 'Beginner Friendly'),
            ('intermediate', 'Intermediate+'),
            ('advanced', 'Advanced Only'),
        ],
        default='any',
        blank=True
    )
    equipment_needed = models.JSONField(
        default=list,
        blank=True,
        help_text="Equipment members should bring"
    )
    requirements = models.TextField(
        blank=True,
        help_text="Any requirements or expectations for members"
    )

    # Group image
    group_image = models.ImageField(
        upload_to='groups/',
        null=True,
        blank=True,
        help_text="Group banner or logo"
    )

    # Management
    creator = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='created_groups'
    )
    moderators = models.ManyToManyField(
        'users.User',
        through='GroupMembership',
        related_name='moderated_groups',
        through_fields=('group', 'user'),
    )

    # Stats
    member_count = models.IntegerField(default=0)
    session_count = models.IntegerField(default=0)

    # Status
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False, help_text="Featured on homepage")

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Workout Group"
        verbose_name_plural = "Workout Groups"
        ordering = ['-is_featured', '-created_at']
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['group_type', 'is_active']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return f"{self.name} ({self.get_group_type_display()})"

    @property
    def member_count_actual(self):
        """Get the live active member count from memberships."""
        return self.members.filter(status='active').count()

    @property
    def can_accept_members(self):
        """Return whether the group still has room for more members."""
        return self.member_count_actual < self.max_members


class GroupMembership(models.Model):
    """
    Through model for group membership with roles and status
    """
    ROLE_CHOICES = [
        ('admin', 'Admin - Full control'),
        ('moderator', 'Moderator - Can manage members and sessions'),
        ('member', 'Member - Regular participant'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending Approval'),
        ('active', 'Active Member'),
        ('inactive', 'Inactive - Left group'),
        ('banned', 'Banned'),
    ]

    group = models.ForeignKey(
        WorkoutGroup,
        on_delete=models.CASCADE,
        related_name='members'
    )
    user = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='group_memberships'
    )
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='member'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='active'
    )

    # Membership tracking
    joined_at = models.DateTimeField(auto_now_add=True)
    last_active = models.DateTimeField(auto_now=True)

    # For pending memberships
    message = models.TextField(blank=True, help_text="Application message")

    class Meta:
        verbose_name = "Group Membership"
        verbose_name_plural = "Group Memberships"
        unique_together = ['group', 'user']
        ordering = ['-joined_at']
        indexes = [
            models.Index(fields=['group', 'status']),
            models.Index(fields=['user', 'status']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.group.name} ({self.get_role_display()})"

    def save(self, *args, **kwargs):
        # Update group member count on save
        is_new = self.pk is None
        super().save(*args, **kwargs)

        if is_new and self.status == 'active':
            self.group.member_count = models.F('member_count') + 1
            self.group.save(update_fields=['member_count'])


class GroupSession(models.Model):
    """
    Scheduled workout sessions for groups
    """
    group = models.ForeignKey(
        WorkoutGroup,
        on_delete=models.CASCADE,
        related_name='scheduled_sessions'
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    scheduled_datetime = models.DateTimeField()
    duration_minutes = models.IntegerField(default=60)
    location = models.CharField(max_length=200, blank=True)
    max_attendees = models.IntegerField(default=20)
    current_attendees = models.IntegerField(default=0)
    is_recurring = models.BooleanField(default=False)
    recurring_pattern = models.JSONField(
        default=dict,
        blank=True,
        help_text="Recurring pattern details"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='created_group_sessions'
    )

    class Meta:
        verbose_name = "Group Session"
        verbose_name_plural = "Group Sessions"
        ordering = ['scheduled_datetime']

    def __str__(self):
        return f"{self.group.name}: {self.title}"


class GroupSessionAttendance(models.Model):
    """
    Track attendance for group sessions
    """
    session = models.ForeignKey(
        GroupSession,
        on_delete=models.CASCADE,
        related_name='attendances'
    )
    user = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='session_attendances'
    )
    status = models.CharField(
        max_length=20,
        choices=[
            ('going', 'Going'),
            ('maybe', 'Maybe'),
            ('not_going', 'Not Going'),
            ('attended', 'Attended'),
            ('no_show', 'No Show'),
        ],
        default='going'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Session Attendance"
        verbose_name_plural = "Session Attendances"
        unique_together = ['session', 'user']
        ordering = ['session__scheduled_datetime']

    def __str__(self):
        return f"{self.user.username} - {self.session.title} ({self.status})"
