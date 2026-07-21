"""
URL configuration for workouts app
"""
# pyrefly: ignore [missing-import]
from django.urls import path
from .views import (
    WorkoutSessionListCreateView,
    WorkoutSessionDetailView,
    request_to_join,
    accept_participant,
    reject_participant,
    leave_session,
    my_sessions,
    available_sessions,
)

urlpatterns = [
    # Session CRUD
    path('workouts/', WorkoutSessionListCreateView.as_view(), name='session_list_create'),

    # Special endpoints (must be before <int:id> to avoid shadowing)
    path('workouts/my/', my_sessions, name='my_sessions'),
    path('workouts/available/', available_sessions, name='available_sessions'),

    path('workouts/<int:pk>/', WorkoutSessionDetailView.as_view(), name='session_detail'),

    # Session actions
    path('workouts/<int:session_id>/request/', request_to_join, name='request_to_join'),
    path('workouts/<int:session_id>/accept/<int:user_id>/', accept_participant, name='accept_participant'),
    path('workouts/<int:session_id>/reject/<int:user_id>/', reject_participant, name='reject_participant'),
    path('workouts/<int:session_id>/leave/', leave_session, name='leave_session'),
]
