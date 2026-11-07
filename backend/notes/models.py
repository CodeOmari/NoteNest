from django.db import models
from django.contrib.auth.models import User

# Create your models here.
class Note(models.Model):
    REMINDER_CHOICES = [
        ("PENDING", "Pendind"),
        ("SENDING", "Sending"),
        ("SENT", "Sent"),
        ("FAILED", "Failed"),
    ]
    title = models.CharField(max_length=100)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notes')
    reminder_at = models.DateTimeField(null=True, blank=True)
    reminder_status = models.CharField(max_length=10, choices=REMINDER_CHOICES, default="PENDING")
    reminder_claimed_at = models.DateTimeField(null=True, blank=True)
    reminder_sent_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.title