"""
Template-site view for the buddy-matching page.
"""
# pyrefly: ignore [missing-import]
from django.contrib.auth.decorators import login_required
# pyrefly: ignore [missing-import]
from django.shortcuts import render

from apps.users.models import UserProfile
from .forms import MatchFilterForm
from .services import find_matches_for_user


@login_required
def find_buddies_web(request):
    """Run the same matching algorithm the API uses and render scored
    results as cards. Filters are entirely optional (GET params)."""
    UserProfile.objects.get_or_create(user=request.user)

    # Always bind: every field is optional, so an empty querystring still
    # validates and runs the search — filters just come back as no-ops.
    form = MatchFilterForm(request.GET)
    matches, total_found = [], 0
    if form.is_valid():
        matches, total_found = find_matches_for_user(
            request.user, form.cleaned_filters(), limit=20
        )

    return render(request, 'matching/find_buddies.html', {
        'form': form,
        'matches': matches,
        'total_found': total_found,
        'has_filters': bool(request.GET),
    })
