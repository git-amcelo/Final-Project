"""
Views for user ratings
"""
# pyrefly: ignore [missing-import]
from rest_framework import generics, status, permissions
# pyrefly: ignore [missing-import]
from rest_framework.decorators import api_view, permission_classes
# pyrefly: ignore [missing-import]
from rest_framework.response import Response
# pyrefly: ignore [missing-import]
from django.db.models import Count, Avg, Q
# pyrefly: ignore [missing-import]
from django.shortcuts import get_object_or_404

from .models import Rating
from .serializers import (
    RatingSerializer,
    CreateRatingSerializer,
    RatingSummarySerializer,
)


# ==================== Rating Views ====================

class RatingListCreateView(generics.ListCreateAPIView):
    """
    List and create ratings
    GET /api/ratings/ - List ratings (filtered)
    POST /api/ratings/ - Create new rating
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Rating.objects.select_related(
            'from_user__profile', 'to_user__profile', 'session', 'group'
        )

        # Filter by 'received' to show ratings received by current user
        if self.request.query_params.get('received') == 'true':
            queryset = queryset.filter(to_user=self.request.user)

        # Filter by 'given' to show ratings given by current user
        if self.request.query_params.get('given') == 'true':
            queryset = queryset.filter(from_user=self.request.user)

        # Filter by user_id (ratings received by user)
        user_id = self.request.query_params.get('user_id')
        if user_id:
            queryset = queryset.filter(to_user_id=user_id)

        # Filter by from_user_id (ratings given by user)
        from_user_id = self.request.query_params.get('from_user_id')
        if from_user_id:
            queryset = queryset.filter(from_user_id=from_user_id)

        # Filter by session
        session_id = self.request.query_params.get('session_id')
        if session_id:
            queryset = queryset.filter(session_id=session_id)

        return queryset.order_by('-created_at')

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CreateRatingSerializer
        return RatingSerializer

    def perform_create(self, serializer):
        serializer.save(from_user=self.request.user)


class RatingDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete a specific rating
    GET /api/ratings/{id}/
    PUT/PATCH /api/ratings/{id}/
    DELETE /api/ratings/{id}/
    """
    serializer_class = RatingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Rating.objects.select_related(
            'from_user', 'to_user', 'session', 'group'
        )

    def perform_update(self, serializer):
        """Only the rater can update"""
        if self.get_object().from_user != self.request.user:
            raise permissions.PermissionDenied(
                "You can only edit your own ratings"
            )
        serializer.save()

    def perform_destroy(self, instance):
        """Only the rater can delete"""
        if instance.from_user != self.request.user:
            raise permissions.PermissionDenied(
                "You can only delete your own ratings"
            )

        # Get profile before deleting
        profile = getattr(instance.to_user, 'profile', None)
        
        # Delete instance first
        instance.delete()
        
        # Update recipient's rating after deleting
        if profile:
            profile.update_rating()


