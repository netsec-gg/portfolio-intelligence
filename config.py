#!/usr/bin/env python3
"""
Configuration Module for Portfolio Intelligence

This module contains configuration settings and mappings used
across the Portfolio Intelligence system.
"""

import os
import json
import logging
from pathlib import Path

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("Config")

# Base directory
BASE_DIR = Path(__file__).parent

# Directories
REPORTS_DIR = BASE_DIR / "reports"
DATA_DIR = BASE_DIR / "data"

# Create directories if they don't exist
REPORTS_DIR.mkdir(exist_ok=True)
DATA_DIR.mkdir(exist_ok=True)

# Default sector mappings
DEFAULT_SECTOR_MAPPINGS = {
    # IT Sector
    "TCS": "IT", 
    "INFY": "IT",
    "WIPRO": "IT",
    "HCLTECH": "IT",
    "TECHM": "IT",
    "LTI": "IT",
    "MINDTREE": "IT",
    "PERSISTENT": "IT",
    
    # Banking & Finance
    "HDFCBANK": "Banking",
    "ICICIBANK": "Banking",
    "SBIN": "Banking",
    "AXISBANK": "Banking",
    "KOTAKBANK": "Banking",
    "BAJFINANCE": "Finance",
    "HDFC": "Finance",
    "BAJAJFINSV": "Finance",
    "SBILIFE": "Insurance",
    "HDFCLIFE": "Insurance",
    
    # Pharma
    "SUNPHARMA": "Pharma",
    "DIVISLAB": "Pharma",
    "DRREDDY": "Pharma",
    "CIPLA": "Pharma",
    "BIOCON": "Pharma",
    
    # Auto
    "MARUTI": "Auto",
    "TATAMOTORS": "Auto",
    "M&M": "Auto",
    "HEROMOTOCO": "Auto",
    "BAJAJ-AUTO": "Auto",
    
    # Energy & Oil
    "RELIANCE": "Diversified",
    "ONGC": "Oil & Gas",
    "BPCL": "Oil & Gas",
    "IOC": "Oil & Gas",
    "NTPC": "Power",
    "POWERGRID": "Power",
    "ADANIGREEN": "Power",
    "TATAPOWER": "Power",
    
    # FMCG
    "ITC": "FMCG",
    "HINDUNILVR": "FMCG",
    "NESTLEIND": "FMCG",
    "DABUR": "FMCG",
    "MARICO": "FMCG",
    
    # Manufacturing
    "LT": "Engineering",
    "SIEMENS": "Engineering",
    "ABB": "Engineering",
    "HAVELLS": "Engineering",
    
    # Telecom
    "BHARTIARTL": "Telecom",
    "IDEA": "Telecom",
    
    # Metals & Mining
    "TATASTEEL": "Metals",
    "HINDALCO": "Metals",
    "JSWSTEEL": "Metals",
    "COALINDIA": "Mining",
    
    # Others
    "ADANIPORTS": "Infrastructure",
    "DLF": "Realty",
    "INDIGOPNTS": "Chemicals",
    "ASIANPAINT": "Paints",
    "TITAN": "Consumer Durables",
    
    # ETFs
    "NIFTYBEES": "ETF",
    "BANKBEES": "ETF",
    "GOLDBEES": "ETF",
    "LIQUIDBEES": "ETF",
    
    # REITs
    "MINDSPACE": "REIT",
    "EMBASSY": "REIT"
}

# Market indices to track
MARKET_INDICES = [
    "NSE:NIFTY 50",
    "NSE:NIFTY BANK",
    "NSE:NIFTY IT", 
    "NSE:NIFTY PHARMA",
    "NSE:NIFTY AUTO",
    "NSE:NIFTY FMCG"
]

# News sources
NEWS_SOURCES = [
    "Economic Times",
    "Moneycontrol",
    "Livemint",
    "Business Standard",
    "Bloomberg Quint"
]

# API Configuration (placeholder - to be loaded from environment or file)
API_CONFIG = {
    "kite_api_key": os.environ.get("KITE_API_KEY", ""),
    "kite_api_secret": os.environ.get("KITE_API_SECRET", ""),
    "news_api_key": os.environ.get("NEWS_API_KEY", "")
}

# Risk thresholds
RISK_THRESHOLDS = {
    "max_sector_allocation": 30.0,  # Maximum % for any sector
    "max_stock_allocation": 10.0,   # Maximum % for any stock
    "volatility_warning": 25.0,     # Volatility threshold for warning
    "stop_loss_percent": 15.0,      # Default stop loss percentage
    "profit_booking_percent": 25.0  # Default profit booking percentage
}

def load_sector_mappings():
    """Load sector mappings from file or use defaults"""
    mapping_file = DATA_DIR / "sector_mappings.json"
    
    if mapping_file.exists():
        try:
            with open(mapping_file, 'r') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error loading sector mappings: {str(e)}")
            logger.info("Using default sector mappings")
            return DEFAULT_SECTOR_MAPPINGS
    else:
        # Save default mappings
        try:
            with open(mapping_file, 'w') as f:
                json.dump(DEFAULT_SECTOR_MAPPINGS, f, indent=4)
            logger.info(f"Default sector mappings saved to {mapping_file}")
        except Exception as e:
            logger.error(f"Error saving default sector mappings: {str(e)}")
        
        return DEFAULT_SECTOR_MAPPINGS

def load_config():
    """Load configuration from file"""
    config_file = DATA_DIR / "config.json"
    
    if config_file.exists():
        try:
            with open(config_file, 'r') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error loading configuration: {str(e)}")
            logger.info("Using default configuration")
            return {}
    else:
        logger.info("Configuration file not found. Using defaults.")
        return {}

def save_config(config):
    """Save configuration to file"""
    config_file = DATA_DIR / "config.json"
    
    try:
        with open(config_file, 'w') as f:
            json.dump(config, f, indent=4)
        logger.info(f"Configuration saved to {config_file}")
        return True
    except Exception as e:
        logger.error(f"Error saving configuration: {str(e)}")
        return False

# Load configuration when module is imported
CONFIG = load_config()
SECTOR_MAPPINGS = load_sector_mappings() 