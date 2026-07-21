"""
Template-site URL routes for accounts, profiles and history.
"""
# pyrefly: ignore [missing-import]
from django.urls import path

from . import views

app_name = 'users_web'

urlpatterns = [
    path('accounts/signup/', views.SignUpView.as_view(), name='signup'),
    path('profile/', views.profile_view, name='profile'),
    path('profile/edit/', views.profile_edit, name='profile_edit'),
    path('members/', views.MemberListView.as_view(), name='members'),
    path('members/<int:pk>/', views.MemberDetailView.as_view(), name='member_detail'),
    path('members/<int:user_id>/favorite/', views.favorite_user_web, name='favorite'),
    path('members/<int:user_id>/unfavorite/', views.unfavorite_user_web, name='unfavorite'),
    path('members/<int:user_id>/block/', views.block_user_web, name='block'),
    path('members/<int:user_id>/unblock/', views.unblock_user_web, name='unblock'),
    path('favorites/', views.FavoriteListWebView.as_view(), name='favorites'),
    path('blocked/', views.BlockedListWebView.as_view(), name='blocked'),
    path('history/', views.history_view, name='history'),
]
