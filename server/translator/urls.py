from rest_framework.urlpatterns import format_suffix_patterns
from django.urls import path
from .views import TranslatorViews

urlpatterns = [
    path('translate/', TranslatorViews.as_view(), name='translate'),
]

urlpatterns = format_suffix_patterns(urlpatterns)