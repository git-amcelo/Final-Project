"""
URL configuration for groups app
"""
# pyrefly: ignore [missing-import]
from django.urls import path
from .views import (
    WorkoutGroupListCreateView,
    WorkoutGroupDetailView,
    join_group,
    leave_group,
    my_groups,
    approve_membership,
    remove_member,
    GroupSessionListCreateView,
    GroupSessionDetailView,
    rsvp_session,
    cancel_rsvp,
)

urlpatterns = [
    # Group CRUD
    path('groups/', WorkoutGroupListCreateView.as_view(), name='group_list_create'),
    path('groups/my/', my_groups, name='my_groups'),
    path('groups/<slug:slug>/', WorkoutGroupDetailView.as_view(), name='group_detail'),

    # Group membership
    path('groups/<slug:slug>/join/', join_group, name='join_group'),
    path('groups/<slug:slug>/leave/', leave_group, name='leave_group'),
    path('groups/<slug:slug>/approve/<int:user_id>/', approve_membership, name='approve_membership'),
    path('groups/<slug:slug>/remove/<int:user_id>/', remove_member, name='remove_member'),

    # Group sessions
    path('groups/<slug:slug>/sessions/', GroupSessionListCreateView.as_view(), name='group_sessions'),
    path('groups/sessions/<int:id>/', GroupSessionDetailView.as_view(), name='group_session_detail'),
    path('groups/sessions/<int:id>/rsvp/', rsvp_session, name='rsvp_session'),
    path('groups/sessions/<int:session_id>/rsvp/cancel/', cancel_rsvp, name='cancel_rsvp'),
]
