from django.urls import path
from .views import TranslatorView
from django.conf import settings
from django.conf.urls.static import static
 
urlpatterns = [
    path("translate/", TranslatorView.as_view()),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)