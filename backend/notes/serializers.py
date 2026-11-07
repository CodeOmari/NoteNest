from rest_framework import serializers
from .models import Note 
from django.utils import timezone

class NoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Note
        fields = '__all__'
        extra_kwargs = {
            "author": {"read_only": True},
            "created_at": {"read_only": True},
            "updated_at": {"read_only": True},
            "reminder_status": {"read_only": True},
            "reminder_claimed_at": {"read_only": True},
            "reminder_sent_at": {"read_only": True},
        }

    def validate_reminder_at(self, value):

        if value is not None and value <= timezone.now():
            raise serializers.ValidationError("Reminder date and time must be in the future.")
        return value