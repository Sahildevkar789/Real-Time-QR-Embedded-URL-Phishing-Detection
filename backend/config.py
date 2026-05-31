import os

class Config:
    # Flask configuration
    SECRET_KEY = os.environ.get('SECRET_KEY', 'cyberguard_secret_key_12345')
    DEBUG = os.environ.get('FLASK_DEBUG', 'True') == 'True'

    # Uncertainty-Aware Cascade Thresholds
    T_SAFE = 0.05
    T_MALICIOUS = 0.85

    # Suspicious TLDs
    SUSPICIOUS_TLDS = {
        'xyz', 'top', 'fit', 'club', 'online', 'vip', 'gq', 'cf', 
        'tk', 'ml', 'ga', 'cn', 'cc', 'live', 'buzz', 'icu', 'cam',
        'bid', 'stream', 'download', 'win', 'date', 'faith', 'racing'
    }

    # Protected Brands for checking Domain-Brand Mismatch and Brand Tokens in path
    PROTECTED_BRANDS = {
        'paypal', 'google', 'microsoft', 'apple', 'amazon', 'netflix',
        'facebook', 'instagram', 'twitter', 'linkedin', 'yahoo', 
        'dropbox', 'steam', 'roblox', 'chase', 'wellsfargo', 'bankofamerica',
        'citibank', 'hsbc', 'binance', 'coinbase', 'metamask'
    }
