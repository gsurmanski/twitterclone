document.addEventListener("DOMContentLoaded", () => {
    const newPost = document.querySelector('#newpost');
    //only add listener if element exists and person is logged in
    if (newPost) {
        newPost.addEventListener('submit', newpost);
    }

    load_posts();
});

// Function to get the CSRF token from the meta tag
function getCSRFToken() {
    return document.querySelector('[name=csrf-token]').getAttribute('content');
}

function assemble_post(post, position = 'append') {
    //format date received from database
    const date = format_date(post.date);

    //create post components
    //hold container
    const entry = document.createElement('div');
    entry.className = "post";
    
    //components
    const date_holder = document.createElement('div');
    date_holder.className = "date";
    date_holder.textContent = date;

    const user = document.createElement('a');
    user.className = "user";
    user.href = `/profile/${post.user}?filter=${post.user}`;
    user.textContent = post.user;
    

    const content = document.createElement('div');
    content.textContent = post.post;

    const like_button = document.createElement('button');
    like_button.textContent = "❤️ " + post.likes;
    like_button.className = "like";

    
    const edit_button = document.createElement('a');
    edit_button.textContent = "edit";
    edit_button.className = "edit";

    //check if logged in for front end edit button functionality
    if (isLoggedIn && post.user === currentUser) {
        //create event listener for edit button...
        edit_button.addEventListener('click', () => {
            //check for existing edit area so can be removed
            const existingArea = entry.querySelector('textarea');
            const existing_submit_button = entry.querySelector('.submit_edit');

            //if not existing, create everything necessary for edting
            if (!existingArea){
                //create text area
                const text_edit = document.createElement('textarea');
                text_edit.textContent = post.post;
            
                //create submit
                const submit_button = document.createElement('button');
                submit_button.textContent = "Submit";
                submit_button.className = "submit_edit"

                entry.append(text_edit);
                entry.append(submit_button);

                //set up event listener for form submission
                submit_button.addEventListener('click', () => {
                    alert('test');
                    /*
                    fetch('/posts', {

                    }).then()
                    */
                });
            }
            else {
                existingArea.remove();
                existing_submit_button.remove();
            }
        });
    }
    else {
        //otherwise show no edit button
        edit_button.style.display = 'none';
    }

    //create event listener for like button
    like_button.addEventListener('click', () => {
        fetch('/posts', { 
            method: "PUT", 
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken() // Include the CSRF token in the request header
            },
            body: JSON.stringify({
                id: post.id,
                like: true
            })
          })
        .then(response => {
            if (response.status === 401){
                alert("you need to log in");
            }
            else {
               return response.json();
            }
        })
        .then(data => {
            if (data.success) {
                //update likes on success
                like_button.textContent = '❤️ ' + (data.likes);
               
                console.log(data);
            }
            else {
                alert(data.message)
            }
        });
    });

    //assemble post
    entry.append(user,content,date_holder,like_button,edit_button);

    if (position === 'append'){
        document.querySelector("#allposts").appendChild(entry);
    }
    else {
        document.querySelector("#allposts").prepend(entry);
    }
    //make post gradually appear
    setTimeout(() => {
        entry.style.opacity = 1;
    }, 100);

}

function format_date(unformatted){
    //format date received from database
    const date = new Date(unformatted).toLocaleString('en-US', {
        // weekday: 'long', // Optional: remove this to exclude the weekday
         year: 'numeric',
         month: 'long',
         day: 'numeric',
         hour: '2-digit',
         minute: '2-digit',
         hour12: true
     });

     return date;
}

function newpost(event) {
    //prevent page reload
    event.preventDefault();

    //define success and error divs
    const responseContainer = document.querySelector("#response");

    //define form input information
    const form = event.target;
    const formData = new FormData(form);

    fetch('/new_post', {
        method: "POST",
        body: formData
    }).then(response => response.json())
    .then(post => {
        if (post.success) {

        responseContainer.textContent = post.message;
        responseContainer.style.display = 'block';
        responseContainer.className = "alert alert-success"
        setTimeout(() => {
            document.querySelector("#response").style.display = 'none';
        }, 3000);

        //place all posts    

        assemble_post(post.content, 'prepend');
        //reset textinput
        document.querySelector('#usertext').value = '';
        }
        else {
            alert("some error");
        }
    });
}

function load_posts(){
    // Get the value of 'param' from the URL query string
    const urlParams = new URLSearchParams(window.location.search);
    const filter = urlParams.get('filter');  // Retrieve the 'param' value
    
    //declare let so it has scope outside of if and else below
    let url;

    if (filter){
        // if filter url variable exists
        url = `/get_posts?filter=${encodeURIComponent(filter)}`;
    }
    else {
        url = `/get_posts?filter=all`;
    }

    fetch(url, {
        method: "GET"
    }).then(response => response.json())
    .then(posts => {
        posts.forEach(post => {
        //place all posts    
        assemble_post(post,'append');
            
        });
        
    });
}