"""
Admin configuration for users app
"""
# pyrefly: ignore [missing-import]
from django.contrib import admin
# pyrefly: ignore [missing-import]
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, UserProfile, BlockedUser, FavoriteUser


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Custom admin for User model"""
    list_display = ['username', 'email', 'role', 'student_id', 'is_active', 'email_verified', 'created_at']
    list_filter = ['role', 'is_active', 'email_verified', 'created_at']
    search_fields = ['username', 'email', 'student_id']
    readonly_fields = ['created_at', 'updated_at']

    fieldsets = BaseUserAdmin.fieldsets + (
        ('Additional Info', {
            'fields': ('role', 'student_id', 'phone', 'email_verified')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    """Admin for UserProfile model"""
    list_display = ['user', 'fitness_level', 'gender', 'average_rating', 'total_ratings', 'is_visible']
    list_filter = ['fitness_level', 'gender', 'is_visible', 'joined_date']
    search_fields = ['user__username', 'bio']
    readonly_fields = ['joined_date', 'last_active', 'average_rating', 'total_ratings']

    fieldsets = (
        ('Basic Info', {
            'fields': ('user', 'bio', 'profile_picture', 'is_visible')
        }),
        ('Fitness Profile', {
            'fields': ('gender', 'fitness_level', 'fitness_goals', 'interests')
        }),
        ('Preferences', {
            'fields': ('preferred_genders', 'availability', 'gym_preferences')
        }),
        ('Certifications', {
            'fields': ('certifications',)
        }),
        ('Ratings', {
            'fields': ('average_rating', 'total_ratings')
        }),
        ('Timestamps', {
            'fields': ('joined_date', 'last_active')
        }),
    )


@admin.register(BlockedUser)
class BlockedUserAdmin(admin.ModelAdmin):
    """Admin for BlockedUser model"""
    list_display = ['blocker', 'blocked', 'created_at']
    list_filter = ['created_at']
    search_fields = ['blocker__username', 'blocked__username', 'reason']
    readonly_fields = ['created_at']


@admin.register(FavoriteUser)
class FavoriteUserAdmin(admin.ModelAdmin):
    """Admin for FavoriteUser model"""
    list_display = ['user', 'favorite', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__username', 'favorite__username', 'notes']
    readonly_fields = ['created_at']
