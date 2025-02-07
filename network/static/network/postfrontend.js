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

//only prepend new posts, append initial load
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
    user.href = `/profile/${post.user}`;
    user.textContent = post.user;
    

    const content = document.createElement('div');
    content.textContent = post.post;

    const like_button = document.createElement('button');
    like_button.textContent = "♥︎" + post.likes;
    like_button.className = "like noto-emoji";

    
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
                text_edit.className = "text_edit form-control";
                text_edit.textContent = post.post;
            
                //create submit
                const submit_button = document.createElement('button');
                submit_button.textContent = "Submit";
                submit_button.className = "submit_edit btn btn-primary"

                entry.append(text_edit);
                entry.append(submit_button);

                //set up event listener for form submission
                submit_button.addEventListener('click', () => {
                    fetch('/posts', { 
                        method: "PUT", 
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRFToken': getCSRFToken() // Include the CSRF token in the request header
                        },
                        body: JSON.stringify({
                            id: post.id,
                            body: text_edit.value
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
                            //on success, clear form and update post
                            content.textContent = text_edit.value;
                            text_edit.remove();
                            submit_button.remove();
                            console.log(data);
                        }
                        else {
                            alert(data.message)
                        }
                    });
                });
            }
            else {
                //remove if already exists
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
        if (!isLoggedIn){
            alert('you need to log in');
            return;
        }
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
                like_button.textContent = '♥︎ ' + (data.likes);
               
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
    const pageNumber = urlParams.get('page');

    //declare let so it has scope outside of if and else below
    let url;

    //if NOT on index page
    if (currentPageUrl != '/'){
        url = `/get_posts${currentPageUrl}?page=${pageNumber}&filter=${encodeURIComponent(filter)}`;
    }
    else {
        url = `/get_posts/index/none?page=${pageNumber}&filter=${encodeURIComponent(filter)}`;
    }

    fetch(url, {
        method: "GET"
    }).then(response => response.json())
    .then(data => {
        data.posts.forEach(post => {
            //place all posts    
            assemble_post(post,'append');
        });
        //pass pagination JSON data to pagination function
        pagination(data.pagination); 
    });
}

function pagination(pagination){
    //pagination currently set to refresh page. For async pagination, utilize loadposts()
    //create holder Unordered list
    const page_change = document.createElement('ul');
    page_change.className = "pagination";

    //create previous button
    if (pagination.has_previous === true) {
        //holder list item
        const previous = document.createElement('li');
        previous.className = "page-item";

        //link
        const previous_link = document.createElement('a');
        previous_link.textContent = "Previous";
        previous_link.className = "page-link";
        previous_link.href = `${currentPageUrl}?page=${pagination.page - 1}`

        previous.append(previous_link);

        page_change.append(previous);
    }

    //create page numbers
    for (let i=1; i <= pagination.num_pages; i++){
        //holder list item
        const page = document.createElement('li');
        if (i === pagination.page){
            page.className = "page-item active";
        }
        else {
            page.className = "page-item";
        }

        //link
        const page_link = document.createElement('a');
        page_link.textContent = i;
        page_link.className = "page-link";
        page_link.href = `${currentPageUrl}?page=${i}`
        page.append(page_link);

        page_change.append(page);
    }

    //create next button if ncessary
    if (pagination.has_next === true) {
        //holder list item
        const next = document.createElement('li');
        next.className = "page-item";

        //link
        const next_link = document.createElement('a');
        next_link.textContent = "Next";
        next_link.className = "page-link";
        next_link.href = `${currentPageUrl}?page=${pagination.page + 1}`

        next.append(next_link);

        page_change.append(next);
    }
    document.querySelector("#allposts").appendChild(page_change);
}