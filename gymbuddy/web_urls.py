"""
URL routes for the site-wide template pages.
"""
# pyrefly: ignore [missing-import]
from django.urls import path

from . import views

app_name = 'web'

urlpatterns = [
    path('', views.HomeView.as_view(), name='home'),
    path('about/', views.AboutView.as_view(), name='about'),
    path('contact/', views.ContactView.as_view(), name='contact'),
    path('dashboard/', views.DashboardView.as_view(), name='dashboard'),
]
