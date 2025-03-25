const API_URL = 'http://localhost:3000/users';

// Show login form
function showLogin() {
    document.getElementById('signupForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
}

// Show signup form
function showSignup() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('signupForm').style.display = 'block';
}

// Toggle password visibility
function togglePassword(id) {
    const passwordField = document.getElementById(id);
    passwordField.type = passwordField.type === 'password' ? 'text' : 'password';
}

// Signup function
async function signup() {
    const username = document.getElementById('signupUsername').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value.trim();
    const role = document.getElementById('signupRole').value;
    const message = document.getElementById('signupMessage');

    if (!username || !email || !password) {
        message.innerText = 'All fields are required.';
        message.style.color = 'red';
        return;
    }

    try {
        // Check if user already exists
        const response = await fetch(`${API_URL}?email=${email}`);
        const data = await response.json();

        if (data.length > 0) {
            message.innerHTML = `User already exists! <a href="#" onclick="showLogin()">Login here.</a>`;
            message.style.color = 'red';
            return;
        }

        // Add new user to JSON server
        await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password, role })
        });

        message.style.color = 'green';
        message.innerText = 'Signup successful! You can now login.';

        // Clear form after signup
        document.getElementById('signupUsername').value = '';
        document.getElementById('signupEmail').value = '';
        document.getElementById('signupPassword').value = '';
    } catch (error) {
        console.error('Signup error:', error);
        message.innerText = 'Signup failed. Please try again.';
        message.style.color = 'red';
    }
}

// Login function
async function login() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const message = document.getElementById('loginMessage');

    if (!email || !password) {
        message.innerText = 'All fields are required.';
        message.style.color = 'red';
        return;
    }

    try {
        // API call to verify the login credentials
        const response = await fetch(`${API_URL}?email=${email}&password=${password}`);
        const data = await response.json();

        if (data.length > 0) {
            const user = data[0];

            // ✅ Store user ID and email in localStorage
            localStorage.setItem('userId', user.id);
            localStorage.setItem('email', user.email);
            localStorage.setItem('username',user.username);

            message.style.color = 'green';
            message.innerText = `Welcome, ${user.username}!`;

            setTimeout(() => {
                // Redirect based on user role
                if (user.role === 'admin') {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'user.html';
                }
            }, 1000);
        } else {
            message.style.color = 'red';
            message.innerText = 'Invalid email or password.';
        }
    } catch (error) {
        console.error('Login error:', error);
        message.innerText = 'Login failed. Please try again.';
        message.style.color = 'red';
    }
}


// Show login form initially
showLogin();
