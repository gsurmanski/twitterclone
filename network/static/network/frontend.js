document.addEventListener("DOMContentLoaded", () => {
    document.querySelector('#newpost').addEventListener('submit', newpost);

    load_posts();
});

function assemble_post(username,post,date,position = 'append') {
    //create post components
    //hold container
    const entry = document.createElement('div');
    entry.className = "post"
    
    //components
    const user = document.createElement('div');
    user.className = "user"
    user.textContent = username;

    const content = document.createElement('div');
    content.textContent = post;

    const date_holder = document.createElement('div');
    date_holder.textContent = date;

    //assemble post
    entry.append(user,content,date_holder);

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

    fetch('/posts', {
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
        const date = format_date(post.content.date);
        assemble_post(post.content.user,post.content.post,date,'prepend');
        }
        else {
            alert("some error");
        }
    });
}

function load_posts(){
    fetch("/get_posts", {
        method: "GET"
    }).then(response => response.json())
    .then(posts => {
        posts.forEach(post => {
            //format date received from database
            const date = format_date(post.date);
        //place all posts    
        assemble_post(post.user,post.post,date,'append');
            
        });
        
    });
}