
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path("profile/<str:username>", views.profile, name="profile"),
    
    # API Routes
    path("new_post", views.new_post, name="newpost"),
    path("posts", views.posts, name="posts"),
    path("get_posts", views.get_posts, name="get_posts")
]
