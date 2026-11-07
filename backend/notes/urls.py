from django.urls import path
from . import views

urlpatterns = [
    path('notes/', views.NoteListCreateView.as_view(), name='note-list'),
    path('notes/delete/<int:pk>/', views.NoteDelete.as_view(), name='delete-note'),
    path("notes/update/<int:pk>/", views.NoteUpdateView.as_view(), name="update-note"),
    path("reminders/run/", views.process_note_reminders, name="process-note-reminders"),
]