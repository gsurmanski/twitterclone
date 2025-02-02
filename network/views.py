from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt

from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse
from .forms import *
from django.http import JsonResponse
import json


#import models
from .models import User
from .models import Post
from .models import Like
from .models import Follower



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
    #check filter param
    # Get the 'filter' query parameter from the URL, defaulting to 'all' if not present
    filter_value = request.GET.get('filter', 'all')

    # If the 'filter' is not 'all', filter by the user
    if filter_value != 'all':
        #user double underscore user__username to query over Post model back to User model since field "user" is foreign key in Post model
        posts = Post.objects.filter(user__username=filter_value).order_by('-date')  # Filtering by the username
    else:
        posts = Post.objects.all().order_by('-date')  # Fetch all posts if filter is 'all'
    
    return JsonResponse([post.serialize() for post in posts], safe=False) #convert queryset to list

def api_posts(request):
    if not request.user.is_authenticated:
        return JsonResponse({"success": False, "message": "need to be logged in"}, status=401)
    if request.method == "PUT":
        #load data into dictionary
        data = json.loads(request.body)
        #if like update sent
        if data.get("like")==True:
            #check if post exists
            try:
                #use get to retrieve actual post, rather then filter which retrieves a queryset
                post = Post.objects.get(id=data.get("id"))
            except Post.DoesNotExist:
                return JsonResponse({"success": False, "message": "post doesn't exist"}, status=404)
            #check if user has liked the post
            if Like.objects.filter(user=request.user, post=post).exists():
                #delete like in db and update post like number (retrieved above)
                Like.objects.filter(user=request.user, post=post).delete()
                post.likes -= 1
                post.save()
                
                return JsonResponse({"success": True, "likes": post.likes, "message": "unliked"}, status=200)
            else:
                #put like in db and update post like number
                Like.objects.create(user=request.user, post=post)
                post.likes += 1
                post.save()
            
            
                return JsonResponse({"success": True, "likes": post.likes, "message": "it worked"}, status=200)

def profile(request, username):
    #username passed via url/GET
    #query User database for all relevant info, including following and followers
    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        #if no user, just go back to index page
        form = NewPost()
        return render(request, "network/index.html", {"form": form})

    #check if following user to render initial button
    follow_check = Follower.objects.filter(follower=request.user, followed=user.id).exists()
    button = ''
    if follow_check:
        button = 'Un-follow'
    else:
        button = 'Follow'

    #get follower and follows counts
    following = Follower.objects.filter(follower=user.id).count()
    followers = Follower.objects.filter(followed=user.id).count()

    return render(request, "network/profile.html", {"profile" : user, "button": button, "followers": followers,
                                                    "following": following })

def api_profile(request):
    if request.method == "POST":
        #first check if follow exists based on user passed and user logged in, if so, delete
        try:
            #load data into dictionary
            data = json.loads(request.body)
            user = data.get("user")
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON data"}, status=400)
        
        #check if followed username exists
        try:
            followed_user = User.objects.get(username=user)
        except User.DoesNotExist:
            return JsonResponse({"error": "user not found"}, status=404)
        
        #check if follow exists
        follow = Follower.objects.filter(follower=request.user, followed=followed_user)

        #already following
        if follow.exists():
            #delete follow from database
            follow.delete()
            return JsonResponse({"success": True, "button": "Follow"}, status=200)
        else:
            #create database follow
            Follower.objects.create(follower=request.user, followed=followed_user)
            return JsonResponse({"success": True, "button": "Un-Follow"}, status=200)

    #if didn't trigger above, return false, not a valid request
    return JsonResponse({"success" : False}, status=200)