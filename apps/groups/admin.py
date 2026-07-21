"""
Admin configuration for groups app
"""
# pyrefly: ignore [missing-import]
from django.contrib import admin
from .models import WorkoutGroup, GroupMembership, GroupSession, GroupSessionAttendance


@admin.register(WorkoutGroup)
class WorkoutGroupAdmin(admin.ModelAdmin):
    """Admin for WorkoutGroup model"""
    list_display = [
        'name', 'slug', 'group_type', 'creator',
        'member_count', 'max_members', 'is_active', 'is_featured'
    ]
    list_filter = ['group_type', 'workout_frequency', 'is_active', 'is_featured']
    search_fields = ['name', 'description', 'tagline', 'creator__username']
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ['created_at', 'updated_at']

    fieldsets = (
        ('Basic Info', {
            'fields': ('name', 'slug', 'description', 'tagline')
        }),
        ('Group Settings', {
            'fields': ('group_type', 'max_members', 'is_active', 'is_featured')
        }),
        ('Focus & Schedule', {
            'fields': (
                'focus_areas', 'workout_frequency',
                'primary_location', 'meeting_days', 'typical_time'
            )
        }),
        ('Requirements', {
            'fields': ('fitness_level_required', 'equipment_needed', 'requirements')
        }),
        ('Image', {
            'fields': ('group_image',)
        }),
        ('Management', {
            'fields': ('creator', 'member_count', 'session_count')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(GroupMembership)
class GroupMembershipAdmin(admin.ModelAdmin):
    """Admin for GroupMembership model"""
    list_display = ['group', 'user', 'role', 'status', 'joined_at']
    list_filter = ['role', 'status', 'joined_at']
    search_fields = ['group__name', 'user__username']
    readonly_fields = ['joined_at', 'last_active']


@admin.register(GroupSession)
class GroupSessionAdmin(admin.ModelAdmin):
    """Admin for GroupSession model"""
    list_display = ['group', 'title', 'scheduled_datetime', 'location', 'current_attendees']
    list_filter = ['scheduled_datetime', 'is_recurring']
    search_fields = ['title', 'description', 'group__name']
    readonly_fields = ['created_at', 'created_by']


@admin.register(GroupSessionAttendance)
class GroupSessionAttendanceAdmin(admin.ModelAdmin):
    """Admin for GroupSessionAttendance model"""
    list_display = ['session', 'user', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['session__title', 'user__username']
    readonly_fields = ['created_at', 'updated_at']
