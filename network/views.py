from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required

from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse
from .forms import *
from django.http import JsonResponse


#import models
from .models import User
from .models import Post


def index(request):
    form = NewPost()

    return render(request, "network/index.html", {"form": form})


def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")
    
@login_required
def new_post(request):
    form = NewPost(request.POST)
    user = request.user
    # if this is a POST request we need to process the form data
    if request.method == "POST":
        # check whether it's valid:
        if form.is_valid():
            # process the data in form.cleaned_data as required
            post = form.cleaned_data['post']
            #try to save to database
            new_post = Post(user=user, post=post)
            new_post.save()

            #query data back to pass to front end
            response = Post.objects.get(id=new_post.id)

            #send success message
            return JsonResponse({"success": True, "message": "good job, it worked", "content": response.serialize()}, status=201)

    # if a GET (or any other method) we'll create a blank form
    else:
        form = NewPost()

def get_posts(request):
    posts = Post.objects.all().order_by('-date')
    
    return JsonResponse([post.serialize() for post in posts], safe=False) #convert queryset to list