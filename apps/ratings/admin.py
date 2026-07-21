"""
Admin configuration for ratings app
"""
# pyrefly: ignore [missing-import]
from django.contrib import admin
from .models import Rating


@admin.register(Rating)
class RatingAdmin(admin.ModelAdmin):
    """Admin for Rating model"""
    list_display = [
        'from_user', 'to_user', 'score', 'session',
        'would_workout_again', 'created_at'
    ]
    list_filter = ['score', 'would_workout_again', 'created_at']
    search_fields = [
        'from_user__username', 'to_user__username',
        'session__title', 'comment'
    ]
    readonly_fields = ['created_at', 'updated_at']

    fieldsets = (
        ('Users', {
            'fields': ('from_user', 'to_user')
        }),
        ('Context', {
            'fields': ('session', 'group')
        }),
        ('Overall Rating', {
            'fields': ('score', 'would_workout_again')
        }),
        ('Category Ratings', {
            'fields': ('punctuality', 'communication', 'effort', 'knowledge')
        }),
        ('Feedback', {
            'fields': ('comment',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )
