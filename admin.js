const API_URL = 'http://localhost:3000/products';
const channel = new BroadcastChannel('product_update');

// Load products from API
async function loadProducts() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`Failed to fetch products: ${response.status}`);
        }
        const products = await response.json();

        const productList = document.getElementById('adminProductList');
        productList.innerHTML = '';  // Clear existing content

        products.forEach(product => {
            const div = document.createElement('div');
            div.className = 'product-card';
            div.innerHTML = `
                <img src="${product.image}" alt="${product.name}">
                <h3>${product.name}</h3>
                <p>${product.description}</p>
                <span>Quantity: ${product.quantity}</span>
                <span>Price: $${product.price.toFixed(2)}</span>
                <div class="buttons">
                    <button class="buy-btn" data-id="${product.id}">Edit</button>
                    <button class="cart-btn" data-id="${product.id}">Delete</button>
                </div>
            `;
            productList.appendChild(div);
        });

        const existingListener = productList.getAttribute('data-listener');
        if (!existingListener) {
            productList.addEventListener('click', handleProductActions);
            productList.setAttribute('data-listener', 'true');
        }
    } catch (error) {
        console.error('Error loading products:', error);
        alert(`Failed to load products: ${error.message}`);
    }
}

// Handle product actions (edit/delete)
function handleProductActions(e) {
    const target = e.target;
    const id = target.getAttribute('data-id');
    
    if (!id) return;
    
    if (target.classList.contains('buy-btn')) {
        editProduct(id);
    } else if (target.classList.contains('cart-btn')) {
        deleteProduct(id);
    }
}

// Add a new product
async function addProduct(event) {
    event.preventDefault();
    console.log('Attempting to add product...'); // Debug log

    const name = document.getElementById('productName').value.trim();
    const description = document.getElementById('productDescription').value.trim();
    const quantity = parseInt(document.getElementById('productQuantity').value);
    const price = parseFloat(document.getElementById('productPrice').value);
    const image = document.getElementById('productImage').value.trim();

    // Log the form values to debug
    console.log('Form values:', { name, description, quantity, price, image });

    if (!name || !description || isNaN(quantity) || isNaN(price) || !image) {
        console.log('Validation failed: Some fields are empty or invalid.');
        alert('Please fill in all fields correctly.');
        return;
    }

    if (quantity < 0) {
        console.log('Validation failed: Quantity is negative.');
        alert('Quantity must be a positive number.');
        return;
    }

    if (price < 0) {
        console.log('Validation failed: Price is negative.');
        alert('Price must be a positive number.');
        return;
    }

    const product = { name, description, quantity, price, image };
    console.log('Product object to send:', product); // Debug log

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(product)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Server response error:', errorText); // Debug log
            throw new Error(`Failed to add product: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('Product added successfully:', result); // Debug log

        await loadProducts(); // Ensure the product list is updated
        channel.postMessage('update');
        event.target.reset();
        console.log('Form reset and products reloaded.');
    } catch (error) {
        console.error('Error adding product:', error);
        alert(`Failed to add product: ${error.message}`);
    }
}

// Delete product by ID
async function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to delete product: ${response.status} - ${errorText}`);
        }

        loadProducts();
        channel.postMessage('update');
    } catch (error) {
        console.error('Error deleting product:', error);
        alert(`Failed to delete product: ${error.message}`);
    }
}

// Edit product details by ID
async function editProduct(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch product: ${response.status}`);
        }

        const productData = await response.json();

        document.getElementById('editProductId').value = id;
        document.getElementById('editProductName').value = productData.name;
        document.getElementById('editProductDescription').value = productData.description;
        document.getElementById('editProductQuantity').value = productData.quantity;
        document.getElementById('editProductPrice').value = productData.price;
        document.getElementById('editProductImage').value = productData.image;

        const modal = document.getElementById('editModal');
        modal.style.display = 'block';
    } catch (error) {
        console.error('Error fetching product for edit:', error);
        alert(`Failed to fetch product: ${error.message}`);
    }
}

// Handle modal form submission
document.getElementById('editForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const id = document.getElementById('editProductId').value;
    const name = document.getElementById('editProductName').value.trim();
    const description = document.getElementById('editProductDescription').value.trim();
    const quantity = parseInt(document.getElementById('editProductQuantity').value);
    const price = parseFloat(document.getElementById('editProductPrice').value);
    const image = document.getElementById('editProductImage').value.trim();

    if (!name || !description || isNaN(quantity) || isNaN(price) || !image) {
        alert('All fields are required');
        return;
    }

    if (quantity < 0) {
        alert('Quantity must be a positive number');
        return;
    }

    if (price < 0) {
        alert('Price must be a positive number');
        return;
    }

    const updatedProduct = { name, description, quantity, price, image };

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedProduct)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to update product: ${response.status} - ${errorText}`);
        }

        loadProducts();
        channel.postMessage('update');
        document.getElementById('editModal').style.display = 'none'; // Close the modal
    } catch (error) {
        console.error('Error updating product:', error);
        alert(`Failed to update product: ${error.message}`);
    }
});

// Close the modal when clicking the 'x'
document.querySelector('.modal .close').addEventListener('click', () => {
    document.getElementById('editModal').style.display = 'none';
});

// Close the modal when clicking outside of it
window.addEventListener('click', (event) => {
    const modal = document.getElementById('editModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});

// Sign out function
function signOut() {
    if (confirm('Are you sure you want to sign out?')) {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = 'index.html';
    }
}

// Listen for product updates from other tabs (e.g., cart.js)
channel.addEventListener('message', (event) => {
    if (event.data === 'update') {
        console.log('Product update received in admin.js, reloading products...');
        loadProducts();
    }
});

// Event listeners
document.getElementById('productForm').addEventListener('submit', addProduct);
document.querySelector('.nav-icons .fa-sign-out-alt').addEventListener('click', signOut);

// Initial load of products
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
});