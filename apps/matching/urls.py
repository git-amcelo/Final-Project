"""
URL configuration for matching app
"""
# pyrefly: ignore [missing-import]
from django.urls import path
from .views import (
    FindBuddiesView,
    CompatibilityDetailView,
    MatchingPreferencesView,
    TopMatchesView,
)

urlpatterns = [
    # Find compatible buddies
    path('matching/find-buddies/', FindBuddiesView.as_view(), name='find_buddies'),
    path('matching/top-matches/', TopMatchesView.as_view(), name='top_matches'),

    # Compatibility details
    path('matching/compatibility/<int:user_id>/', CompatibilityDetailView.as_view(), name='compatibility_detail'),

    # Preferences
    path('matching/preferences/', MatchingPreferencesView.as_view(), name='matching_preferences'),
]
