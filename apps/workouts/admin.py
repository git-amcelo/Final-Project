"""
Admin configuration for workouts app
"""
# pyrefly: ignore [missing-import]
from django.contrib import admin
from .models import WorkoutSession, SessionParticipant, SessionRequest


@admin.register(WorkoutSession)
class WorkoutSessionAdmin(admin.ModelAdmin):
    """Admin for WorkoutSession model"""
    list_display = [
        'title', 'creator', 'session_type', 'status',
        'scheduled_datetime', 'location', 'is_past'
    ]
    list_filter = ['session_type', 'status', 'intensity', 'created_at']
    search_fields = ['title', 'description', 'location', 'creator__username']
    readonly_fields = ['created_at', 'updated_at', 'is_past', 'can_join']

    fieldsets = (
        ('Basic Info', {
            'fields': ('title', 'description', 'session_type', 'status')
        }),
        ('Participants', {
            'fields': ('creator', 'participant')
        }),
        ('Scheduling', {
            'fields': ('scheduled_datetime', 'duration_minutes', 'location', 'intensity')
        }),
        ('Workout Details', {
            'fields': ('focus_areas', 'equipment_needed', 'max_participants', 'current_participants')
        }),
        ('Metadata', {
            'fields': ('notes', 'is_past', 'can_join')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(SessionParticipant)
class SessionParticipantAdmin(admin.ModelAdmin):
    """Admin for SessionParticipant model"""
    list_display = ['session', 'user', 'status', 'joined_at']
    list_filter = ['status', 'joined_at']
    search_fields = ['session__title', 'user__username']
    readonly_fields = ['joined_at']


@admin.register(SessionRequest)
class SessionRequestAdmin(admin.ModelAdmin):
    """Admin for SessionRequest model"""
    list_display = ['session', 'requester', 'status', 'created_at', 'responded_at']
    list_filter = ['status', 'created_at']
    search_fields = ['session__title', 'requester__username', 'message']
    readonly_fields = ['created_at', 'responded_at']
