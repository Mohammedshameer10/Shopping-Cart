// API URL for products
const API_URL = 'http://localhost:3000/products';

// Initialize cart from localStorage
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Load and display cart items
async function loadCart() {
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    cartItems.innerHTML = '';

    if (cart.length === 0) {
        cartItems.innerHTML = '<p>Your cart is empty.</p>';
        cartTotal.textContent = 'Total: $0.00';
        document.getElementById('checkoutBtn').style.display = 'none'; // Hide checkout button if cart is empty
        return;
    }

    let total = 0;
    for (const item of cart) {
        try {
            const product = await getProductById(item.id); 
            if (product) {
                const itemTotal = product.price * item.cartQuantity;
                total += itemTotal;

                const div = document.createElement('div');
                div.className = 'cart-item';
                div.innerHTML = `
                    <img src="${product.image}" alt="${product.name}">
                    <span>${product.name}${item.selectedSize ? ` (Size: ${item.selectedSize})` : ''} x ${item.cartQuantity}</span>
                    <span>$${itemTotal.toFixed(2)}</span>
                    <button onclick="removeFromCart('${item.id}', ${item.selectedSize || 'null'})">Remove</button>
                `;
                cartItems.appendChild(div);
            }
        } catch (error) {
            console.error('Error loading cart item:', error);
        }
    }

    cartTotal.textContent = `Total: $${total.toFixed(2)}`;
    document.getElementById('checkoutBtn').style.display = 'block'; // Show checkout button if cart has items
}

// Remove item from cart
function removeFromCart(productId, selectedSize) {
    cart = cart.filter(item => 
        !(item.id === productId || item.id === parseInt(productId)) || 
        (selectedSize !== 'null' && item.selectedSize !== parseInt(selectedSize))
    );
    localStorage.setItem('cart', JSON.stringify(cart));
    loadCart(); // Reload cart after removal
}

// Show the checkout modal
function checkout() {
    if (cart.length === 0) {
        alert('Your cart is empty. Add items before checking out.');
        return;
    }
    const modal = document.getElementById('checkoutModal');
    modal.style.display = 'block';
}

// Close the checkout modal
function closeModal() {
    const modal = document.getElementById('checkoutModal');
    modal.style.display = 'none';
    // Reset form
    document.getElementById('checkoutForm').reset();
}

// Update product quantity in the API
async function updateProductQuantity(productId, quantityToReduce) {
    try {
        console.log(`Updating product quantity for ID ${productId}`);
        const product = await getProductById(productId);
        if (!product) {
            throw new Error(`Product with ID ${productId} not found`);
        }

        const newQuantity = product.quantity - quantityToReduce;
        if (newQuantity < 0) {
            throw new Error(`Not enough stock for product ID ${productId}`);
        }

        const response = await fetch(`${API_URL}/${productId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ quantity: newQuantity }),
        });

        if (!response.ok) {
            throw new Error(`Failed to update product quantity: ${response.status} - ${await response.text()}`);
        }

        console.log(`Updated quantity for product ID ${productId}: ${newQuantity}`);
    } catch (error) {
        console.error('Error updating product quantity:', error.message);
        throw error; // Re-throw to handle in confirmCheckout
    }
}

// Handle checkout form submission
async function confirmCheckout(event) {
    event.preventDefault(); // Prevent form submission from refreshing the page

    const address = document.getElementById('address').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const payment = document.getElementById('payment').value;

    // Validate inputs
    if (!address || !phone || !payment) {
        alert('Please fill in all fields.');
        return;
    }

    if (!/^[0-9]{10}$/.test(phone)) {
        alert('Please enter a valid 10-digit phone number.');
        return;
    }

    try {
        // Log cart items for debugging
        console.log('Cart items:', cart);

        for (const item of cart) {
            console.log(`Updating quantity for product ID: ${item.id}`);
            await updateProductQuantity(item.id, item.cartQuantity);
        }

        const total = document.getElementById('cartTotal').textContent.split('$')[1];
        const orderSummary = cart.map(item => 
            `${item.name}${item.selectedSize ? ` (Size: ${item.selectedSize})` : ''} x ${item.cartQuantity} - $${(item.price * item.cartQuantity).toFixed(2)}`
        ).join('\n');

        alert(`Order Confirmed!\n\nOrder Details:\n${orderSummary}\nTotal: $${total}\n\nShipping To:\nAddress: ${address}\nPhone: ${phone}\nPayment Method: ${payment}`);

        // Clear cart
        cart = [];
        localStorage.setItem('cart', JSON.stringify(cart));
        loadCart(); // Reload cart to reflect cleared state

        // Close the modal
        closeModal();
    } catch (error) {
        console.error('Error during checkout:', error.message);
        alert(`Failed to complete order: ${error.message}`);
    }
}

// Get product by ID from API
async function getProductById(productId) {
    try {
        // Log the product ID being searched
        console.log(`Fetching product with ID: ${productId}`);

        // Validate productId (if it should be numeric, you can convert or check it)
        if (isNaN(productId) && typeof productId !== 'string') {
            throw new Error(`Invalid product ID format: ${productId}`);
        }

        const response = await fetch(`${API_URL}/${productId}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch product: ${response.status} - ${await response.text()}`);
        }

        const product = await response.json();
        if (!product) {
            throw new Error(`Product with ID ${productId} not found`);
        }

        return product;
    } catch (error) {
        console.error('Error fetching product:', error);
        return null; // Return null if product is not found
    }
}

// Ensure DOM is fully loaded before initializing
document.addEventListener('DOMContentLoaded', () => {
    loadCart();
});
