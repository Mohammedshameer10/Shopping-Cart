// API URL for products
const API_URL = 'http://localhost:3000/products';

// Initialize cart from localStorage
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let wishlist = JSON.parse(localStorage.getItem('wishlist')) || []; // Initialize wishlist

// Function to generate product card HTML
function generateProductCard(product) {
    const description = (product.description || '').replace('<strong>Men</strong>');

    // Create the quantity options using a for loop
    let quantityOptions = '';
    const maxQuantity = product.quantity || 1;
    for (let qty = 1; qty <= maxQuantity; qty++) {
        quantityOptions += `<option value="${qty}">${qty}</option>`;
    }

    // Create the size options using a for loop
    let sizeOptions = '';
    for (let size = 1; size <= 11; size++) {
        sizeOptions += `<option value="${size}">${size}</option>`;
    }

    return `
        <div class="product-wrapper ${product.quantity <= 0 ? 'out-of-stock' : ''}">
          <div class="product-card">
            <div class="product-image-container">
              <img src="${product.image}" alt="${product.name || 'Product'}">
              <div class="product-icons">
                <span class="icon-link add-to-cart-icon ${(product.quantity || 0) <= 0 ? 'disabled' : ''}" data-id="${product.id || ''}" title="Add to Cart">
                  <i class="fas fa-shopping-cart"></i>
                </span>
                <span class="icon-link wishlist-icon" data-id="${(product.id || 0)}" title="Add to Wishlist">
                  <i class="fas fa-heart"></i>
                </span>
              </div>
            </div>
            <div class="product-selectors">
              <div class="quantity-selector">
                <label for="quantity-${product.id || 'unknown'}">Select Quantity:</label>
                <select id="quantity-${product.id || 'unknown'}" class="quantity-select">
                  ${quantityOptions}
                </select>
              </div>
              <div class="size-selector">
                <label for="size-${product.id || 'unknown'}">Select Size:</label>
                <select id="size-${product.id || 'unknown'}" class="size-select">
                  ${sizeOptions}
                </select>
              </div>
            </div>
          </div>
          <div class="product-details">
            <h3>${product.name || 'Unnamed Product'}</h3>
            <p>${description}</p>
            <span>$${product.price ? product.price.toFixed(2) : '0.00'}</span>
          </div>
        </div>
    `;
}

// Load products from API
async function loadProducts() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error(`Failed to fetch products: ${response.status} - ${await response.text()}`);
        const products = await response.json();
        console.log('Products fetched with IDs:', products.map(p => p.id));

        const productList = document.getElementById('productList');
        if (!productList) throw new Error('Product list container not found');

        productList.innerHTML = products.map(product => generateProductCard(product)).join('');

        console.log('Products loaded successfully');
    } catch (error) {
        console.error('Error loading products:', error.message);
        alert(`Failed to load products: ${error.message}`);
    }
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

// Add product to cart with selected quantity and size
async function addToCart(productId, selectedQuantity, selectedSize) {
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

        const existingItem = cart.find(item => 
            (item.id === productId || item.id === parseInt(productId)) && item.selectedSize === selectedSize
        );
        if (existingItem) {
            const newQuantity = existingItem.cartQuantity + parseInt(selectedQuantity);
            if (newQuantity > product.quantity) {
                showMessage(`Only ${product.quantity} items available for ${product.name}!`, 'error');
                return;
            }
            existingItem.cartQuantity = newQuantity;
        } else {
            if (parseInt(selectedQuantity) > product.quantity) {
                showMessage(`Only ${product.quantity} items available for ${product.name}!`, 'error');
                return;
            }
            cart.push({ ...product, cartQuantity: parseInt(selectedQuantity), selectedSize: parseInt(selectedSize) });
        }

        localStorage.setItem('cart', JSON.stringify(cart));
        showMessage(`Product ${product.name} (Size: ${selectedSize}) added to cart!`, 'success');
    } catch (error) {
        console.error('Failed to add product to cart:', error.message);
        showMessage(`Failed to add product to cart: ${error.message}`, 'error');
    }
}

// Add product to wishlist
async function addToWishlist(productId) {
    try {
        const product = await getProductById(productId);
        if (!product) {
            console.error(`Product not found for ID ${productId}`);
            showMessage('Product not found', 'error');
            return;
        }

        // Check if product is already in wishlist to avoid duplicates
        if (wishlist.some(item => item.id === product.id)) {
            showMessage(`${product.name} is already in your wishlist!`, 'error');
            return;
        }

        wishlist.push({ id: product.id, name: product.name, image: product.image, price: product.price });
        localStorage.setItem('wishlist', JSON.stringify(wishlist));
        showMessage(`${product.name} added to wishlist!`, 'success');
    } catch (error) {
        console.error('Failed to add product to wishlist:', error.message);
        showMessage(`Failed to add product to wishlist: ${error.message}`, 'error');
    }
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

// Event delegation for Add to Cart and Wishlist icon clicks
document.addEventListener('DOMContentLoaded', () => {
    // Add to Cart and Wishlist functionality
    document.addEventListener('click', (event) => {
        // Handle Add to Cart
        if (event.target.closest('.add-to-cart-icon')) {
            event.preventDefault(); // Prevent page jump
            const icon = event.target.closest('.add-to-cart-icon');
            const productId = icon.dataset.id;
            console.log('Add to Cart icon clicked, raw productId:', productId);

            const productWrapper = icon.closest('.product-wrapper');
            const quantitySelect = productWrapper.querySelector('.quantity-select');
            const sizeSelect = productWrapper.querySelector('.size-select');
            const selectedQuantity = quantitySelect ? quantitySelect.value : 1;
            const selectedSize = sizeSelect ? sizeSelect.value : 1;

            console.log('Selected quantity:', selectedQuantity, 'Selected size:', selectedSize);

            const parsedId = parseInt(productId);
            if (!isNaN(parsedId) || productId) {
                addToCart(productId, selectedQuantity, selectedSize);
            } else {
                console.error('Invalid productId:', productId);
                showMessage('Invalid product ID', 'error');
            }
        }

        // Handle Wishlist
        if (event.target.closest('.wishlist-icon')) {
            event.preventDefault(); // Prevent page jump (already present, kept for consistency)
            const icon = event.target.closest('.wishlist-icon');
            const productId = icon.dataset.id;
            console.log('Wishlist icon clicked, raw productId:', productId);

            const parsedId = parseInt(productId);
            if (!isNaN(parsedId) || productId) {
                addToWishlist(productId);
            } else {
                console.error('Invalid productId:', productId);
                showMessage('Invalid product ID', 'error');
            }
        }
    });

    // Listen for admin updates and reload products
    const channel = new BroadcastChannel('product_update');
    channel.addEventListener('message', (event) => {
        if (event.data === 'update') {
            console.log('Product update received, reloading products...');
            loadProducts();
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
            accountDropdown.classList.remove('show');
            alert('You have been logged out.');
            window.location.href = 'index.html';
        });
    }

    // Load products
    loadProducts();
});