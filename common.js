// === Common Initialization ===
function initialize() {
    if (document.getElementById('adminProductList')) loadAdminProducts();
    if (document.getElementById('userProductList')) loadUserProducts();
    if (document.getElementById('cartList')) loadCart();
}

window.onload = initialize;
