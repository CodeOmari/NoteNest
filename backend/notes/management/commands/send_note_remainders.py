from django.core.management.base import BaseCommand
from django.core.mail import send_mail
from django.utils import timezone
from django.utils.html import strip_tags

from notes.models import Note


class Command(BaseCommand):

    help = "Send scheduled NoteNest email reminders"

    def handle(self, *args, **kwargs):

        now = timezone.now()

        # Find reminders that are due and haven't been sent.
        reminders = Note.objects.filter(
            reminder_at__lte=now,
            reminder_sent=False
        ).select_related("author")

        sent_count = 0
        failed_count = 0

        for note in reminders:

            recipient = note.author.email

            if not recipient:
                self.stdout.write(
                    self.style.WARNING(
                        f"Skipping note {note.id}: no email address."
                    )
                )
                continue

            reminder_date = timezone.localtime(
                note.reminder_at
            ).strftime("%d %B %Y at %I:%M %p")

            subject = f"NoteNest Reminder: {note.title}"

            message = f"""
                Hello {note.author.username},

                This is a friendly reminder about your NoteNest note.

                Note title: {note.title}

                Reminder scheduled for: {reminder_date}

                Note content:
                {strip_tags(note.content)}

                It's time to revisit your note!

                Best regards,
                The NoteNest Team
            """

            try:

                result = send_mail(
                    subject=subject,
                    message=message,
                    from_email=None,
                    recipient_list=[recipient],
                    fail_silently=False
                )

                if result == 1:

                    note.reminder_sent = True
                    note.reminder_sent_at = timezone.now()

                    note.save(
                        update_fields=[
                            "reminder_sent",
                            "reminder_sent_at"
                        ]
                    )

                    sent_count += 1

                    self.stdout.write(
                        self.style.SUCCESS(
                            f"Reminder sent to {recipient}"
                        )
                    )

            except Exception as error:

                failed_count += 1

                self.stderr.write(
                    self.style.ERROR(
                        f"Failed to send reminder for "
                        f"note {note.id}: {error}"
                    )
                )

        self.stdout.write(
            self.style.SUCCESS(
                f"Finished: {sent_count} sent, "
                f"{failed_count} failed."
            )
        )