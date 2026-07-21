"""
URL configuration for ratings app
"""
# pyrefly: ignore [missing-import]
from django.urls import path
from .views import (
    RatingListCreateView,
    RatingDetailView,
    user_rating_stats,
    my_rating_summary,
    recent_ratings,
    session_ratings,
    rate_session_partner,
)

urlpatterns = [
    # Rating CRUD
    path('ratings/', RatingListCreateView.as_view(), name='rating_list_create'),

    # Rating stats (must be before <int:id> to avoid shadowing)
    path('ratings/stats/<int:user_id>/', user_rating_stats, name='user_rating_stats'),
    path('ratings/summary/', my_rating_summary, name='my_rating_summary'),
    path('ratings/recent/', recent_ratings, name='recent_ratings'),

    # Session ratings
    path('ratings/session/<int:session_id>/', session_ratings, name='session_ratings'),
    path('ratings/session/<int:session_id>/rate/', rate_session_partner, name='rate_session_partner'),

    path('ratings/<int:id>/', RatingDetailView.as_view(), name='rating_detail'),
]
