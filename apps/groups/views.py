"""
Views for workout group management
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
from django.db.models import Q, F, Count
# pyrefly: ignore [missing-import]
from django.shortcuts import get_object_or_404

from .models import WorkoutGroup, GroupMembership, GroupSession, GroupSessionAttendance
from .serializers import (
    WorkoutGroupSerializer,
    CreateWorkoutGroupSerializer,
    WorkoutGroupListSerializer,
    GroupMembershipSerializer,
    GroupSessionSerializer,
    CreateGroupSessionSerializer,
    GroupSessionAttendanceSerializer,
)


# ==================== Workout Group Views ====================

class WorkoutGroupListCreateView(generics.ListCreateAPIView):
    """
    List and create workout groups
    GET /api/groups/ - List groups
    POST /api/groups/ - Create new group
    """
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['group_type', 'workout_frequency', 'fitness_level_required']
    search_fields = ['name', 'description', 'tagline', 'focus_areas']
    ordering_fields = ['created_at', 'member_count']
    ordering = ['-is_featured', '-created_at']

    def get_queryset(self):
        queryset = WorkoutGroup.objects.filter(
            is_active=True
        ).select_related('creator').prefetch_related('members')

        # Filter by focus area
        focus_area = self.request.query_params.get('focus')
        if focus_area:
            queryset = queryset.filter(focus_areas__contains=[focus_area])

        return queryset.annotate(
            active_member_count=Count('members', filter=Q(members__status='active'))
        )

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CreateWorkoutGroupSerializer
        return WorkoutGroupListSerializer

    def perform_create(self, serializer):
        serializer.save()


class WorkoutGroupDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete a specific workout group
    GET /api/groups/{id}/
    PUT/PATCH /api/groups/{id}/
    DELETE /api/groups/{id}/
    """
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'slug'

    def get_queryset(self):
        return WorkoutGroup.objects.filter(is_active=True).select_related('creator').prefetch_related('members')

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return CreateWorkoutGroupSerializer
        return WorkoutGroupSerializer

    def perform_update(self, serializer):
        """Only admins can update"""
        group = self.get_object()
        membership = GroupMembership.objects.filter(
            group=group,
            user=self.request.user,
            role='admin',
            status='active'
        ).exists()

        if not membership:
            raise permissions.PermissionDenied(
                "Only group admins can update the group"
            )

        serializer.save()

    def perform_destroy(self, instance):
        """Only admins can delete (deactivate) groups"""
        membership = GroupMembership.objects.filter(
            group=instance,
            user=self.request.user,
            role='admin',
            status='active'
        ).exists()

        if not membership:
            raise permissions.PermissionDenied(
                "Only group admins can delete the group"
            )

        # Soft delete
        instance.is_active = False
        instance.save()


