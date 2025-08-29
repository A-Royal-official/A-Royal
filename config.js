// Payment Configuration File
// Replace these with your actual API keys from the respective payment providers

const PAYMENT_CONFIG = {
    // Stripe Configuration
    STRIPE: {
        PUBLISHABLE_KEY: 'pk_test_51YourStripeKeyHere', // Replace with your Stripe publishable key
        CURRENCY: 'ron', // Romanian Lei
        COUNTRY: 'RO'
    },
    
    // PayPal Configuration
    PAYPAL: {
        CLIENT_ID: 'YOUR_PAYPAL_CLIENT_ID', // Replace with your PayPal client ID
        CURRENCY: 'EUR', // PayPal works best with EUR
        COUNTRY: 'RO'
    },
    
    // PaysafeCard Configuration
    PAYSAFE: {
        MERCHANT_ID: 'YOUR_PAYSAFE_MERCHANT_ID', // Replace with your PaysafeCard merchant ID
        CURRENCY: 'RON', // Romanian Lei
        COUNTRY: 'RO'
    },
    
    // Shipping Configuration
    SHIPPING: {
        STANDARD: {
            name: 'Standard Delivery',
            cost: 15,
            days: '3-5 business days'
        },
        EXPRESS: {
            name: 'Express Delivery',
            cost: 25,
            days: '1-2 business days'
        },
        PREMIUM: {
            name: 'Premium Delivery',
            cost: 45,
            days: 'Same day'
        }
    },
    
    // Store Configuration
    STORE: {
        NAME: 'A-Royal',
        EMAIL: 'octaviangrecu6@gmail.com',
        PHONE: '0772109737',
        ADDRESS: 'Romania',
        CURRENCY: 'RON',
        CURRENCY_SYMBOL: 'lei'
    },
    
    // Multi-Currency Configuration
    CURRENCIES: {
        RON: {
            symbol: 'lei',
            name: 'Romanian Leu',
            rate: 1, // Base currency
            position: 'after' // Symbol position
        },
        EUR: {
            symbol: '€',
            name: 'Euro',
            rate: 0.20, // 1 RON = 0.20 EUR (approximate)
            position: 'before'
        },
        USD: {
            symbol: '$',
            name: 'US Dollar',
            rate: 0.22, // 1 RON = 0.22 USD (approximate)
            position: 'before'
        },
        GBP: {
            symbol: '£',
            name: 'British Pound',
            rate: 0.17, // 1 RON = 0.17 GBP (approximate)
            position: 'before'
        },
        PLN: {
            symbol: 'zł',
            name: 'Polish Złoty',
            rate: 0.89, // 1 RON = 0.89 PLN (approximate)
            position: 'after'
        },
        CZK: {
            symbol: 'Kč',
            name: 'Czech Koruna',
            rate: 5.0, // 1 RON = 5.0 CZK (approximate)
            position: 'after'
        },
        HUF: {
            symbol: 'Ft',
            name: 'Hungarian Forint',
            rate: 80, // 1 RON = 80 HUF (approximate)
            position: 'after'
        },
        BGN: {
            symbol: 'лв',
            name: 'Bulgarian Lev',
            rate: 0.39, // 1 RON = 0.39 BGN (approximate)
            position: 'after'
        }
    },
    
    // Default currency detection
    DEFAULT_CURRENCY: 'RON',
    
    // Auto-detect user location
    AUTO_DETECT_LOCATION: true,
    
    // Exchange rate update frequency (in hours)
    EXCHANGE_RATE_UPDATE_INTERVAL: 24
};

// Export configuration (for Node.js environments)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PAYMENT_CONFIG;
}

// Make configuration available globally
window.PAYMENT_CONFIG = PAYMENT_CONFIG;
