"""
NEXUS Arena — Celery Tasks
Asynchronous tasks for challenge statistics, notifications, and leaderboard management.
"""

import logging
from datetime import timedelta

from celery import shared_task
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.db import transaction
from django.db.models import Count, Sum
from django.utils import timezone

logger = logging.getLogger(__name__)
User = get_user_model()


# ─── Challenge Statistics ─────────────────────────────────────────────────────

@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=60,
    queue="stats",
    name="apps.arena.tasks.update_challenge_stats",
)
def update_challenge_stats(self):
    """
    Mise a jour periodique des statistiques de tous les challenges.
    - Nombre de solves
    - Taux de reussite
    - Score moyen des participants
    Tourne toutes les 5 minutes via Celery Beat.
    """
    try:
        from apps.arena.models import Challenge, ChallengeStats, Submission

        logger.info("Starting challenge stats update...")
        updated_count = 0

        challenges = Challenge.objects.filter(is_active=True).prefetch_related("submissions")

        for challenge in challenges:
            solved_count = challenge.submissions.filter(is_correct=True).values("user").distinct().count()
            total_attempts = challenge.submissions.count()
            unique_solvers = challenge.submissions.filter(is_correct=True).values_list("user_id", flat=True).distinct()

            success_rate = (solved_count / total_attempts * 100) if total_attempts > 0 else 0.0

            ChallengeStats.objects.update_or_create(
                challenge=challenge,
                defaults={
                    "solve_count": solved_count,
                    "attempt_count": total_attempts,
                    "success_rate": round(success_rate, 2),
                    "unique_solver_count": len(unique_solvers),
                    "last_updated": timezone.now(),
                },
            )
            updated_count += 1

        logger.info("Challenge stats updated for %d challenges.", updated_count)
        return {"status": "success", "challenges_updated": updated_count}

    except Exception as exc:
        logger.error("Error updating challenge stats: %s", exc, exc_info=True)
        raise self.retry(exc=exc)


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=30,
    queue="stats",
    name="apps.arena.tasks.refresh_leaderboard",
)
def refresh_leaderboard(self):
    """
    Recalcule et met en cache le classement global des hackers.
    Prend en compte les points de tous les challenges resolus.
    """
    try:
        from apps.arena.models import Submission
        from apps.matrix.models import UserProfile

        logger.info("Refreshing leaderboard...")

        # Calculer les scores de chaque utilisateur
        user_scores = (
            Submission.objects.filter(is_correct=True)
            .values("user_id")
            .annotate(total_score=Sum("challenge__points"))
            .order_by("-total_score")
        )

        with transaction.atomic():
            for rank, entry in enumerate(user_scores, start=1):
                UserProfile.objects.filter(user_id=entry["user_id"]).update(
                    total_score=entry["total_score"],
                    global_rank=rank,
                    rank_updated_at=timezone.now(),
                )

        logger.info("Leaderboard refreshed for %d users.", len(user_scores))
        return {"status": "success", "users_ranked": len(user_scores)}

    except Exception as exc:
        logger.error("Error refreshing leaderboard: %s", exc, exc_info=True)
        raise self.retry(exc=exc)


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=120,
    queue="default",
    name="apps.arena.tasks.check_tournament_status",
)
def check_tournament_status(self):
    """
    Verifie l'etat des tournois et les cloture automatiquement si leur date de fin est depassee.
    """
    try:
        from apps.arena.models import Tournament

        now = timezone.now()
        ended_count = 0
        started_count = 0

        # Tournois qui devraient commencer
        tournaments_to_start = Tournament.objects.filter(
            status="upcoming",
            start_date__lte=now,
        )
        for tournament in tournaments_to_start:
            tournament.status = "active"
            tournament.save(update_fields=["status"])
            started_count += 1
            logger.info("Tournament '%s' started.", tournament.name)

        # Tournois qui devraient se terminer
        tournaments_to_end = Tournament.objects.filter(
            status="active",
            end_date__lte=now,
        )
        for tournament in tournaments_to_end:
            tournament.status = "ended"
            tournament.save(update_fields=["status"])
            ended_count += 1
            logger.info("Tournament '%s' ended.", tournament.name)

            # Declencher la notification de fin de tournoi
            send_tournament_end_notification.delay(tournament.id)

        return {"status": "success", "started": started_count, "ended": ended_count}

    except Exception as exc:
        logger.error("Error checking tournament status: %s", exc, exc_info=True)
        raise self.retry(exc=exc)


