from django.shortcuts import render
from .models import Note
from .serializers import NoteSerializer
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

import logging
import secrets
from datetime import timedelta
from django.utils import timezone
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.core.mail import send_mail
import html
from django.utils.html import strip_tags
from django.db.models import Q

# Create your views here.
class NoteListCreateView(generics.ListCreateAPIView):
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Note.objects.filter(author=user)

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class NoteUpdateView(generics.UpdateAPIView):
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Note.objects.filter(author=user)

    def perform_update(self, serializer):
        old_reminder = serializer.instance.reminder_at
        new_reminder = serializer.validated_data.get(
            "reminder_at",
            old_reminder
        )

        if new_reminder != old_reminder:
            serializer.save(
                reminder_status="pending",
                reminder_claimed_at=None,
                reminder_sent_at=None
            )

        else:
            serializer.save()


class NoteDelete(generics.DestroyAPIView):
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Note.objects.filter(author=user)



logger = logging.getLogger(__name__)

@csrf_exempt
@require_POST
def process_note_reminders(request):
    # Authenticate the external scheduler
    expected_token = getattr(
        settings,
        "NOTE_REMINDER_CRON_TOKEN",
        ""
    )

    received_token = request.headers.get("X-Cron-Token", "")

    if not expected_token or not secrets.compare_digest(
        expected_token,
        received_token
    ):
        return JsonResponse(
            {"error": "Unauthorized"},
            status=403
        )

    now = timezone.now()

    # Recover reminders that may have been interrupted
    stale_before = now - timedelta(minutes=15)

    eligible_statuses = (
        Q(reminder_status="pending")
        |
        Q(
            reminder_status="sending",
            reminder_claimed_at__lt=stale_before
        )
        |
        Q(
            reminder_status="sending",
            reminder_claimed_at__isnull=True
        )
    )

    due_notes = Note.objects.filter(
        reminder_at__lte=now
    ).filter(
        eligible_statuses
    ).values_list("id", flat=True)[:50]

    sent_count = 0
    failed_count = 0

    for note_id in due_notes:

        # Claim this reminder so another request cannot process it
        claimed = Note.objects.filter(
            Q(reminder_status="pending")
            |
            Q(
                reminder_status="sending",
                reminder_claimed_at__lt=stale_before
            )
            |
            Q(
                reminder_status="sending",
                reminder_claimed_at__isnull=True
            ),
            id=note_id,
            reminder_at__lte=now,
        ).update(
            reminder_status="sending",
            reminder_claimed_at=now
        )

        if not claimed:
            continue

        try:
            note = Note.objects.select_related(
                "author"
            ).get(id=note_id)

            recipient = note.author.email

            if not recipient:
                Note.objects.filter(id=note_id).update(
                    reminder_status="failed",
                    reminder_claimed_at=None
                )

                failed_count += 1
                continue

            note_content = html.unescape(
                strip_tags(note.content)
            )

            login_url = "https://note-nest-bird.vercel.app/login"

            email_body = (
                f"Hello {note.author.username},\n\n"
                f"This is a reminder about your note:\n\n"
                f"{note.title}\n\n"
                f"{note_content}\n\n"
                "Open NoteNest to view your note.\n\n"
                f"Click here to log in: {login_url}"
            )

            result = send_mail(
                subject=f"NoteNest Reminder: {note.title}",
                message=email_body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[recipient],
                fail_silently=False,
            )

            if result == 1:

                Note.objects.filter(id=note_id).update(
                    reminder_status="sent",
                    reminder_sent_at=timezone.now(),
                    reminder_claimed_at=None
                )

                sent_count += 1

            else:

                Note.objects.filter(id=note_id).update(
                    reminder_status="pending",
                    reminder_claimed_at=None
                )

                failed_count += 1

        except Exception:

            logger.exception(
                "Failed to send reminder for note %s",
                note_id
            )

            Note.objects.filter(id=note_id).update(
                reminder_status="pending",
                reminder_claimed_at=None
            )

            failed_count += 1

    return JsonResponse({
        "message": "Reminder processing completed.",
        "sent": sent_count,
        "failed": failed_count,
    })