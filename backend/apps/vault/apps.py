from django.apps import AppConfig


class VaultConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.vault'
    verbose_name = 'Vault — User Profiles & Trophies'

    def ready(self):
        import apps.vault.signals  # noqa: F401
