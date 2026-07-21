"""
URL configuration for users app
"""
# pyrefly: ignore [missing-import]
from django.urls import path
# pyrefly: ignore [missing-import]
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    RegisterView,
    CustomTokenObtainPairView,
    ProfileView,
    PublicProfileView,
    UserListView,
    FavoriteListView,
    FavoriteDetailView,
    BlockedUserListView,
    BlockedUserDetailView,
    me_view,
    update_profile_picture,
    forgot_password,
)

app_name = 'users'

urlpatterns = [
    # Authentication endpoints
    path('register/', RegisterView.as_view(), name='register'),
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('forgot-password/', forgot_password, name='forgot_password'),

    # Profile endpoints
    path('profile/', ProfileView.as_view(), name='profile'),
    path('profile-picture/', update_profile_picture, name='update_profile_picture'),
    path('me/', me_view, name='me'),
    path('<int:id>/', PublicProfileView.as_view(), name='public_profile'),

    # User list/search
    path('', UserListView.as_view(), name='user_list'),

    # Favorites
    path('favorites/', FavoriteListView.as_view(), name='favorites_list'),
    path('favorites/<int:id>/', FavoriteDetailView.as_view(), name='favorite_detail'),

    # Blocked users
    path('blocked/', BlockedUserListView.as_view(), name='blocked_list'),
    path('blocked/<int:id>/', BlockedUserDetailView.as_view(), name='blocked_detail'),
]
