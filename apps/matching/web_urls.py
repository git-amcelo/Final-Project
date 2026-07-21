"""
Template-site URL routes for the buddy-matching page.
"""
# pyrefly: ignore [missing-import]
from django.urls import path

from . import web_views

app_name = 'matching_web'

urlpatterns = [
    path('', web_views.find_buddies_web, name='find'),
]
