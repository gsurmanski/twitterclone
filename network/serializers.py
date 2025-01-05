'''
from rest_framework import serializers
from .models import Post

class PostSerializer(serializers.ModelSerializer):
    class Meta:
        model = Post  # Model to serialize
        fields = ['id', 'post', 'user', 'date', 'likes']
        '''