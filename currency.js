// Currency Management System
let currentCurrency = 'RON'; // Default currency

// Initialize Currency System
function initializeCurrencySystem() {
    // Try to detect user's location and set appropriate currency
    if (PAYMENT_CONFIG.AUTO_DETECT_LOCATION) {
        detectUserLocation();
    }
    
    // Set initial currency
    setCurrency(currentCurrency);
    
    // Update all prices on the page
    updateAllPrices();
}

// Detect user location and set appropriate currency
function detectUserLocation() {
    // Try to get location from browser
    if (navigator.language) {
        const lang = navigator.language.toUpperCase();
        if (lang.includes('EN')) {
            currentCurrency = 'USD';
        } else if (lang.includes('DE')) {
            currentCurrency = 'EUR';
        } else if (lang.includes('PL')) {
            currentCurrency = 'PLN';
        } else if (lang.includes('CZ')) {
            currentCurrency = 'CZK';
        } else if (lang.includes('HU')) {
            currentCurrency = 'HUF';
        } else if (lang.includes('BG')) {
            currentCurrency = 'BGN';
        }
    }
    
    // Try to get country from IP (simplified)
    fetch('https://ipapi.co/json/')
        .then(response => response.json())
        .then(data => {
            const country = data.country;
            const currencyMap = {
                'US': 'USD',
                'GB': 'GBP',
                'DE': 'EUR',
                'FR': 'EUR',
                'IT': 'EUR',
                'ES': 'EUR',
                'PL': 'PLN',
                'CZ': 'CZK',
                'HU': 'HUF',
                'BG': 'BGN',
                'RO': 'RON'
            };
            
            if (currencyMap[country]) {
                currentCurrency = currencyMap[country];
                setCurrency(currentCurrency);
                updateAllPrices();
            }
        })
        .catch(error => {
            console.log('Could not detect location, using default currency');
        });
}

// Change currency function
function changeCurrency(currencyCode) {
    currentCurrency = currencyCode;
    setCurrency(currencyCode);
    updateAllPrices();
    
    // Save preference to localStorage
    localStorage.setItem('preferredCurrency', currencyCode);
    
    // Show notification
    const currencyName = PAYMENT_CONFIG.CURRENCIES[currencyCode].name;
    showNotification(`Currency changed to ${currencyName}`, 'success');
}

// Set currency in the selector
function setCurrency(currencyCode) {
    const selector = document.getElementById('currencySelect');
    if (selector) {
        selector.value = currencyCode;
    }
}

// Convert price from RON to selected currency
function convertPrice(priceInRON, currencyCode = currentCurrency) {
    if (currencyCode === 'RON') {
        return priceInRON;
    }
    
    const currency = PAYMENT_CONFIG.CURRENCIES[currencyCode];
    if (!currency) {
        return priceInRON;
    }
    
    return priceInRON * currency.rate;
}

// Format price with currency symbol
function formatPrice(price, currencyCode = currentCurrency) {
    const currency = PAYMENT_CONFIG.CURRENCIES[currencyCode];
    if (!currency) {
        return `${price} lei`;
    }
    
    const convertedPrice = convertPrice(price, currencyCode);
    const formattedPrice = convertedPrice.toFixed(2);
    
    if (currency.position === 'before') {
        return `${currency.symbol}${formattedPrice}`;
    } else {
        return `${formattedPrice} ${currency.symbol}`;
    }
}

// Update all prices on the page
function updateAllPrices() {
    // Update product prices
    document.querySelectorAll('.price').forEach(priceElement => {
        const originalPrice = parseFloat(priceElement.getAttribute('data-original-price') || priceElement.textContent.match(/\d+/)[0]);
        const convertedPrice = formatPrice(originalPrice);
        
        // Store original price if not already stored
        if (!priceElement.getAttribute('data-original-price')) {
            priceElement.setAttribute('data-original-price', originalPrice);
        }
        
        // Update display
        priceElement.innerHTML = `
            <span class="currency-symbol">${convertedPrice}</span>
            ${currentCurrency !== 'RON' ? `<span class="original-price">${originalPrice} lei</span>` : ''}
        `;
    });
    
    // Update cart if open
    if (cart && cart.length > 0) {
        renderCart();
    }
}

// Update cart total with transport and currency conversion
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
    
    const convertedSubtotal = formatPrice(subtotal);
    const convertedTransport = formatPrice(transportCost);
    const convertedTotal = formatPrice(total);
    
    cartTotal.innerHTML = `
        <div>Subtotal: ${convertedSubtotal}</div>
        <div>Shipping: ${convertedTransport}</div>
        <div style="font-size: 1.8rem; color: #e74c3c; margin-top: 0.5rem;">Total: ${convertedTotal}</div>
    `;
}

// Calculate total with transport in current currency
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
