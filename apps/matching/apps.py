# pyrefly: ignore [missing-import]
from django.apps import AppConfig


class MatchingConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.matching'
    verbose_name = 'Smart Matching'
