from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    pass

class Post(models.Model):
    post = models.TextField(blank=False)
    user = models.ForeignKey("User", on_delete=models.CASCADE, related_name="posts")
    date = models.DateTimeField(auto_now_add=True)
    likes = models.IntegerField(default=0)

    def serialize(self):
        return {
            'post': self.post,
            'user': self.user.username,
            'date': self.date,
            'likes': self.likes
        }

class Comment(models.Model):
    text = models.TextField(max_length=500, default="")
    post = models.ForeignKey(Post, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="comments")

