document.addEventListener("DOMContentLoaded", () => {
    const follow = document.querySelector('#follow');
    //only add listener if element exists and person is logged in
    if (follow) {
        follow.addEventListener('click', follow_user);
    }
});

// Function to get the CSRF token from the meta tag
function getCSRFToken() {
    return document.querySelector('[name=csrf-token]').getAttribute('content');
}

function follow_user(){
    user = document.querySelector('#follow').getAttribute('follow');
    fetch("/api_profile", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        },
        body: JSON.stringify({
            user: user
        })
    })
    .then(response => {
        return response.json();
    })
    .then(data => {
        if (data.success){
            document.querySelector('#follow').textContent = data.button;
        }
    });
}