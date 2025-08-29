// Shopping Cart Variables
let cart = [];
let selectedPayment = null;
let selectedTransport = 'standard';
let stripe = null;
let cardElement = null;

// Initialize payment systems when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeStripe();
    initializePayPal();
    initializePaysafe();
    
    // Add transport cost change listener
    document.querySelectorAll('input[name="transport"]').forEach(radio => {
        radio.addEventListener('change', updateTotalWithTransport);
    });
});

// Initialize Stripe
function initializeStripe() {
    // Replace with your actual Stripe publishable key
    stripe = Stripe('pk_test_51YourStripeKeyHere');
    
    // Create card element
    const elements = stripe.elements();
    cardElement = elements.create('card', {
        style: {
            base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                    color: '#aab7c4',
                },
            },
            invalid: {
                color: '#9e2146',
            },
        },
    });
    
    // Mount card element
    if (document.getElementById('stripe-card-element')) {
        cardElement.mount('#stripe-card-element');
    }
}

// Initialize PayPal
function initializePayPal() {
    if (typeof paypal !== 'undefined') {
        paypal.Buttons({
            createOrder: function(data, actions) {
                const total = calculateTotalWithTransport();
                return actions.order.create({
                    purchase_units: [{
                        amount: {
                            value: (total / 100).toFixed(2) // Convert to EUR
                        },
                        description: 'A-Royal Fashion Purchase'
                    }]
                });
            },
            onApprove: function(data, actions) {
                return actions.order.capture().then(function(details) {
                    showNotification('PayPal payment successful! Order ID: ' + details.id, 'success');
                    completeOrder('paypal', details.id);
                });
            },
            onError: function(err) {
                showNotification('PayPal payment failed: ' + err.message, 'error');
            }
        }).render('#paypal-button-container');
    }
}

// Initialize PaysafeCard
function initializePaysafe() {
    // PaysafeCard integration would go here
    // This requires server-side implementation for security
    console.log('PaysafeCard initialized');
}

// Mobile Navigation Toggle
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Close mobile menu when clicking on a link
    document.querySelectorAll('.nav-link').forEach(n => n.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    }));
}

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Scroll to section function
function scrollToSection(sectionId) {
    const target = document.getElementById(sectionId);
    if (target) {
        target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Shopping Cart Functions
function addToCart(productName, price, imageUrl) {
    const existingItem = cart.find(item => item.name === productName);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            name: productName,
            price: price,
            image: imageUrl,
            quantity: 1
        });
    }
    
    updateCartCount();
    showNotification(`Added ${productName} to cart!`, 'success');
    
    // Update button text temporarily
    const button = event.target;
    const originalText = button.textContent;
    button.textContent = 'Added!';
    button.style.background = '#27ae60';
    
    setTimeout(() => {
        button.textContent = originalText;
        button.style.background = '#2c3e50';
    }, 2000);
}

function updateCartCount() {
    const cartCount = document.getElementById('cartCount');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
}

function toggleCart() {
    const cartModal = document.getElementById('cartModal');
    if (cartModal.style.display === 'flex') {
        cartModal.style.display = 'none';
    } else {
        cartModal.style.display = 'flex';
        renderCart();
    }
}