# ==================== Group Membership Views ====================

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def join_group(request, slug):
    """
    Request to join a group (or join directly if open)
    POST /api/groups/{slug}/join/
    """
    group = get_object_or_404(WorkoutGroup, slug=slug, is_active=True)

    # Check if already a member
    if GroupMembership.objects.filter(
        group=group,
        user=request.user,
        status='active'
    ).exists():
        return Response(
            {'error': 'You are already a member of this group'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Check for pending request
    if GroupMembership.objects.filter(
        group=group,
        user=request.user,
        status='pending'
    ).exists():
        return Response(
            {'error': 'You already have a pending request'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Handle based on group type
    if group.group_type == 'open':
        # Direct join
        membership = GroupMembership.objects.create(
            group=group,
            user=request.user,
            role='member',
            status='active'
        )

        serializer = GroupMembershipSerializer(membership)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    else:
        # Create pending request
        membership = GroupMembership.objects.create(
            group=group,
            user=request.user,
            role='member',
            status='pending',
            message=request.data.get('message', '')
        )

        serializer = GroupMembershipSerializer(membership)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def leave_group(request, slug):
    """
    Leave a group
    POST /api/groups/{slug}/leave/
    """
    group = get_object_or_404(WorkoutGroup, slug=slug)

    membership = get_object_or_404(
        GroupMembership,
        group=group,
        user=request.user,
        status='active'
    )

    # Check if admin (can't leave if last admin)
    if membership.role == 'admin':
        admin_count = GroupMembership.objects.filter(
            group=group,
            role='admin',
            status='active'
        ).count()
        if admin_count == 1:
            return Response(
                {'error': 'Cannot leave as the last admin. Transfer ownership or delete group.'},
                status=status.HTTP_400_BAD_REQUEST
            )

    # Deactivate membership
    membership.status = 'inactive'
    membership.save()

    group.member_count = F('member_count') - 1
    group.save(update_fields=['member_count'])

    return Response({'message': 'Successfully left the group'})


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def my_groups(request):
    """
    Get groups for the current user
    GET /api/groups/my/
    """
    memberships = GroupMembership.objects.filter(
        user=request.user,
        status='active'
    ).select_related('group')

    groups = [m.group for m in memberships if m.group.is_active]
    serializer = WorkoutGroupListSerializer(groups, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def approve_membership(request, slug, user_id):
    """
    Approve a pending group membership
    POST /api/groups/{slug}/approve/{user_id}/
    """
    group = get_object_or_404(WorkoutGroup, slug=slug)

    # Check if user is admin/moderator
    membership = GroupMembership.objects.filter(
        group=group,
        user=request.user,
        status='active',
        role__in=['admin', 'moderator']
    ).first()

    if not membership:
        return Response(
            {'error': 'Only admins and moderators can approve memberships'},
            status=status.HTTP_403_FORBIDDEN
        )

    # Get pending membership
    pending_membership = get_object_or_404(
        GroupMembership,
        group=group,
        user_id=user_id,
        status='pending'
    )

    pending_membership.status = 'active'
    pending_membership.save()

    group.member_count = F('member_count') + 1
    group.save(update_fields=['member_count'])

    serializer = GroupMembershipSerializer(pending_membership)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def remove_member(request, slug, user_id):
    """
    Remove a member from the group
    POST /api/groups/{slug}/remove/{user_id}/
    """
    group = get_object_or_404(WorkoutGroup, slug=slug)

    # Check if user is admin
    membership = GroupMembership.objects.filter(
        group=group,
        user=request.user,
        status='active',
        role='admin'
    ).first()

    if not membership:
        return Response(
            {'error': 'Only admins can remove members'},
            status=status.HTTP_403_FORBIDDEN
        )

    # Get member to remove
    member_membership = get_object_or_404(
        GroupMembership,
        group=group,
        user_id=user_id,
        status__in=['active', 'pending']
    )

    old_status = member_membership.status
    member_membership.status = 'inactive'
    member_membership.save()

    if old_status == 'active':
        group.member_count = F('member_count') - 1
        group.save(update_fields=['member_count'])
        return Response({'message': 'Member removed successfully'})
    else:
        return Response({'message': 'Membership request rejected'})


# ==================== Group Session Views ====================

class GroupSessionListCreateView(generics.ListCreateAPIView):
    """
    List and create group sessions
    GET /api/groups/{slug}/sessions/ - List sessions
    POST /api/groups/{slug}/sessions/ - Create new session
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        group_slug = self.kwargs.get('slug')
        group = get_object_or_404(WorkoutGroup, slug=group_slug, is_active=True)
        return GroupSession.objects.filter(
            group=group
        ).select_related('created_by').prefetch_related('attendances').order_by('scheduled_datetime')

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CreateGroupSessionSerializer
        return GroupSessionSerializer

    def perform_create(self, serializer):
        group_slug = self.kwargs.get('slug')
        group = get_object_or_404(WorkoutGroup, slug=group_slug, is_active=True)

        # Check permission
        membership = GroupMembership.objects.filter(
            group=group,
            user=self.request.user,
            status='active',
            role__in=['admin', 'moderator']
        ).exists()

        if not membership:
            raise permissions.PermissionDenied(
                "Only admins and moderators can create sessions"
            )

        serializer.save(group=group, created_by=self.request.user)
        group.session_count = F('session_count') + 1
        group.save(update_fields=['session_count'])


class GroupSessionDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete a specific group session
    GET /api/groups/sessions/{id}/
    PUT/PATCH /api/groups/sessions/{id}/
    DELETE /api/groups/sessions/{id}/
    """
    serializer_class = GroupSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return GroupSession.objects.select_related('group', 'created_by').prefetch_related('attendances')

    def perform_update(self, serializer):
        session = self.get_object()
        membership = GroupMembership.objects.filter(
            group=session.group,
            user=self.request.user,
            status='active',
            role__in=['admin', 'moderator']
        ).exists()

        if not membership:
            raise permissions.PermissionDenied(
                "Only admins and moderators can update sessions"
            )

        serializer.save()

    def perform_destroy(self, instance):
        membership = GroupMembership.objects.filter(
            group=instance.group,
            user=self.request.user,
            status='active',
            role__in=['admin', 'moderator']
        ).exists()

        if not membership:
            raise permissions.PermissionDenied(
                "Only admins and moderators can delete sessions"
            )

        instance.delete()


# ==================== Session Attendance Views ====================

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def rsvp_session(request, session_id):
    """
    RSVP to a group session
    POST /api/groups/sessions/{id}/rsvp/
    """
    session = get_object_or_404(GroupSession, id=session_id)

    # Check if user is group member
    membership = GroupMembership.objects.filter(
        group=session.group,
        user=request.user,
        status='active'
    ).first()

    if not membership:
        return Response(
            {'error': 'You must be a group member to RSVP'},
            status=status.HTTP_403_FORBIDDEN
        )

    # Get or create attendance
    attendance, created = GroupSessionAttendance.objects.get_or_create(
        session=session,
        user=request.user,
        defaults={'status': request.data.get('status', 'going')}
    )

    if not created:
        attendance.status = request.data.get('status', 'going')
        attendance.save()

    serializer = GroupSessionAttendanceSerializer(attendance)
    return Response(serializer.data)


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def cancel_rsvp(request, session_id):
    """
    Cancel RSVP to a group session
    DELETE /api/groups/sessions/{id}/rsvp/
    """
    session = get_object_or_404(GroupSession, id=session_id)
    attendance = get_object_or_404(
        GroupSessionAttendance,
        session=session,
        user=request.user
    )

    # Update attendee count if was attending
    if attendance.status in ['going', 'attended']:
        session.current_attendees = F('current_attendees') - 1
        session.save(update_fields=['current_attendees'])

    attendance.delete()
    return Response({'message': 'RSVP cancelled successfully'})


# ==================== Template-site views (session auth) ====================
# pyrefly: ignore [missing-import]
from django.contrib import messages
# pyrefly: ignore [missing-import]
from django.contrib.auth.decorators import login_required
# pyrefly: ignore [missing-import]
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
# pyrefly: ignore [missing-import]
from django.db.models import F as _F, Q as _Q
# pyrefly: ignore [missing-import]
from django.shortcuts import redirect
# pyrefly: ignore [missing-import]
from django.urls import reverse
# pyrefly: ignore [missing-import]
from django.utils import timezone
# pyrefly: ignore [missing-import]
from django.utils.text import slugify
# pyrefly: ignore [missing-import]
from django.views.generic import CreateView, DetailView, ListView

from .forms import GroupForm, GroupSearchForm, GroupSessionForm


class GroupListView(ListView):
    """Class-based index view of groups. Public, with keyword search and
    a predefined group-type dropdown."""

    model = WorkoutGroup
    template_name = 'groups/group_list.html'
    context_object_name = 'groups'
    paginate_by = 9

    def get_queryset(self):
        queryset = WorkoutGroup.objects.filter(is_active=True).select_related('creator')
        q = self.request.GET.get('q', '').strip()
        if q:
            queryset = queryset.filter(
                _Q(name__icontains=q)
                | _Q(description__icontains=q)
                | _Q(tagline__icontains=q)
                | _Q(primary_location__icontains=q)
            )
        group_type = self.request.GET.get('group_type', '')
        if group_type:
            queryset = queryset.filter(group_type=group_type)

        scope = self.request.GET.get('scope', '')
        if scope == 'mine' and self.request.user.is_authenticated:
            queryset = queryset.filter(members__user=self.request.user, members__status='active')

        return queryset

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['search_form'] = GroupSearchForm(self.request.GET or None)
        context['scope'] = self.request.GET.get('scope', '')
        return context


class GroupDetailView(DetailView):
    """Class-based detail view of one group, with its member list and
    the visitor's own membership status."""

    model = WorkoutGroup
    template_name = 'groups/group_detail.html'
    context_object_name = 'group'
    slug_field = 'slug'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['active_members'] = (
            self.object.members.filter(status='active').select_related('user')
        )
        membership = None
        if self.request.user.is_authenticated:
            membership = self.object.members.filter(user=self.request.user).first()
        context['membership'] = membership
        can_manage = bool(
            membership and membership.status == 'active'
            and membership.role in ('admin', 'moderator')
        )
        context['can_manage'] = can_manage
        if can_manage:
            context['pending_memberships'] = self.object.members.filter(
                status='pending'
            ).select_related('user')
        context['upcoming_sessions'] = self.object.scheduled_sessions.filter(
            scheduled_datetime__gte=timezone.now()
        ).order_by('scheduled_datetime')[:3]
        return context


class GroupCreateView(LoginRequiredMixin, CreateView):
    model = WorkoutGroup
    form_class = GroupForm
    template_name = 'groups/group_form.html'

    def form_valid(self, form):
        form.instance.creator = self.request.user
        # Build a unique slug from the group name
        base_slug = slugify(form.instance.name, allow_unicode=True) or 'group'
        slug = base_slug
        suffix = 2
        while WorkoutGroup.objects.filter(slug=slug).exists():
            slug = f'{base_slug}-{suffix}'
            suffix += 1
        form.instance.slug = slug

        response = super().form_valid(form)
        GroupMembership.objects.create(
            group=self.object, user=self.request.user, role='admin', status='active',
        )
        messages.success(self.request, f'Group "{self.object.name}" has been created.')
        return response

    def get_success_url(self):
        return reverse('groups_web:detail', args=[self.object.slug])


@login_required
def join_group_web(request, slug):
    """Join a group from the site. Open groups join instantly; closed
    groups create a pending membership awaiting approval."""
    group = get_object_or_404(WorkoutGroup, slug=slug, is_active=True)

    if request.method != 'POST':
        return redirect('groups_web:detail', slug=slug)

    membership = group.members.filter(user=request.user).first()
    if membership and membership.status in ('active', 'pending'):
        messages.info(request, 'You are already part of this group.')
    elif group.group_type == 'private':
        messages.error(request, 'This group is invite-only.')
    elif group.member_count_actual >= group.max_members:
        messages.error(request, 'This group is full.')
    else:
        status_value = 'active' if group.group_type == 'open' else 'pending'
        if membership:
            membership.status = status_value
            membership.save()
        else:
            GroupMembership.objects.create(
                group=group, user=request.user, role='member', status=status_value,
            )
        if status_value == 'active':
            messages.success(request, f'Welcome to {group.name}!')
        else:
            messages.info(request, 'Your request to join is pending approval.')
    return redirect('groups_web:detail', slug=slug)


@login_required
def leave_group_web(request, slug):
    group = get_object_or_404(WorkoutGroup, slug=slug)

    if request.method != 'POST':
        return redirect('groups_web:detail', slug=slug)

    membership = group.members.filter(user=request.user).exclude(status='inactive').first()
    if membership is None:
        messages.info(request, 'You are not a member of this group.')
    elif membership.role == 'admin':
        messages.error(request, 'Group admins cannot leave their own group.')
    else:
        membership.status = 'inactive'
        membership.save()
        messages.info(request, f'You have left {group.name}.')
    return redirect('groups_web:detail', slug=slug)


# ==================== Membership approve/reject (template site) ====================

@login_required
def approve_membership_web(request, slug, user_id):
    """Approve a pending member. Admins and moderators may approve —
    mirrors approve_membership's role check exactly."""
    group = get_object_or_404(WorkoutGroup, slug=slug)
    if request.method != 'POST':
        return redirect('groups_web:detail', slug=slug)

    caller_membership = group.members.filter(
        user=request.user, status='active', role__in=['admin', 'moderator']
    ).first()
    if not caller_membership:
        messages.error(request, 'Only admins and moderators can approve memberships.')
        return redirect('groups_web:detail', slug=slug)

    pending = group.members.filter(user_id=user_id, status='pending').first()
    if pending is None:
        messages.error(request, 'That membership request is no longer pending.')
    else:
        pending.status = 'active'
        pending.save()
        group.member_count = _F('member_count') + 1
        group.save(update_fields=['member_count'])
        messages.success(request, f'{pending.user.username} has been approved.')
    return redirect('groups_web:detail', slug=slug)


@login_required
def reject_membership_web(request, slug, user_id):
    """Reject a pending member. Admin-only — mirrors remove_member's role
    check exactly (deliberately stricter than approve, matching the API)."""
    group = get_object_or_404(WorkoutGroup, slug=slug)
    if request.method != 'POST':
        return redirect('groups_web:detail', slug=slug)

    caller_membership = group.members.filter(
        user=request.user, status='active', role='admin'
    ).first()
    if not caller_membership:
        messages.error(request, 'Only admins can reject membership requests.')
        return redirect('groups_web:detail', slug=slug)

    pending = group.members.filter(user_id=user_id, status='pending').first()
    if pending is None:
        messages.error(request, 'That membership request is no longer pending.')
    else:
        pending.status = 'inactive'
        pending.save()
        messages.info(request, f'{pending.user.username}\'s request has been rejected.')
    return redirect('groups_web:detail', slug=slug)


# ==================== Group scheduling & RSVP (template site) ====================

class GroupAdminOrModMixin(UserPassesTestMixin):
    """Only an active admin/moderator of the group in the URL may proceed."""

    def test_func(self):
        group = get_object_or_404(WorkoutGroup, slug=self.kwargs['slug'])
        return group.members.filter(
            user=self.request.user, status='active', role__in=['admin', 'moderator']
        ).exists()


class GroupSessionListView(LoginRequiredMixin, ListView):
    """Scheduled sessions for one group, with each viewer's RSVP status."""

    template_name = 'groups/group_session_list.html'
    context_object_name = 'sessions'
    paginate_by = 12

    def get_group(self):
        return get_object_or_404(WorkoutGroup, slug=self.kwargs['slug'])

    def get_queryset(self):
        return self.get_group().scheduled_sessions.select_related('created_by').order_by(
            'scheduled_datetime'
        )

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        group = self.get_group()
        context['group'] = group
        context['can_manage'] = group.members.filter(
            user=self.request.user, status='active', role__in=['admin', 'moderator']
        ).exists()
        my_rsvps = {
            a.session_id: a.status for a in GroupSessionAttendance.objects.filter(
                session__group=group, user=self.request.user
            )
        }
        for session in context['sessions']:
            session.my_status = my_rsvps.get(session.pk)
        return context


class GroupSessionCreateView(LoginRequiredMixin, GroupAdminOrModMixin, CreateView):
    model = GroupSession
    form_class = GroupSessionForm
    template_name = 'groups/group_session_form.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['group'] = get_object_or_404(WorkoutGroup, slug=self.kwargs['slug'])
        return context

    def form_valid(self, form):
        group = get_object_or_404(WorkoutGroup, slug=self.kwargs['slug'])
        form.instance.group = group
        form.instance.created_by = self.request.user
        response = super().form_valid(form)
        group.session_count = _F('session_count') + 1
        group.save(update_fields=['session_count'])
        messages.success(self.request, f'"{form.instance.title}" has been scheduled.')
        return response

    def get_success_url(self):
        return reverse('groups_web:sessions', args=[self.kwargs['slug']])


@login_required
def rsvp_session_web(request, session_id):
    session = get_object_or_404(GroupSession, pk=session_id)
    if request.method != 'POST':
        return redirect('groups_web:sessions', slug=session.group.slug)

    is_member = session.group.members.filter(user=request.user, status='active').exists()
    if not is_member:
        messages.error(request, 'You must be a group member to RSVP.')
        return redirect('groups_web:sessions', slug=session.group.slug)

    rsvp_status = request.POST.get('status', 'going')
    GroupSessionAttendance.objects.update_or_create(
        session=session, user=request.user, defaults={'status': rsvp_status},
    )
    messages.success(request, 'Your RSVP has been saved.')
    return redirect('groups_web:sessions', slug=session.group.slug)


@login_required
def cancel_rsvp_web(request, session_id):
    session = get_object_or_404(GroupSession, pk=session_id)
    if request.method != 'POST':
        return redirect('groups_web:sessions', slug=session.group.slug)

    attendance = GroupSessionAttendance.objects.filter(session=session, user=request.user).first()
    if attendance:
        if attendance.status in ('going', 'attended'):
            session.current_attendees = _F('current_attendees') - 1
            session.save(update_fields=['current_attendees'])
        attendance.delete()
        messages.info(request, 'Your RSVP has been cancelled.')
    return redirect('groups_web:sessions', slug=session.group.slug)
