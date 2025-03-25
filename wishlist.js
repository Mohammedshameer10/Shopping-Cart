// API URL for products
const API_URL = 'http://localhost:3000/products';

// Initialize cart and wishlist from localStorage
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];

// Load wishlist items
function loadWishlist() {
    const wishlistItemsContainer = document.getElementById('wishlistItems');
    if (!wishlistItemsContainer) {
        console.error('Wishlist items container not found');
        return;
    }

    if (wishlist.length === 0) {
        wishlistItemsContainer.innerHTML = '<p>Your wishlist is empty.</p>';
        return;
    }

    wishlistItemsContainer.innerHTML = wishlist.map(item => `
        <div class="wishlist-item">
            <img src="${item.image || 'img/placeholder.jpg'}" alt="${item.name || 'Product'}">
            <div class="wishlist-details">
                <h3>${item.name || 'Unnamed Product'}</h3>
                <p>${item.description || ''}</p>
                <span>$${item.price ? item.price.toFixed(2) : '0.00'}</span>
            </div>
            <button class="move-to-cart-btn" data-id="${item.id}">Move to Bag</button>
            <button class="remove-from-wishlist-btn" data-id="${item.id}">Remove</button>
        </div>
    `).join('');
}

// Get product by ID from API
async function getProductById(productId) {
    try {
        const response = await fetch(`${API_URL}/${productId}`);
        console.log(`Fetching product from: ${API_URL}/${productId}`);
        if (!response.ok) {
            console.error(`Fetch failed with status: ${response.status}, Response: ${await response.text()}`);
            throw new Error(`Failed to fetch product: ${response.status}`);
        }
        const data = await response.json();
        const product = (data && typeof data === 'object' && (data.id === productId || data.id === parseInt(productId))) ? data : null;
        console.log('Fetched product data with ID:', product ? product.id : null);
        return product;
    } catch (error) {
        console.error(`Error fetching product with ID ${productId}:`, error.message);
        return null;
    }
}

// Move product from wishlist to cart
async function moveToCartFromWishlist(productId) {
    try {
        const product = await getProductById(productId);
        if (!product) {
            console.error(`Product not found for ID ${productId}`);
            showMessage('Product not found', 'error');
            return;
        }

        if (product.quantity <= 0) {
            showMessage('This product is out of stock!', 'error');
            return;
        }

        // Add to cart with default quantity and size
        const selectedQuantity = 1; // Default quantity
        const selectedSize = 1; // Default size

        const existingItem = cart.find(item => 
            (item.id === productId || item.id === parseInt(productId)) && item.selectedSize === selectedSize
        );
        if (existingItem) {
            const newQuantity = existingItem.cartQuantity + selectedQuantity;
            if (newQuantity > product.quantity) {
                showMessage(`Only ${product.quantity} items available for ${product.name}!`, 'error');
                return;
            }
            existingItem.cartQuantity = newQuantity;
        } else {
            if (selectedQuantity > product.quantity) {
                showMessage(`Only ${product.quantity} items available for ${product.name}!`, 'error');
                return;
            }
            cart.push({ ...product, cartQuantity: selectedQuantity, selectedSize });
        }

        // Remove from wishlist
        wishlist = wishlist.filter(item => item.id !== productId && item.id !== parseInt(productId));
        localStorage.setItem('wishlist', JSON.stringify(wishlist));
        localStorage.setItem('cart', JSON.stringify(cart));

        showMessage(`${product.name} moved to cart!`, 'success');
        loadWishlist(); // Refresh wishlist
    } catch (error) {
        console.error('Failed to move product to cart:', error.message);
        showMessage(`Failed to move product to cart: ${error.message}`, 'error');
    }
}

// Remove product from wishlist
function removeFromWishlist(productId) {
    const product = wishlist.find(item => item.id === productId || item.id === parseInt(productId));
    wishlist = wishlist.filter(item => item.id !== productId && item.id !== parseInt(productId));
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    showMessage(`${product.name} removed from wishlist!`, 'success');
    loadWishlist(); // Refresh wishlist
}

// Show success or error message
function showMessage(message, type = 'success') {
    const messageContainer = document.createElement('div');
    messageContainer.className = `message ${type}`;
    messageContainer.textContent = message;

    document.body.appendChild(messageContainer);

    setTimeout(() => {
        messageContainer.style.opacity = '0';
        setTimeout(() => messageContainer.remove(), 500);
    }, 3000);
}

// Event delegation for Move to Cart and Remove buttons
document.addEventListener('DOMContentLoaded', () => {
    // Load wishlist items
    loadWishlist();

    // Handle Move to Cart and Remove buttons
    document.addEventListener('click', (event) => {
        if (event.target.classList.contains('move-to-cart-btn')) {
            const productId = event.target.dataset.id;
            console.log('Move to Cart button clicked, productId:', productId);
            moveToCartFromWishlist(productId);
        }

        if (event.target.classList.contains('remove-from-wishlist-btn')) {
            const productId = event.target.dataset.id;
            console.log('Remove from Wishlist button clicked, productId:', productId);
            removeFromWishlist(productId);
        }
    });

    // Account Icon Dropdown Functionality
    const accountIcon = document.getElementById('accountIcon');
    const accountDropdown = document.getElementById('accountDropdown');
    const accountUsername = document.getElementById('accountUsername');
    const accountEmail = document.getElementById('accountEmail');
    const logoutBtn = document.getElementById('logoutBtn');

    if (accountIcon && accountDropdown && accountEmail && accountUsername && logoutBtn) {
        console.log('Account elements found, setting up event listeners...');

        accountIcon.addEventListener('click', (event) => {
            event.stopPropagation();

            const email = localStorage.getItem('email');
            const username = localStorage.getItem('username');
            if (email && username) {
                accountEmail.textContent = `Logged in as: ${email}`;
                accountUsername.textContent = `Username: ${username}`;

                const isDropdownVisible = accountDropdown.classList.contains('show');
                console.log('Dropdown visibility before toggle:', isDropdownVisible);
                accountDropdown.classList.toggle('show');
                console.log('Dropdown visibility after toggle:', accountDropdown.classList.contains('show'));
            } else {
                alert('You are not logged in.');
                window.location.href = 'index.html';
            }
        });

        document.addEventListener('click', (event) => {
            if (!accountIcon.contains(event.target) && !accountDropdown.contains(event.target)) {
                console.log('Clicked outside, closing dropdown');
                accountDropdown.classList.remove('show');
            }
        });

        logoutBtn.addEventListener('click', (event) => {
            event.preventDefault();
            console.log('Logout button clicked');
            localStorage.removeItem('email');
            localStorage.removeItem('userId');
            localStorage.removeItem('username');
            localStorage.removeItem('cart');
            localStorage.removeItem('wishlist');
            accountDropdown.classList.remove('show');
            alert('You have been logged out.');
            window.location.href = 'index.html';
        });
    }
});