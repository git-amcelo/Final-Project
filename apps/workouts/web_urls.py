"""
Template-site URL routes for workout sessions.
"""
# pyrefly: ignore [missing-import]
from django.urls import path

from . import views

app_name = 'workouts_web'

urlpatterns = [
    path('', views.SessionListView.as_view(), name='list'),
    path('new/', views.SessionCreateView.as_view(), name='create'),
    path('<int:pk>/', views.SessionDetailView.as_view(), name='detail'),
    path('<int:pk>/edit/', views.SessionUpdateView.as_view(), name='edit'),
    path('<int:pk>/delete/', views.SessionDeleteView.as_view(), name='delete'),
    path('<int:pk>/request/', views.request_to_join_web, name='request_join'),
    path('<int:pk>/accept/<int:user_id>/', views.accept_participant_web, name='accept'),
    path('<int:pk>/reject/<int:user_id>/', views.reject_participant_web, name='reject'),
    path('<int:pk>/leave/', views.leave_session_web, name='leave'),
]