# ==================== User Rating Stats ====================

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_rating_stats(request, user_id=None):
    """
    Get rating statistics for a user
    GET /api/ratings/stats/{user_id}/
    """
    target_user_id = user_id or request.user.id

    ratings = Rating.objects.filter(to_user_id=target_user_id)

    if not ratings.exists():
        return Response({
            'total_ratings': 0,
            'average_score': 0.0,
            'score_distribution': {},
            'would_workout_again_percentage': 0.0
        })

    # Calculate stats
    total = ratings.count()
    avg_score = round(ratings.aggregate(avg=Avg('score'))['avg'] or 0, 1)

    # Score distribution
    score_dist = {}
    for i in range(1, 6):
        score_dist[str(i)] = ratings.filter(score=i).count()

    # Would workout again percentage
    would_again_count = ratings.filter(would_workout_again=True).count()
    would_again_pct = round((would_again_count / total) * 100, 1) if total > 0 else 0

    # Category averages
    category_avgs = ratings.aggregate(
        avg_punctuality=Avg('punctuality'),
        avg_communication=Avg('communication'),
        avg_effort=Avg('effort'),
        avg_knowledge=Avg('knowledge')
    )

    return Response({
        'total_ratings': total,
        'average_score': avg_score,
        'score_distribution': score_dist,
        'would_workout_again_percentage': would_again_pct,
        'category_averages': {
            'punctuality': round(category_avgs['avg_punctuality'] or 0, 1),
            'communication': round(category_avgs['avg_communication'] or 0, 1),
            'effort': round(category_avgs['avg_effort'] or 0, 1),
            'knowledge': round(category_avgs['avg_knowledge'] or 0, 1),
        }
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def my_rating_summary(request):
    """
    Get current user's rating summary
    GET /api/ratings/summary/
    """
    return user_rating_stats(request, request.user.id)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def recent_ratings(request, limit=10):
    """
    Get recent ratings for the current user
    GET /api/ratings/recent/
    """
    ratings = Rating.objects.filter(
        to_user=request.user
    ).select_related(
        'from_user__profile', 'session'
    ).order_by('-created_at')[:limit]

    serializer = RatingSerializer(ratings, many=True)
    return Response(serializer.data)


# ==================== Session Ratings ====================

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def session_ratings(request, session_id):
    """
    Get all ratings for a specific session
    GET /api/ratings/session/{session_id}/
    """
    ratings = Rating.objects.filter(
        session_id=session_id
    ).select_related('from_user', 'to_user')

    serializer = RatingSerializer(ratings, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def rate_session_partner(request, session_id):
    """
    Rate a workout session partner
    POST /api/ratings/session/{session_id}/rate/
    """
    # pyrefly: ignore [missing-import]
    from apps.workouts.models import WorkoutSession

    session = get_object_or_404(
        WorkoutSession,
        id=session_id
    )

    if session.status != 'completed' and not (session.status == 'accepted' and session.is_past):
        return Response(
            {'error': 'Workout must be completed or in the past to be rated'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Determine who to rate (for 1-on-1)
    if session.session_type == '1on1':
        if session.creator == request.user:
            to_rate = session.participant
        elif session.participant == request.user:
            to_rate = session.creator
        else:
            return Response(
                {'error': 'You were not part of this session'},
                status=status.HTTP_403_FORBIDDEN
            )
    else:
        # For group sessions, rate a specific user
        to_rate_id = request.data.get('to_user_id')
        if not to_rate_id:
            return Response(
                {'error': 'to_user_id is required for group sessions'},
                status=status.HTTP_400_BAD_REQUEST
            )
        # pyrefly: ignore [missing-import]
        from django.contrib.auth import get_user_model
        User = get_user_model()
        to_rate = get_object_or_404(User, id=to_rate_id)

    if not to_rate:
        return Response(
            {'error': 'Could not determine user to rate'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Check for existing rating
    if Rating.objects.filter(
        from_user=request.user,
        to_user=to_rate,
        session=session
    ).exists():
        return Response(
            {'error': 'You have already rated this user for this session'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Create rating
    data = request.data.copy()
    data['to_user'] = to_rate.id
    data['session'] = session.id
    
    serializer = CreateRatingSerializer(data=data, context={'request': request})
    serializer.is_valid(raise_exception=True)
    serializer.save(
        from_user=request.user,
        to_user=to_rate,
        session=session
    )

    return Response(serializer.data, status=status.HTTP_201_CREATED)


# ==================== Template-site views (session auth) ====================
# pyrefly: ignore [missing-import]
from django.contrib import messages
# pyrefly: ignore [missing-import]
from django.contrib.auth import get_user_model
# pyrefly: ignore [missing-import]
from django.contrib.auth.decorators import login_required
# pyrefly: ignore [missing-import]
from django.shortcuts import redirect, render

from .forms import RatingForm


@login_required
def my_ratings(request):
    """Reviews the user has received and given."""
    received = request.user.received_ratings.select_related('from_user').all()
    given = request.user.given_ratings.select_related('to_user').all()
    return render(request, 'ratings/my_ratings.html', {
        'received': received,
        'given': given,
    })


def _was_in_session(session, user):
    return (
        session.creator_id == user.id
        or session.participant_id == user.id
        or session.participants.filter(user=user, status='accepted').exists()
    )


@login_required
def rate_member(request, user_id):
    """Rate another member. If a general (non-session) rating already
    exists it is updated instead of duplicated.

    Pass ?session=<id> (GET or POST) to rate a specific workout session
    instead — mirrors rate_session_partner's eligibility window (completed,
    or accepted-and-past) and requires both users actually took part."""
    to_user = get_object_or_404(get_user_model(), pk=user_id)

    if to_user == request.user:
        messages.error(request, 'You cannot rate yourself.')
        return redirect('users_web:members')

    session_id = request.GET.get('session') or request.POST.get('session')
    session = None
    if session_id:
        # pyrefly: ignore [missing-import]
        from apps.workouts.models import WorkoutSession
        session = get_object_or_404(WorkoutSession, pk=session_id)

        eligible = session.status == 'completed' or (
            session.status == 'accepted' and session.is_past
        )
        if not eligible:
            messages.error(request, 'This workout must be completed or in the past to be rated.')
            return redirect('workouts_web:detail', pk=session.pk)

        if not _was_in_session(session, request.user) or not _was_in_session(session, to_user):
            messages.error(request, 'That user was not part of this session.')
            return redirect('workouts_web:detail', pk=session.pk)

    existing = Rating.objects.filter(
        from_user=request.user, to_user=to_user, session=session,
    ).first()

    if request.method == 'POST':
        form = RatingForm(request.POST, instance=existing)
        if form.is_valid():
            rating = form.save(commit=False)
            rating.from_user = request.user
            rating.to_user = to_user
            rating.session = session
            rating.save()
            action = 'updated' if existing is not None else 'saved'
            messages.success(request, f'Your review of {to_user.username} has been {action}.')
            if session:
                return redirect('workouts_web:detail', pk=session.pk)
            if hasattr(to_user, 'profile'):
                return redirect('users_web:member_detail', pk=to_user.profile.pk)
            return redirect('users_web:members')
    else:
        form = RatingForm(instance=existing)

    return render(request, 'ratings/rating_form.html', {
        'form': form,
        'to_user': to_user,
        'session': session,
        'is_update': existing is not None,
    })
