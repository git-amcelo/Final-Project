"""
Template-site URL routes for ratings.
"""
# pyrefly: ignore [missing-import]
from django.urls import path

from . import views

app_name = 'ratings_web'

urlpatterns = [
    path('mine/', views.my_ratings, name='mine'),
    path('rate/<int:user_id>/', views.rate_member, name='rate'),
]
