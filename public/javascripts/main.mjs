document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('.registration-form');
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirmPassword');

    if (form && password && confirmPassword) {
        form.addEventListener('submit', (e) => {
            if (password.value !== confirmPassword.value) {
                e.preventDefault(); // Stop form submission
                alert('Passwords do not match!');
            }
        });
    }

    const addToCartButton = document.querySelector('.add-to-cart-btn');
    if (addToCartButton) {
        addToCartButton.addEventListener('click', function () {
            const productId = this.dataset.productId;
            const quantity = document.getElementById('product-quantity') ? document.getElementById('product-quantity').value : 1;

            fetch('/user/add-to-cart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ productId, quantity }),
            })
                .then(response => response.json())
                .then(() => {
                    alert('Product added to cart!');
                })
                .catch(error => {
                    console.error('Error adding product to cart:', error);
                    alert('Failed to add product to cart.');
                });
        });
    }

    const zelleRadio = document.getElementById('zelle');
    const paypalRadio = document.getElementById('paypal');
    const applePayRadio = document.getElementById('apple-pay');

    if (zelleRadio) {
        zelleRadio.addEventListener('change', function () {
            document.querySelectorAll('.payment-specific').forEach(el => el.style.display = 'none');
            document.querySelector('.zelle-qr-code').style.display = 'block';
        });
    }

    if (paypalRadio) {
        paypalRadio.addEventListener('change', function () {
            document.querySelectorAll('.payment-specific').forEach(el => el.style.display = 'none');
        });
    }

    if (applePayRadio) {
        applePayRadio.addEventListener('change', function () {
            document.querySelectorAll('.payment-specific').forEach(el => el.style.display = 'none');
        });
    }

    document.querySelectorAll('.delete-item-btn').forEach(button => {
        if (button) {
            button.addEventListener('click', function () {
                const itemId = this.dataset.itemId;
                fetch(`/user/delete-cart-item/${itemId}`, {
                    method: 'DELETE'
                })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            alert('Item removed from cart');
                        } else {
                            alert('Failed to remove item');
                        }
                    })
                    .catch(error => {
                        console.error('Error removing item from cart:', error);
                        alert('Error removing item');
                    });
            });
        }
    });
});

