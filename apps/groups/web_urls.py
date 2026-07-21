"""
Template-site URL routes for workout groups.
"""
# pyrefly: ignore [missing-import]
from django.urls import path

from . import views

app_name = 'groups_web'

urlpatterns = [
    path('', views.GroupListView.as_view(), name='list'),
    path('new/', views.GroupCreateView.as_view(), name='create'),
    path('<slug:slug>/', views.GroupDetailView.as_view(), name='detail'),
    path('<slug:slug>/join/', views.join_group_web, name='join'),
    path('<slug:slug>/leave/', views.leave_group_web, name='leave'),
    path('<slug:slug>/approve/<int:user_id>/', views.approve_membership_web, name='approve'),
    path('<slug:slug>/reject/<int:user_id>/', views.reject_membership_web, name='reject'),
    path('<slug:slug>/sessions/', views.GroupSessionListView.as_view(), name='sessions'),
    path('<slug:slug>/sessions/new/', views.GroupSessionCreateView.as_view(), name='session_create'),
    path('sessions/<int:session_id>/rsvp/', views.rsvp_session_web, name='session_rsvp'),
    path('sessions/<int:session_id>/rsvp/cancel/', views.cancel_rsvp_web, name='session_rsvp_cancel'),
]
