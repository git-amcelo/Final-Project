"""
Session and cookie based visit tracking for the User History feature.

Every page view on the template site is counted per-day in the user's
session, and the most recent pages are remembered so the History page
can show what the visitor looked at. A `last_visit` cookie lets us greet
returning visitors with the time of their previous visit.
"""
# pyrefly: ignore [missing-import]
from django.utils import timezone

SKIP_PREFIXES = ('/api/', '/static/', '/media/', '/admin/', '/__debug__/', '/favicon')

PAGE_LABELS = {
    '/': 'Home',
    '/about/': 'About Us',
    '/contact/': 'Contact Us',
    '/history/': 'My History',
    '/profile/': 'My Profile',
    '/members/': 'Find Buddies',
    '/sessions/': 'Workout Sessions',
    '/community/': 'Groups',
    '/accounts/login/': 'Login',
    '/accounts/signup/': 'Sign Up',
}


class VisitHistoryMiddleware:
    """Tracks visits in the session (per-day counts + recent pages) and
    mirrors the last visit time into a cookie."""

    MAX_RECENT_PAGES = 10
    MAX_TRACKED_DAYS = 30

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        track = request.method == 'GET' and not request.path.startswith(SKIP_PREFIXES)

        if track:
            now = timezone.localtime()
            today = now.date().isoformat()

            # Per-day visit counter lives in the session
            counts = request.session.get('visit_counts', {})
            counts[today] = counts.get(today, 0) + 1
            # Keep only the most recent days so the session stays small
            for day in sorted(counts)[:-self.MAX_TRACKED_DAYS]:
                del counts[day]
            request.session['visit_counts'] = counts

            # Remember the last few pages viewed
            recent = request.session.get('recent_pages', [])
            recent.insert(0, {
                'path': request.get_full_path(),
                'label': PAGE_LABELS.get(request.path, request.path),
                'time': now.strftime('%Y-%m-%d %H:%M'),
            })
            request.session['recent_pages'] = recent[:self.MAX_RECENT_PAGES]

        response = self.get_response(request)

        if track:
            # Cookie survives the session so returning visitors are recognised
            response.set_cookie(
                'last_visit',
                timezone.localtime().strftime('%Y-%m-%d %H:%M'),
                max_age=365 * 24 * 3600,
                samesite='Lax',
            )
        return response