# ─── Notifications ────────────────────────────────────────────────────────────

@shared_task(
    bind=True,
    max_retries=5,
    default_retry_delay=30,
    queue="notifications",
    name="apps.arena.tasks.send_ctf_notification",
)
def send_ctf_notification(self, user_id: int, challenge_id: int):
    """
    Envoie une notification email a un utilisateur apres qu'il ait resolu un challenge CTF.

    Args:
        user_id: ID de l'utilisateur
        challenge_id: ID du challenge resolu
    """
    try:
        from apps.arena.models import Challenge

        user = User.objects.get(id=user_id)
        challenge = Challenge.objects.get(id=challenge_id)

        subject = f"[NEXUS] Challenge resolu : {challenge.name}"
        message = (
            f"Felicitations {user.username} !\n\n"
            f"Vous avez resolu le challenge '{challenge.name}' "
            f"(categorie : {challenge.category}, difficulte : {challenge.difficulty}).\n\n"
            f"Points gagnes : +{challenge.points}\n\n"
            f"Continuez comme ca, hacker !\n\n"
            f"-- L'equipe NEXUS"
        )
        html_message = f"""
        <html>
        <body style="font-family: monospace; background: #0a0a0f; color: #00ff88; padding: 20px;">
            <h2 style="color: #00ff88;">NEXUS CTF — Challenge Resolu</h2>
            <p>Felicitations <strong>{user.username}</strong> !</p>
            <p>Vous avez resolu : <strong style="color: #ff6b35;">{challenge.name}</strong></p>
            <table style="border: 1px solid #333; padding: 10px; margin: 10px 0;">
                <tr><td>Categorie</td><td><strong>{challenge.category}</strong></td></tr>
                <tr><td>Difficulte</td><td><strong>{challenge.difficulty}</strong></td></tr>
                <tr><td>Points</td><td><strong style="color: #00ff88;">+{challenge.points}</strong></td></tr>
            </table>
            <p>Continuez comme ca, hacker !</p>
            <p style="color: #666;">-- L'equipe NEXUS</p>
        </body>
        </html>
        """

        send_mail(
            subject=subject,
            message=message,
            from_email="noreply@nexus.io",
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )

        logger.info(
            "CTF notification sent to user %s for challenge %s",
            user.username,
            challenge.name,
        )
        return {"status": "success", "user": user.username, "challenge": challenge.name}

    except User.DoesNotExist:
        logger.error("User %d not found for CTF notification.", user_id)
        return {"status": "error", "message": f"User {user_id} not found"}

    except Exception as exc:
        logger.error(
            "Error sending CTF notification to user %d for challenge %d: %s",
            user_id, challenge_id, exc,
            exc_info=True,
        )
        raise self.retry(exc=exc)


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=60,
    queue="notifications",
    name="apps.arena.tasks.send_tournament_end_notification",
)
def send_tournament_end_notification(self, tournament_id: int):
    """
    Notifie tous les participants de la fin d'un tournoi avec le classement final.

    Args:
        tournament_id: ID du tournoi termine
    """
    try:
        from apps.arena.models import Tournament, TournamentParticipant

        tournament = Tournament.objects.prefetch_related("participants").get(id=tournament_id)
        participants = TournamentParticipant.objects.filter(
            tournament=tournament
        ).select_related("user").order_by("-score")

        notified_count = 0
        for rank, participant in enumerate(participants[:3], start=1):
            medals = {1: "Or", 2: "Argent", 3: "Bronze"}
            medal = medals.get(rank, "")

            subject = f"[NEXUS] Tournoi '{tournament.name}' termine — Vous etes {rank}{'er' if rank == 1 else 'eme'} !"
            message = (
                f"Le tournoi '{tournament.name}' est termine !\n\n"
                f"Votre classement final : #{rank} {medal}\n"
                f"Score total : {participant.score} points\n\n"
                f"Merci d'avoir participe !\n\n-- L'equipe NEXUS"
            )

            send_mail(
                subject=subject,
                message=message,
                from_email="noreply@nexus.io",
                recipient_list=[participant.user.email],
                fail_silently=True,
            )
            notified_count += 1

        logger.info(
            "Tournament end notifications sent for '%s' (%d users).",
            tournament.name, notified_count,
        )
        return {"status": "success", "tournament": tournament.name, "notified": notified_count}

    except Exception as exc:
        logger.error("Error sending tournament end notifications: %s", exc, exc_info=True)
        raise self.retry(exc=exc)
