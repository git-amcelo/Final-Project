"""
Site-wide template views: home page, about, contact, dashboard.
"""
# pyrefly: ignore [missing-import]
from django.contrib import messages
# pyrefly: ignore [missing-import]
from django.contrib.auth.mixins import LoginRequiredMixin
# pyrefly: ignore [missing-import]
from django.db.models import Q
# pyrefly: ignore [missing-import]
from django.urls import reverse_lazy
# pyrefly: ignore [missing-import]
from django.utils import timezone
# pyrefly: ignore [missing-import]
from django.views.generic import TemplateView, FormView

from apps.groups.models import WorkoutGroup, GroupMembership
from apps.matching.services import find_matches_for_user
from apps.users.models import User, UserProfile
from apps.workouts.models import WorkoutSession

from .forms import ContactForm


class HomeView(TemplateView):
    """Public landing page. Guests see a teaser with site stats;
    registered users also get upcoming sessions and quick links."""

    template_name = 'home.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['stats'] = {
            'members': User.objects.count(),
            'sessions': WorkoutSession.objects.count(),
            'groups': WorkoutGroup.objects.count(),
        }
        context['upcoming_sessions'] = (
            WorkoutSession.objects
            .filter(scheduled_datetime__gte=timezone.now())
            .exclude(status__in=['cancelled', 'rejected'])
            .select_related('creator')
            .order_by('scheduled_datetime')[:6]
        )
        return context


class DashboardView(LoginRequiredMixin, TemplateView):
    """Authenticated landing page: personal stats, quick actions, upcoming
    workouts/groups, and buddy recommendations from the matching service."""

    template_name = 'dashboard.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        user = self.request.user
        profile, _ = UserProfile.objects.get_or_create(user=user)

        context['profile'] = profile
        context['stats'] = {
            'rating': profile.average_rating,
            'total_ratings': profile.total_ratings,
            'groups': GroupMembership.objects.filter(user=user, status='active').count(),
            'sessions': WorkoutSession.objects.filter(
                Q(creator=user) | Q(participant=user)
            ).exclude(status='cancelled').count(),
        }
        context['upcoming_workouts'] = (
            WorkoutSession.objects
            .filter(Q(creator=user) | Q(participant=user))
            .filter(scheduled_datetime__gte=timezone.now())
            .exclude(status='cancelled')
            .select_related('creator', 'participant')
            .order_by('scheduled_datetime')[:4]
        )
        context['my_groups'] = (
            WorkoutGroup.objects
            .filter(members__user=user, members__status='active')
            .distinct()[:3]
        )
        matches, _total = find_matches_for_user(user, limit=4)
        context['recommended_buddies'] = matches
        return context


class AboutView(TemplateView):
    template_name = 'about.html'


class ContactView(FormView):
    template_name = 'contact.html'
    form_class = ContactForm
    success_url = reverse_lazy('web:contact')

    def form_valid(self, form):
        messages.success(
            self.request,
            f"Thanks {form.cleaned_data['name']}! Your message has been received "
            "and our team will get back to you soon.",
        )
        return super().form_valid(form)
