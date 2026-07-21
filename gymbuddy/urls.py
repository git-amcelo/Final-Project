"""
GymBuddy URL Configuration
"""
# pyrefly: ignore [missing-import]
from django.contrib import admin
# pyrefly: ignore [missing-import]
from django.urls import path, include
# pyrefly: ignore [missing-import]
from django.conf import settings
# pyrefly: ignore [missing-import]
from django.conf.urls.static import static
# pyrefly: ignore [missing-import]
from django.contrib.auth import views as auth_views

from apps.users.forms import LoginForm, PasswordResetRequestForm, SetNewPasswordForm

urlpatterns = [
    path('admin/', admin.site.urls),

    # Template site (session auth, Bootstrap pages)
    path('', include('gymbuddy.web_urls')),
    path('accounts/login/',
         auth_views.LoginView.as_view(authentication_form=LoginForm),
         name='login'),
    path('accounts/logout/', auth_views.LogoutView.as_view(), name='logout'),
    path('accounts/password_reset/',
         auth_views.PasswordResetView.as_view(form_class=PasswordResetRequestForm),
         name='password_reset'),
    path('accounts/password_reset/done/',
         auth_views.PasswordResetDoneView.as_view(),
         name='password_reset_done'),
    path('accounts/reset/<uidb64>/<token>/',
         auth_views.PasswordResetConfirmView.as_view(form_class=SetNewPasswordForm),
         name='password_reset_confirm'),
    path('accounts/reset/done/',
         auth_views.PasswordResetCompleteView.as_view(),
         name='password_reset_complete'),
    path('', include('apps.users.web_urls')),
    path('sessions/', include('apps.workouts.web_urls')),
    path('community/', include('apps.groups.web_urls')),
    path('reviews/', include('apps.ratings.web_urls')),
    path('matching/', include('apps.matching.web_urls')),

    # Authentication and user management (combined)
    path('api/', include(('apps.users.urls', 'users'), namespace='api')),
    # Workout sessions
    path('api/', include('apps.workouts.urls')),
    # Groups
    path('api/', include('apps.groups.urls')),
    # Matching algorithm
    path('api/', include('apps.matching.urls')),
    # Ratings
    path('api/', include('apps.ratings.urls')),
]

# Serve media (uploaded profile pictures, group images) in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