function renderCart() {
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p style="text-align: center; color: #6c757d;">Your cart is empty</p>';
        cartTotal.innerHTML = `
            <div>Subtotal: ${formatPrice(0)}</div>
            <div>Shipping: ${formatPrice(0)}</div>
            <div style="font-size: 1.8rem; color: #e74c3c; margin-top: 0.5rem;">Total: ${formatPrice(0)}</div>
        `;
        return;
    }
    
    let total = 0;
    cartItems.innerHTML = '';
    
    cart.forEach((item, index) => {
        total += item.price * item.quantity;
        
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <img src="${item.image}" alt="${item.name}">
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <p>${formatPrice(item.price)} × ${item.quantity}</p>
            </div>
            <div style="display: flex; gap: 0.5rem; align-items: center;">
                <button onclick="updateQuantity(${index}, -1)" style="background: #6c757d; color: white; border: none; border-radius: 50%; width: 25px; height: 25px; cursor: pointer;">-</button>
                <span>${item.quantity}</span>
                <button onclick="updateQuantity(${index}, 1)" style="background: #6c757d; color: white; border: none; border-radius: 50%; width: 25px; height: 25px; cursor: pointer;">+</button>
                <button onclick="removeFromCart(${index})" style="background: #e74c3c; color: white; border: none; border-radius: 50%; width: 25px; height: 25px; cursor: pointer; margin-left: 0.5rem;">×</button>
            </div>
        `;
        cartItems.appendChild(cartItem);
    });
    
    updateTotalWithTransport();
}

function updateQuantity(index, change) {
    cart[index].quantity += change;
    
    if (cart[index].quantity <= 0) {
        removeFromCart(index);
    } else {
        updateCartCount();
        renderCart();
    }
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartCount();
    renderCart();
}

function updateTotalWithTransport() {
    const cartTotal = document.getElementById('cartTotal');
    const transportRadios = document.querySelectorAll('input[name="transport"]');
    
    let transportCost = 15; // Default standard delivery
    
    transportRadios.forEach(radio => {
        if (radio.checked) {
            selectedTransport = radio.value;
            switch(radio.value) {
                case 'standard':
                    transportCost = 15;
                    break;
                case 'express':
                    transportCost = 25;
                    break;
                case 'premium':
                    transportCost = 45;
                    break;
            }
        }
    });
    
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal + transportCost;
    
    cartTotal.innerHTML = `
        <div>Subtotal: ${formatPrice(subtotal)}</div>
        <div>Shipping: ${formatPrice(transportCost)}</div>
        <div style="font-size: 1.8rem; color: #e74c3c; margin-top: 0.5rem;">Total: ${formatPrice(total)}</div>
    `;
}

function calculateTotalWithTransport() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let transportCost = 15;
    
    switch(selectedTransport) {
        case 'express':
            transportCost = 25;
            break;
        case 'premium':
            transportCost = 45;
            break;
    }
    
    return subtotal + transportCost;
}

function selectPayment(method) {
    selectedPayment = method;
    
    // Hide all payment containers
    document.querySelectorAll('.payment-container').forEach(container => {
        container.classList.remove('active');
    });
    
    // Remove previous selection
    document.querySelectorAll('.payment-method').forEach(pm => {
        pm.classList.remove('selected');
    });
    
    // Add selection to clicked method
    event.target.closest('.payment-method').classList.add('selected');
    
    // Show selected payment container
    switch(method) {
        case 'stripe':
            document.getElementById('stripe-container').classList.add('active');
            break;
        case 'paypal':
            document.getElementById('paypal-container').classList.add('active');
            break;
        case 'paysafe':
            document.getElementById('paysafe-container').classList.add('active');
            break;
    }
}

function processCheckout() {
    if (cart.length === 0) {
        showNotification('Your cart is empty!', 'error');
        return;
    }
    
    if (!selectedPayment) {
        showNotification('Please select a payment method!', 'error');
        return;
    }
    
    // Validate shipping information
    if (!validateShippingForm()) {
        showNotification('Please fill in all shipping information!', 'error');
        return;
    }
    
    const total = calculateTotalWithTransport();
    
    switch(selectedPayment) {
        case 'stripe':
            processStripePayment(total);
            break;
        case 'paypal':
            // PayPal is handled by their button
            showNotification('Please use the PayPal button above to complete payment.', 'info');
            break;
        case 'paysafe':
            processPaysafePayment(total);
            break;
        default:
            showNotification('Invalid payment method selected.', 'error');
    }
}

function validateShippingForm() {
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'postalCode', 'country'];
    
    for (let field of requiredFields) {
        const element = document.getElementById(field);
        if (!element.value.trim()) {
            element.style.borderColor = '#e74c3c';
            return false;
        } else {
            element.style.borderColor = '#e9ecef';
        }
    }
    
    return true;
}

function processStripePayment(total) {
    if (!stripe || !cardElement) {
        showNotification('Stripe not initialized. Please refresh the page.', 'error');
        return;
    }
    
    showNotification('Processing payment...', 'info');
    
    // Create payment method
    stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
            name: document.getElementById('firstName').value + ' ' + document.getElementById('lastName').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            address: {
                line1: document.getElementById('address').value,
                city: document.getElementById('city').value,
                postal_code: document.getElementById('postalCode').value,
                country: document.getElementById('country').value
            }
        }
    }).then(function(result) {
        if (result.error) {
            showNotification('Payment failed: ' + result.error.message, 'error');
            document.getElementById('stripe-errors').textContent = result.error.message;
        } else {
            // In a real application, you would send this to your server
            // to complete the payment with your Stripe secret key
            simulateStripePayment(result.paymentMethod.id, total);
        }
    });
}

function simulateStripePayment(paymentMethodId, total) {
    // Simulate server-side payment processing
    setTimeout(() => {
        showNotification(`Stripe payment successful! Payment ID: ${paymentMethodId}`, 'success');
        completeOrder('stripe', paymentMethodId);
    }, 2000);
}

function processPaysafePayment(total) {
    const email = document.getElementById('paysafe-email').value;
    const pin = document.getElementById('paysafe-pin').value;
    
    if (!email || !pin) {
        showNotification('Please fill in PaysafeCard details!', 'error');
        return;
    }
    
    showNotification('Processing PaysafeCard payment...', 'info');
    
    // Simulate PaysafeCard payment processing
    setTimeout(() => {
        showNotification(`PaysafeCard payment successful!`, 'success');
        completeOrder('paysafe', 'PSC_' + Date.now());
    }, 2000);
}

function completeOrder(paymentMethod, paymentId) {
    const total = calculateTotalWithTransport();
    const orderData = {
        items: cart,
        total: total,
        shipping: {
            method: selectedTransport,
            cost: selectedTransport === 'standard' ? 15 : selectedTransport === 'express' ? 25 : 45,
            address: {
                firstName: document.getElementById('firstName').value,
                lastName: document.getElementById('lastName').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                address: document.getElementById('address').value,
                city: document.getElementById('city').value,
                postalCode: document.getElementById('postalCode').value,
                country: document.getElementById('country').value
            }
        },
        payment: {
            method: paymentMethod,
            id: paymentId
        },
        orderId: 'AR_' + Date.now()
    };
    
    // In a real application, you would send this to your server
    console.log('Order completed:', orderData);
    
    // Show success message
    showNotification(`Order completed successfully! Order ID: ${orderData.orderId}`, 'success');
    
    // Clear cart
    cart = [];
    updateCartCount();
    
    // Close cart modal
    toggleCart();
    
    // Reset payment selection
    selectedPayment = null;
    document.querySelectorAll('.payment-method').forEach(pm => {
        pm.classList.remove('selected');
    });
    
    // Hide all payment containers
    document.querySelectorAll('.payment-container').forEach(container => {
        container.classList.remove('active');
    });
    
    // Reset form
    document.getElementById('firstName').value = '';
    document.getElementById('lastName').value = '';
    document.getElementById('email').value = '';
    document.getElementById('phone').value = '';
    document.getElementById('address').value = '';
    document.getElementById('city').value = '';
    document.getElementById('postalCode').value = '';
    document.getElementById('country').value = 'RO';
    
    // Reset transport selection
    document.querySelector('input[name="transport"][value="standard"]').checked = true;
    
    // Show order confirmation
    showOrderConfirmation(orderData);
}

function showOrderConfirmation(orderData) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        z-index: 10001;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    modal.innerHTML = `
        <div style="background: white; padding: 2rem; border-radius: 15px; max-width: 500px; text-align: center;">
            <div style="color: #27ae60; font-size: 4rem; margin-bottom: 1rem;">✓</div>
            <h2 style="color: #2c3e50; margin-bottom: 1rem;">Order Confirmed!</h2>
            <p style="color: #6c757d; margin-bottom: 1rem;">Thank you for your purchase!</p>
            <div style="background: #f8f9fa; padding: 1rem; border-radius: 10px; margin: 1rem 0;">
                <p><strong>Order ID:</strong> ${orderData.orderId}</p>
                <p><strong>Total:</strong> ${formatPrice(orderData.total)}</p>
                <p><strong>Payment:</strong> ${orderData.payment.method.toUpperCase()}</p>
                <p><strong>Shipping:</strong> ${orderData.shipping.method} (${formatPrice(orderData.shipping.cost)})</p>
            </div>
            <p style="color: #6c757d; font-size: 0.9rem;">You will receive a confirmation email shortly.</p>
            <button onclick="this.closest('div[style*=\"position: fixed\"]').remove()" style="background: #e74c3c; color: white; border: none; padding: 0.75rem 2rem; border-radius: 25px; margin-top: 1rem; cursor: pointer;">
                Continue Shopping
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Login button functionality
const loginBtn = document.querySelector('.login-btn');
if (loginBtn) {
    loginBtn.addEventListener('click', function() {
        showLoginModal();
    });
}

// Login Modal
function showLoginModal() {
    // Remove existing modals
    const existingModal = document.querySelector('.login-modal');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.className = 'login-modal';
    modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content">
            <div class="modal-header">
                <h2>Welcome to A-Royal</h2>
                <button class="close-btn">&times;</button>
            </div>
            <div class="modal-body">
                <form class="login-form">
                    <div class="form-group">
                        <label for="email">Email</label>
                        <input type="email" id="email" required placeholder="Enter your email">
                    </div>
                    <div class="form-group">
                        <label for="password">Password</label>
                        <input type="password" id="password" required placeholder="Enter your password">
                    </div>
                    <button type="submit" class="submit-btn">Log In</button>
                </form>
                <div class="form-footer">
                    <p>Don't have an account? <a href="#" class="signup-link">Sign Up</a></p>
                    <a href="#" class="forgot-password">Forgot Password?</a>
                </div>
            </div>
        </div>
    `;

    // Add modal styles
    const modalStyles = document.createElement('style');
    modalStyles.textContent = `
        .login-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .modal-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(5px);
        }
        
        .modal-content {
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            width: 90%;
            max-width: 400px;
            position: relative;
            z-index: 10001;
            animation: modalSlideIn 0.3s ease;
        }
        
        @keyframes modalSlideIn {
            from {
                opacity: 0;
                transform: translateY(-50px) scale(0.9);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }
        
        .modal-header {
            padding: 1.5rem;
            border-bottom: 1px solid #e9ecef;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .modal-header h2 {
            margin: 0;
            color: #2c3e50;
            font-family: Georgia, 'Times New Roman', serif;
        }
        
        .close-btn {
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: #6c757d;
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: all 0.3s ease;
        }
        
        .close-btn:hover {
            background: #f8f9fa;
            color: #2c3e50;
        }
        
        .modal-body {
            padding: 1.5rem;
        }
        
        .form-group {
            margin-bottom: 1.5rem;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            color: #2c3e50;
            font-weight: 500;
        }
        
        .form-group input {
            width: 100%;
            padding: 0.75rem;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            font-size: 1rem;
            transition: border-color 0.3s ease;
            box-sizing: border-box;
        }
        
        .form-group input:focus {
            outline: none;
            border-color: #e74c3c;
        }
        
        .submit-btn {
            width: 100%;
            background: #e74c3c;
            color: white;
            border: none;
            padding: 0.75rem;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .submit-btn:hover {
            background: #c0392b;
            transform: translateY(-2px);
        }
        
        .form-footer {
            margin-top: 1.5rem;
            text-align: center;
        }
        
        .form-footer p {
            margin-bottom: 0.5rem;
            color: #6c757d;
        }
        
        .form-footer a {
            color: #e74c3c;
            text-decoration: none;
            font-weight: 500;
        }
        
        .form-footer a:hover {
            text-decoration: underline;
        }
        
        .signup-link {
            color: #2c3e50 !important;
            font-weight: 600;
        }
        
        .forgot-password {
            font-size: 0.9rem;
        }
    `;
    document.head.appendChild(modalStyles);

    // Add to page
    document.body.appendChild(modal);

    // Close modal functionality
    const closeBtn = modal.querySelector('.close-btn');
    const overlay = modal.querySelector('.modal-overlay');
    
    closeBtn.addEventListener('click', () => closeModal(modal));
    overlay.addEventListener('click', () => closeModal(modal));
    
    // Close on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal(modal);
        }
    });

    // Form submission
    const loginForm = modal.querySelector('.login-form');
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = this.querySelector('#email').value;
        const password = this.querySelector('#password').value;
        
        if (email && password) {
            showNotification('Login successful! Welcome to A-Royal.', 'success');
            closeModal(modal);
        } else {
            showNotification('Please fill in all fields.', 'error');
        }
    });

    // Sign up link
    const signupLink = modal.querySelector('.signup-link');
    signupLink.addEventListener('click', function(e) {
        e.preventDefault();
        closeModal(modal);
        showSignupModal();
    });

    // Forgot password
    const forgotPassword = modal.querySelector('.forgot-password');
    forgotPassword.addEventListener('click', function(e) {
        e.preventDefault();
        showNotification('Password reset link sent to your email!', 'info');
    });
}

// Sign Up Modal
function showSignupModal() {
    const modal = document.createElement('div');
    modal.className = 'login-modal';
    modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content">
            <div class="modal-header">
                <h2>Join A-Royal</h2>
                <button class="close-btn">&times;</button>
            </div>
            <div class="modal-body">
                <form class="signup-form">
                    <div class="form-group">
                        <label for="fullname">Full Name</label>
                        <input type="text" id="fullname" required placeholder="Enter your full name">
                    </div>
                    <div class="form-group">
                        <label for="signup-email">Email</label>
                        <input type="email" id="signup-email" required placeholder="Enter your email">
                    </div>
                    <div class="form-group">
                        <label for="signup-password">Password</label>
                        <input type="password" id="signup-password" required placeholder="Create a password">
                    </div>
                    <button type="submit" class="submit-btn">Create Account</button>
                </form>
                <div class="form-footer">
                    <p>Already have an account? <a href="#" class="login-link">Log In</a></p>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Close modal functionality
    const closeBtn = modal.querySelector('.close-btn');
    const overlay = modal.querySelector('.modal-overlay');
    
    closeBtn.addEventListener('click', () => closeModal(modal));
    overlay.addEventListener('click', () => closeModal(modal));
    
    // Form submission
    const signupForm = modal.querySelector('.signup-form');
    signupForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const fullname = this.querySelector('#fullname').value;
        const email = this.querySelector('#signup-email').value;
        const password = this.querySelector('#signup-password').value;
        
        if (fullname && email && password) {
            showNotification('Account created successfully! Welcome to A-Royal.', 'success');
            closeModal(modal);
        } else {
            showNotification('Please fill in all fields.', 'error');
        }
    });

    // Login link
    const loginLink = modal.querySelector('.login-link');
    loginLink.addEventListener('click', function(e) {
        e.preventDefault();
        closeModal(modal);
        showLoginModal();
    });
}

// Close modal function
function closeModal(modal) {
    modal.style.animation = 'modalSlideOut 0.3s ease forwards';
    
    // Add slide out animation
    const slideOutStyles = document.createElement('style');
    slideOutStyles.textContent = `
        @keyframes modalSlideOut {
            to {
                opacity: 0;
                transform: translateY(-50px) scale(0.9);
            }
        }
    `;
    document.head.appendChild(slideOutStyles);
    
    setTimeout(() => {
        if (modal.parentElement) {
            modal.remove();
        }
    }, 300);
}

// Subscribe form functionality
document.querySelector('.subscribe-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const email = this.querySelector('input[type="email"]').value;
    
    if (email) {
        showNotification('Thank you for subscribing!', 'success');
        this.reset();
    }
});

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        max-width: 300px;
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 300);
    }, 5000);
    
    // Close button functionality
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 300);
    });
}

// Scroll effects
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 100) {
        navbar.style.background = 'rgba(255, 255, 255, 0.98)';
        navbar.style.boxShadow = '0 2px 30px rgba(0, 0, 0, 0.15)';
    } else {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
    }
});

// Product card hover effects
document.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-15px) scale(1.02)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
    });
});

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for animation
document.querySelectorAll('.product-card, .announcement-content, .subscribe').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// Add loading animation
window.addEventListener('load', () => {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease';
    
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
});

// Keyboard navigation support
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        // Close mobile menu
        if (hamburger) hamburger.classList.remove('active');
        if (navMenu) navMenu.classList.remove('active');
        
        // Close notifications
        document.querySelectorAll('.notification').forEach(notification => {
            notification.remove();
        });
        
        // Close modals
        document.querySelectorAll('.login-modal').forEach(modal => {
            closeModal(modal);
        });
        
        // Close cart
        const cartModal = document.getElementById('cartModal');
        if (cartModal && cartModal.style.display === 'flex') {
            toggleCart();
        }
    }
});

// Add some CSS for notifications
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    .notification-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0;
        line-height: 1;
    }
    
    .notification-close:hover {
        opacity: 0.8;
    }
    
    .notification-message {
        flex: 1;
    }
`;
document.head.appendChild(notificationStyles);
