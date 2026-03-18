from django.urls import path
from .views import TranslatorView
 
urlpatterns = [
    path("translate/", TranslatorView.as_view()),
]