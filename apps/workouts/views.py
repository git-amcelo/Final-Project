"""
Views for workout session management
"""
# pyrefly: ignore [missing-import]
from rest_framework import generics, status, permissions, filters
# pyrefly: ignore [missing-import]
from rest_framework.decorators import api_view, permission_classes
# pyrefly: ignore [missing-import]
from rest_framework.response import Response
# pyrefly: ignore [missing-import]
from django_filters.rest_framework import DjangoFilterBackend
# pyrefly: ignore [missing-import]
from django.db.models import Q, F
# pyrefly: ignore [missing-import]
from django.utils import timezone
# pyrefly: ignore [missing-import]
from django.shortcuts import get_object_or_404

from .models import WorkoutSession, SessionParticipant, SessionRequest
from .serializers import (
    WorkoutSessionSerializer,
    CreateWorkoutSessionSerializer,
    WorkoutSessionListSerializer,
    SessionParticipantSerializer,
    SessionRequestSerializer,
)


# ==================== Workout Session Views ====================

class WorkoutSessionListCreateView(generics.ListCreateAPIView):
    """
    List and create workout sessions
    GET /api/workouts/ - List sessions
    POST /api/workouts/ - Create new session
    """
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['session_type', 'status', 'intensity']
    search_fields = ['title', 'description', 'location', 'focus_areas']
    ordering_fields = ['scheduled_datetime', 'created_at']
    ordering = ['scheduled_datetime']

    def get_queryset(self):
        # Get blocked user IDs
        from apps.users.models import BlockedUser
        blocked_ids = BlockedUser.objects.filter(
            blocker=self.request.user
        ).values_list('blocked_id', flat=True)

        # Base queryset - exclude blocked users' sessions and cancelled sessions
        queryset = WorkoutSession.objects.exclude(
            Q(creator_id__in=blocked_ids) | Q(participant_id__in=blocked_ids)
        ).exclude(
            status='cancelled'
        ).select_related('creator', 'participant').prefetch_related('participants')

        # Filter by 'my' parameter to show user's sessions
        if self.request.query_params.get('my') == 'true':
            queryset = queryset.filter(
                Q(creator=self.request.user) | Q(participant=self.request.user)
            )

        # Filter by 'available' parameter for open sessions
        if self.request.query_params.get('available') == 'true':
            queryset = queryset.filter(
                Q(status='accepted') | Q(status='pending')
            ).filter(
                scheduled_datetime__gt=timezone.now()
            )

        return queryset.distinct()

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CreateWorkoutSessionSerializer
        return WorkoutSessionListSerializer

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user, current_participants=1)


class WorkoutSessionDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete a specific workout session
    GET /api/workouts/{id}/
    PUT/PATCH /api/workouts/{id}/
    DELETE /api/workouts/{id}/
    """
    serializer_class = WorkoutSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return WorkoutSession.objects.select_related(
            'creator', 'participant'
        ).prefetch_related('participants', 'join_requests')

    def perform_update(self, serializer):
        """Check permissions and update session"""
        instance = self.get_object()
        user = self.request.user

        # Only creator or participant can update
        if instance.creator != user and instance.participant != user:
            raise permissions.PermissionDenied(
                "You don't have permission to update this session"
            )

        serializer.save()

    def perform_destroy(self, instance):
        """Only creator can delete (cancel) sessions"""
        if instance.creator != self.request.user:
            raise permissions.PermissionDenied(
                "Only the creator can cancel this session"
            )

        # Soft delete by marking as cancelled
        instance.status = 'cancelled'
        instance.save()


# ==================== Session Actions ====================

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def request_to_join(request, session_id):
    """
    Request to join a workout session
    POST /api/workouts/{id}/request/
    """
    session = get_object_or_404(WorkoutSession, id=session_id)

    # Check if user can request
    if session.creator == request.user or session.participant == request.user:
        return Response(
            {'error': 'You are already part of this session'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if session.status not in ['pending', 'accepted']:
        return Response(
            {'error': 'This session is not accepting new requests'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if session.is_past:
        return Response(
            {'error': 'Cannot join past sessions'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Check for existing pending request
    existing = SessionRequest.objects.filter(session=session, requester=request.user)
    pending = existing.filter(status='pending')
    if pending.exists():
        return Response(
            {'error': 'You already have a pending request for this session'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Remove old rejected/cancelled/accepted requests so user can re-request
    # (accepted requests remain if user previously left the session)
    existing.exclude(status='pending').delete()

    # Create join request
    join_request = SessionRequest.objects.create(
        session=session,
        requester=request.user,
        message=request.data.get('message', '')
    )

    serializer = SessionRequestSerializer(join_request)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def accept_participant(request, session_id, user_id):
    """
    Accept a participant into the session
    POST /api/workouts/{id}/accept/{user_id}/
    """
    session = get_object_or_404(WorkoutSession, id=session_id)

    # Only creator can accept
    if session.creator != request.user:
        return Response(
            {'error': 'Only the creator can accept participants'},
            status=status.HTTP_403_FORBIDDEN
        )

    # Get the join request
    join_request = get_object_or_404(
        SessionRequest,
        session=session,
        requester_id=user_id,
        status='pending'
    )

    if session.session_type == '1on1':
        # For 1-on-1, set as participant
        if session.participant:
            return Response(
                {'error': 'Session already has a participant'},
                status=status.HTTP_400_BAD_REQUEST
            )
        session.participant_id = user_id
        session.status = 'accepted'
    else:
        # For group sessions, add to participants
        if session.current_participants >= session.max_participants:
            return Response(
                {'error': 'Session is full'},
                status=status.HTTP_400_BAD_REQUEST
            )
        SessionParticipant.objects.create(
            session=session,
            user_id=user_id,
            status='accepted'
        )
        session.current_participants = F('current_participants') + 1

    session.save()
    join_request.status = 'accepted'
    join_request.responded_at = timezone.now()
    join_request.save()

    return Response({'message': 'Participant accepted successfully'})


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def reject_participant(request, session_id, user_id):
    """
    Reject a participant request
    POST /api/workouts/{id}/reject/{user_id}/
    """
    session = get_object_or_404(WorkoutSession, id=session_id)

    # Only creator can reject
    if session.creator != request.user:
        return Response(
            {'error': 'Only the creator can reject participants'},
            status=status.HTTP_403_FORBIDDEN
        )

    # Get and update the join request
    join_request = get_object_or_404(
        SessionRequest,
        session=session,
        requester_id=user_id,
        status='pending'
    )

    join_request.status = 'rejected'
    join_request.responded_at = timezone.now()
    join_request.save()

    return Response({'message': 'Participant request rejected'})


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def leave_session(request, session_id):
    """
    Leave a workout session
    POST /api/workouts/{id}/leave/
    """
    session = get_object_or_404(WorkoutSession, id=session_id)

    # Check if user is part of the session
    if session.creator == request.user:
        return Response(
            {'error': 'Creator cannot leave. Cancel the session instead.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if session.participant == request.user:
        session.participant = None
        session.status = 'pending'
        session.save()
        return Response({'message': 'Left the session successfully'})

    # Check if user is a group participant
    participant = SessionParticipant.objects.filter(
        session=session,
        user=request.user
    ).first()

    if participant:
        participant.status = 'declined'
        participant.save()
        session.current_participants = F('current_participants') - 1
        session.save()
        return Response({'message': 'Left the group session successfully'})

    return Response(
        {'error': 'You are not part of this session'},
        status=status.HTTP_400_BAD_REQUEST
    )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def my_sessions(request):
    """
    Get all sessions for the current user
    GET /api/workouts/my/
    """
    # Get blocked user IDs
    from apps.users.models import BlockedUser
    blocked_ids = BlockedUser.objects.filter(
        blocker=request.user
    ).values_list('blocked_id', flat=True)

    queryset = WorkoutSession.objects.filter(
        Q(creator=request.user) | Q(participant=request.user)
    ).exclude(
        status='cancelled'
    ).exclude(
        Q(creator_id__in=blocked_ids) | Q(participant_id__in=blocked_ids)
    ).select_related('creator', 'participant').order_by('scheduled_datetime')

    serializer = WorkoutSessionListSerializer(queryset, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def available_sessions(request):
    """
    Get available sessions user can join
    GET /api/workouts/available/
    """
    from apps.users.models import BlockedUser, UserProfile

    blocked_ids = BlockedUser.objects.filter(
        blocker=request.user
    ).values_list('blocked_id', flat=True)

    user_profile = getattr(request.user, 'profile', None)

    queryset = WorkoutSession.objects.filter(
        status__in=['pending', 'accepted']
    ).filter(
        scheduled_datetime__gt=timezone.now()
    ).exclude(
        Q(creator=request.user) | Q(participant=request.user)
    ).exclude(
        Q(creator_id__in=blocked_ids)
    ).select_related('creator', 'participant')

    # Apply user's fitness level filter if available
    if user_profile and user_profile.fitness_level:
        # You could filter by compatible fitness levels here
        pass

    # Apply location filter
    location_query = request.query_params.get('location')
    if location_query:
        queryset = queryset.filter(location__icontains=location_query)

    # Apply type and intensity filters
    session_type_query = request.query_params.get('session_type')
    if session_type_query:
        queryset = queryset.filter(session_type=session_type_query)

    intensity_query = request.query_params.get('intensity')
    if intensity_query:
        queryset = queryset.filter(intensity=intensity_query)

    # Apply keyword search across title, description, and location
    search_query = request.query_params.get('search')
    if search_query:
        queryset = queryset.filter(
            Q(title__icontains=search_query)
            | Q(description__icontains=search_query)
            | Q(location__icontains=search_query)
        )

    serializer = WorkoutSessionListSerializer(queryset, many=True)
    return Response(serializer.data)


# ==================== Template-site views (session auth) ====================
# pyrefly: ignore [missing-import]
from django.contrib import messages
# pyrefly: ignore [missing-import]
from django.contrib.auth.decorators import login_required
# pyrefly: ignore [missing-import]
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
# pyrefly: ignore [missing-import]
from django.db.models import Q as _Q
# pyrefly: ignore [missing-import]
from django.shortcuts import redirect
# pyrefly: ignore [missing-import]
from django.urls import reverse, reverse_lazy
# pyrefly: ignore [missing-import]
from django.views.generic import (
    CreateView, DeleteView, DetailView, ListView, UpdateView,
)

from .forms import SessionSearchForm, WorkoutSessionForm


class SessionListView(ListView):
    """Class-based index view. Public: guests can browse sessions.
    Search bar keyword + predefined dropdowns filter the queryset."""

    model = WorkoutSession
    template_name = 'workouts/session_list.html'
    context_object_name = 'sessions'
    paginate_by = 9

    def get_queryset(self):
        queryset = (
            WorkoutSession.objects
            .select_related('creator', 'participant')
            .order_by('-scheduled_datetime')
        )
        q = self.request.GET.get('q', '').strip()
        if q:
            queryset = queryset.filter(
                _Q(title__icontains=q)
                | _Q(description__icontains=q)
                | _Q(location__icontains=q)
            )
        session_type = self.request.GET.get('session_type', '')
        if session_type:
            queryset = queryset.filter(session_type=session_type)
        intensity = self.request.GET.get('intensity', '')
        if intensity:
            queryset = queryset.filter(intensity=intensity)
        location = self.request.GET.get('location', '').strip()
        if location:
            queryset = queryset.filter(location__icontains=location)

        scope = self.request.GET.get('scope', '')
        if scope == 'mine' and self.request.user.is_authenticated:
            queryset = queryset.filter(
                _Q(creator=self.request.user) | _Q(participant=self.request.user)
            )
        elif scope == 'open':
            # Mirrors the API's available_sessions: open window, not full/past.
            queryset = queryset.filter(
                status__in=['pending', 'accepted'],
                scheduled_datetime__gt=timezone.now(),
            )
            if self.request.user.is_authenticated:
                from apps.users.models import BlockedUser
                blocked_ids = BlockedUser.objects.filter(
                    blocker=self.request.user
                ).values_list('blocked_id', flat=True)
                queryset = queryset.exclude(
                    _Q(creator=self.request.user) | _Q(participant=self.request.user)
                ).exclude(creator_id__in=blocked_ids)

        return queryset

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['search_form'] = SessionSearchForm(self.request.GET or None)
        context['result_query'] = self.request.GET.get('q', '').strip()
        context['scope'] = self.request.GET.get('scope', '')
        return context


class SessionDetailView(DetailView):
    """Class-based detail view. Public, with extra actions for the creator."""

    model = WorkoutSession
    template_name = 'workouts/session_detail.html'
    context_object_name = 'session'

    def get_queryset(self):
        return WorkoutSession.objects.select_related('creator', 'participant')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        session = self.object
        user = self.request.user

        if session.session_type == 'group':
            context['accepted_participants'] = session.participants.filter(
                status='accepted'
            ).select_related('user', 'user__profile')

        if user.is_authenticated:
            is_creator = session.creator == user
            is_participant = (
                session.participant == user
                or session.participants.filter(user=user, status='accepted').exists()
            )
            context['is_creator'] = is_creator
            context['is_participant'] = is_participant
            context['can_request_join'] = (
                not is_creator and not is_participant
                and session.status in ('pending', 'accepted')
                and not session.is_past
            )
            context['user_join_request'] = session.join_requests.filter(
                requester=user, status='pending'
            ).first()
            if is_creator:
                context['pending_requests'] = session.join_requests.filter(
                    status='pending'
                ).select_related('requester', 'requester__profile')

            # Who this user could still rate for this session — mirrors
            # rate_session_partner's eligibility window (completed, or
            # accepted-and-past) and 1-on-1 partner derivation. For group
            # sessions the API accepts an arbitrary to_user_id with no
            # membership check, but the web form can only offer real
            # candidates, so we scope the UI to accepted co-participants.
            if session.status == 'completed' or (session.status == 'accepted' and session.is_past):
                from apps.ratings.models import Rating
                from apps.users.models import User

                candidates = []
                if session.session_type == '1on1':
                    if is_creator and session.participant:
                        candidates = [session.participant]
                    elif is_participant:
                        candidates = [session.creator]
                elif session.session_type == 'group':
                    if is_creator:
                        accepted_ids = session.participants.filter(
                            status='accepted'
                        ).values_list('user_id', flat=True)
                        candidates = list(User.objects.filter(id__in=accepted_ids))
                    elif is_participant:
                        candidates = [session.creator]

                already_rated = set(Rating.objects.filter(
                    from_user=user, session=session
                ).values_list('to_user_id', flat=True))
                context['ratable_participants'] = [
                    c for c in candidates if c.id not in already_rated
                ]

        return context


class SessionCreateView(LoginRequiredMixin, CreateView):
    model = WorkoutSession
    form_class = WorkoutSessionForm
    template_name = 'workouts/session_form.html'

    def form_valid(self, form):
        form.instance.creator = self.request.user
        # Sessions created on the site are open and joinable right away
        form.instance.status = 'accepted'
        response = super().form_valid(form)
        messages.success(self.request, f'Workout "{form.instance.title}" has been created.')
        return response

    def get_success_url(self):
        return reverse('workouts_web:detail', args=[self.object.pk])


class SessionCreatorOnlyMixin(UserPassesTestMixin):
    """Only the creator may edit or delete a session."""

    def test_func(self):
        return self.get_object().creator == self.request.user


class SessionUpdateView(LoginRequiredMixin, SessionCreatorOnlyMixin, UpdateView):
    model = WorkoutSession
    form_class = WorkoutSessionForm
    template_name = 'workouts/session_form.html'

    def form_valid(self, form):
        messages.success(self.request, 'Session updated.')
        return super().form_valid(form)

    def get_success_url(self):
        return reverse('workouts_web:detail', args=[self.object.pk])


class SessionDeleteView(LoginRequiredMixin, SessionCreatorOnlyMixin, DeleteView):
    model = WorkoutSession
    template_name = 'workouts/session_confirm_delete.html'
    context_object_name = 'session'
    success_url = reverse_lazy('workouts_web:list')

    def form_valid(self, form):
        messages.info(self.request, 'Session deleted.')
        return super().form_valid(form)


# ==================== Join-request workflow (template site) ====================
# These replicate the exact validation already proven in request_to_join /
# accept_participant / reject_participant / leave_session above, swapped
# from DRF Response objects to messages + redirect back to the detail page.

@login_required
def request_to_join_web(request, pk):
    session = get_object_or_404(WorkoutSession, pk=pk)
    if request.method != 'POST':
        return redirect('workouts_web:detail', pk=pk)

    if session.creator == request.user or session.participant == request.user:
        messages.error(request, 'You are already part of this session.')
    elif session.status not in ('pending', 'accepted'):
        messages.error(request, 'This session is not accepting new requests.')
    elif session.is_past:
        messages.error(request, 'Cannot join past sessions.')
    else:
        existing = SessionRequest.objects.filter(session=session, requester=request.user)
        if existing.filter(status='pending').exists():
            messages.info(request, 'You already have a pending request for this session.')
        else:
            # Old rejected/cancelled/accepted requests don't block a re-request.
            existing.exclude(status='pending').delete()
            SessionRequest.objects.create(
                session=session,
                requester=request.user,
                message=request.POST.get('message', ''),
            )
            messages.success(request, 'Your request to join has been sent.')
    return redirect('workouts_web:detail', pk=pk)


@login_required
def accept_participant_web(request, pk, user_id):
    session = get_object_or_404(WorkoutSession, pk=pk)
    if request.method != 'POST':
        return redirect('workouts_web:detail', pk=pk)

    if session.creator != request.user:
        messages.error(request, 'Only the creator can accept participants.')
        return redirect('workouts_web:detail', pk=pk)

    join_request = SessionRequest.objects.filter(
        session=session, requester_id=user_id, status='pending'
    ).first()
    if join_request is None:
        messages.error(request, 'That join request is no longer pending.')
        return redirect('workouts_web:detail', pk=pk)

    if session.session_type == '1on1':
        if session.participant:
            messages.error(request, 'Session already has a participant.')
            return redirect('workouts_web:detail', pk=pk)
        session.participant_id = user_id
        session.status = 'accepted'
    else:
        if session.current_participants >= session.max_participants:
            messages.error(request, 'Session is full.')
            return redirect('workouts_web:detail', pk=pk)
        SessionParticipant.objects.create(session=session, user_id=user_id, status='accepted')
        session.current_participants = F('current_participants') + 1

    session.save()
    join_request.status = 'accepted'
    join_request.responded_at = timezone.now()
    join_request.save()
    messages.success(request, 'Participant accepted.')
    return redirect('workouts_web:detail', pk=pk)


@login_required
def reject_participant_web(request, pk, user_id):
    session = get_object_or_404(WorkoutSession, pk=pk)
    if request.method != 'POST':
        return redirect('workouts_web:detail', pk=pk)

    if session.creator != request.user:
        messages.error(request, 'Only the creator can reject participants.')
        return redirect('workouts_web:detail', pk=pk)

    join_request = SessionRequest.objects.filter(
        session=session, requester_id=user_id, status='pending'
    ).first()
    if join_request is None:
        messages.error(request, 'That join request is no longer pending.')
    else:
        join_request.status = 'rejected'
        join_request.responded_at = timezone.now()
        join_request.save()
        messages.info(request, 'Join request rejected.')
    return redirect('workouts_web:detail', pk=pk)


@login_required
def leave_session_web(request, pk):
    session = get_object_or_404(WorkoutSession, pk=pk)
    if request.method != 'POST':
        return redirect('workouts_web:detail', pk=pk)

    if session.creator == request.user:
        messages.error(request, 'Creator cannot leave. Cancel the session instead.')
    elif session.participant == request.user:
        session.participant = None
        session.status = 'pending'
        session.save()
        messages.info(request, 'You left the session.')
    else:
        participant = SessionParticipant.objects.filter(
            session=session, user=request.user
        ).first()
        if participant:
            participant.status = 'declined'
            participant.save()
            session.current_participants = F('current_participants') - 1
            session.save()
            messages.info(request, 'You left the group session.')
        else:
            messages.error(request, 'You are not part of this session.')
    return redirect('workouts_web:detail', pk=pk)
