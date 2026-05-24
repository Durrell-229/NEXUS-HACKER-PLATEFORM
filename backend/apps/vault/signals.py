"""
Vault signals — automatically create UserStats on new user creation.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model

User = get_user_model()


@receiver(post_save, sender=User)
def create_user_stats(sender, instance, created, **kwargs):
    """Ensure every new user has a UserStats record."""
    if created:
        from .models import UserStats
        UserStats.objects.get_or_create(user=instance)
