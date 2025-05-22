#!/usr/bin/env python3
"""
Portfolio Intelligence Demo

This script demonstrates the Portfolio Intelligence system using sample data.
It doesn't require API keys or real market data, making it easy to see the
system in action without any setup.
"""

import os
import json
import time
import logging
import random
from datetime import datetime, timedelta
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("Demo")

# Ensure we're in the right directory
os.chdir(Path(__file__).parent)

# Create data directory if it doesn't exist
data_dir = Path("data")
data_dir.mkdir(exist_ok=True)

def generate_sample_holdings():
    """Generate sample holdings data"""
    logger.info("Generating sample holdings data...")
    
    # Sample stocks with sector mappings
    stocks = [
        {"symbol": "INFY", "name": "Infosys Ltd", "sector": "IT", "quantity": 50},
        {"symbol": "TCS", "name": "Tata Consultancy Services Ltd", "sector": "IT", "quantity": 20},
        {"symbol": "HDFCBANK", "name": "HDFC Bank Ltd", "sector": "Banking", "quantity": 35},
        {"symbol": "ICICIBANK", "name": "ICICI Bank Ltd", "sector": "Banking", "quantity": 70},
        {"symbol": "RELIANCE", "name": "Reliance Industries Ltd", "sector": "Diversified", "quantity": 15},
        {"symbol": "SBIN", "name": "State Bank of India", "sector": "Banking", "quantity": 100},
        {"symbol": "HINDUNILVR", "name": "Hindustan Unilever Ltd", "sector": "FMCG", "quantity": 25},
        {"symbol": "ASIANPAINT", "name": "Asian Paints Ltd", "sector": "Paints", "quantity": 30},
        {"symbol": "TATAMOTORS", "name": "Tata Motors Ltd", "sector": "Auto", "quantity": 120},
        {"symbol": "MARUTI", "name": "Maruti Suzuki India Ltd", "sector": "Auto", "quantity": 10},
        {"symbol": "SUNPHARMA", "name": "Sun Pharmaceutical Industries Ltd", "sector": "Pharma", "quantity": 40},
        {"symbol": "CIPLA", "name": "Cipla Ltd", "sector": "Pharma", "quantity": 35},
        {"symbol": "ITC", "name": "ITC Ltd", "sector": "FMCG", "quantity": 200},
        {"symbol": "NIFTYBEES", "name": "Nippon India ETF Nifty BeES", "sector": "ETF", "quantity": 150},
        {"symbol": "GOLDBEES", "name": "Nippon India ETF Gold BeES", "sector": "ETF", "quantity": 50},
        {"symbol": "EMBASSY", "name": "Embassy Office Parks REIT", "sector": "REIT", "quantity": 100},
        {"symbol": "TATASTEEL", "name": "Tata Steel Ltd", "sector": "Metals", "quantity": 60},
        {"symbol": "BHARTIARTL", "name": "Bharti Airtel Ltd", "sector": "Telecom", "quantity": 45},
        {"symbol": "WIPRO", "name": "Wipro Ltd", "sector": "IT", "quantity": 80},
        {"symbol": "HCLTECH", "name": "HCL Technologies Ltd", "sector": "IT", "quantity": 30}
    ]
    
    # Generate random prices and returns for each stock
    holdings = []
    total_investment = 0
    total_current_value = 0
    
    for stock in stocks:
        # Generate random price between 500 and 5000
        avg_price = random.uniform(500, 5000)
        
        # Generate random performance between -20% and +50%
        performance = random.uniform(-0.20, 0.50)
        last_price = avg_price * (1 + performance)
        
        # Generate random day change between -3% and +3%
        day_change = random.uniform(-0.03, 0.03)
        day_change_value = last_price * day_change
        
        # Calculate values
        investment = avg_price * stock["quantity"]
        current_value = last_price * stock["quantity"]
        pnl = current_value - investment
        
        # Add to totals
        total_investment += investment
        total_current_value += current_value
        
        # Create holding entry
        holding = {
            "tradingsymbol": stock["symbol"],
            "exchange": "NSE",
            "instrument_token": random.randint(100000, 999999),
            "isin": f"INE{random.randint(100000, 999999)}",
            "product": "CNC",
            "quantity": stock["quantity"],
            "average_price": round(avg_price, 2),
            "last_price": round(last_price, 2),
            "pnl": round(pnl, 2),
            "day_change": round(day_change * 100, 2),
            "day_change_value": round(day_change_value, 2)
        }
        
        holdings.append(holding)
    
    # Save to file
    with open(data_dir / "sample_holdings.json", "w") as f:
        json.dump(holdings, f, indent=4)
    
    logger.info(f"Generated {len(holdings)} sample holdings")
    logger.info(f"Total investment: ₹{total_investment:,.2f}")
    logger.info(f"Total current value: ₹{total_current_value:,.2f}")
    logger.info(f"Total P&L: ₹{total_current_value - total_investment:,.2f}")
    
    return holdings

def generate_sample_market_data():
    """Generate sample market data"""
    logger.info("Generating sample market data...")
    
    # Sample indices
    indices = {
        "NIFTY 50": {
            "last_price": round(random.uniform(19000, 20000), 2),
            "change_percent": round(random.uniform(-1.5, 1.5), 2)
        },
        "NIFTY BANK": {
            "last_price": round(random.uniform(43000, 45000), 2),
            "change_percent": round(random.uniform(-1.5, 1.5), 2)
        },
        "NIFTY IT": {
            "last_price": round(random.uniform(32000, 34000), 2),
            "change_percent": round(random.uniform(-1.5, 1.5), 2)
        },
        "NIFTY PHARMA": {
            "last_price": round(random.uniform(15000, 16000), 2),
            "change_percent": round(random.uniform(-1.5, 1.5), 2)
        },
        "NIFTY AUTO": {
            "last_price": round(random.uniform(18000, 19000), 2),
            "change_percent": round(random.uniform(-1.5, 1.5), 2)
        }
    }
    
    # Sample news
    news_items = [
        {
            "title": "IT stocks gain as rupee weakens against dollar",
            "source": "Economic Times",
            "timestamp": (datetime.now() - timedelta(hours=2)).strftime("%Y-%m-%d %H:%M:%S"),
            "url": "https://economictimes.indiatimes.com/sample-news-1",
            "sentiment": "positive",
            "relevance": ["INFY", "TCS", "WIPRO", "HCLTECH"]
        },
        {
            "title": "Banking stocks rise on credit growth outlook",
            "source": "Moneycontrol",
            "timestamp": (datetime.now() - timedelta(hours=4)).strftime("%Y-%m-%d %H:%M:%S"),
            "url": "https://moneycontrol.com/sample-news-2",
            "sentiment": "positive",
            "relevance": ["HDFCBANK", "ICICIBANK", "SBIN"]
        },
        {
            "title": "Auto sales data shows strong recovery in May",
            "source": "Livemint",
            "timestamp": (datetime.now() - timedelta(hours=6)).strftime("%Y-%m-%d %H:%M:%S"),
            "url": "https://livemint.com/sample-news-3",
            "sentiment": "positive",
            "relevance": ["TATAMOTORS", "MARUTI"]
        },
        {
            "title": "Pharma companies face pricing pressure in US market",
            "source": "Business Standard",
            "timestamp": (datetime.now() - timedelta(hours=8)).strftime("%Y-%m-%d %H:%M:%S"),
            "url": "https://business-standard.com/sample-news-4",
            "sentiment": "negative",
            "relevance": ["SUNPHARMA", "CIPLA"]
        },
        {
            "title": "RBI keeps repo rate unchanged at 6.5%",
            "source": "Bloomberg Quint",
            "timestamp": (datetime.now() - timedelta(hours=10)).strftime("%Y-%m-%d %H:%M:%S"),
            "url": "https://bloombergquint.com/sample-news-5",
            "sentiment": "neutral",
            "relevance": ["HDFCBANK", "ICICIBANK", "SBIN"]
        }
    ]
    
    # Save to files
    with open(data_dir / "sample_indices.json", "w") as f:
        json.dump(indices, f, indent=4)
    
    with open(data_dir / "sample_news.json", "w") as f:
        json.dump(news_items, f, indent=4)
    
    logger.info(f"Generated {len(indices)} sample indices")
    logger.info(f"Generated {len(news_items)} sample news items")
    
    return {"indices": indices, "latest_news": news_items}

def setup_environment():
    """Set up environment for demo"""
    logger.info("Setting up environment for demo...")
    
    # Create mock environment variables
    os.environ["KITE_API_KEY"] = "demo_api_key"
    os.environ["KITE_API_SECRET"] = "demo_api_secret"
    os.environ["PORTFOLIO_INTELLIGENCE_DEMO"] = "true"
    
    # Create sector mappings file
    from config import DEFAULT_SECTOR_MAPPINGS
    with open(data_dir / "sector_mappings.json", "w") as f:
        json.dump(DEFAULT_SECTOR_MAPPINGS, f, indent=4)
    
    logger.info("Environment setup complete")

def patch_classes():
    """Patch classes to use sample data for demo"""
    logger.info("Patching classes for demo...")
    
    # Create patch files
    portfolio_patch = """
# Demo patch for PortfolioIntelligence
def refresh_data(self):
    """Load sample data for demo"""
    import json
    from pathlib import Path
    
    try:
        with open(Path("data") / "sample_holdings.json", "r") as f:
            self.holdings = json.load(f)
        self.logger.info(f"Loaded {len(self.holdings)} sample holdings")
        return True
    except Exception as e:
        self.logger.error(f"Error loading sample holdings: {str(e)}")
        return False
"""
    
    market_patch = """
# Demo patch for MarketMonitor
def update_market_data(self):
    """Load sample market data for demo"""
    import json
    from pathlib import Path
    
    try:
        with open(Path("data") / "sample_indices.json", "r") as f:
            self.indices = json.load(f)
        
        with open(Path("data") / "sample_news.json", "r") as f:
            self.news_cache = json.load(f)
            
        self.logger.info("Updated market data from sample files")
        return True
    except Exception as e:
        self.logger.error(f"Error updating market data: {str(e)}")
        return False
"""
    
    # Save patch files
    with open(data_dir / "portfolio_patch.py", "w") as f:
        f.write(portfolio_patch)
    
    with open(data_dir / "market_patch.py", "w") as f:
        f.write(market_patch)
    
    logger.info("Classes patched for demo")

def run_demo():
    """Run the demo"""
    logger.info("Starting Portfolio Intelligence demo...")
    
    # Generate sample data
    generate_sample_holdings()
    generate_sample_market_data()
    
    # Set up environment
    setup_environment()
    patch_classes()
    
    # Import patched modules
    from portfolio_analyzer import PortfolioIntelligence
    from market_monitor import MarketMonitor
    from claude_insights import ClaudeInsights
    
    # Initialize components
    portfolio = PortfolioIntelligence()
    market = MarketMonitor(portfolio)
    claude = ClaudeInsights(portfolio, market)
    
    # Refresh data
    portfolio.refresh_data()
    market.update_market_data()
    
    # Analyze portfolio
    print("\n" + "="*70)
    print("               PORTFOLIO INTELLIGENCE DEMO")
    print("              Powered by Claude AI and Cursor")
    print("="*70 + "\n")
    
    print("Analyzing portfolio...")
    analysis = portfolio.analyze_portfolio()
    
    # Display summary
    summary = analysis["summary"]
    print(f"\nPortfolio Summary:")
    print(f"  Total Value:     ₹{summary['total_value']:,.2f}")
    print(f"  Investment:      ₹{summary['total_investment']:,.2f}")
    print(f"  P&L:             ₹{summary['total_pnl']:,.2f} ({summary['pnl_percentage']:+.2f}%)")
    print(f"  Day Change:      ₹{summary['day_change_value']:+,.2f} ({summary['day_change_percent']:+.2f}%)")
    print(f"  Stocks:          {len(portfolio.holdings)}")
    print(f"  Sectors:         {len(analysis['sector_allocation'])}")
    print(f"  Sharpe Ratio:    {analysis['risk_metrics']['sharpe_ratio']:.2f}\n")
    
    # Top performers
    print("Top Performers:")
    for stock in analysis["performance_metrics"]["best_performers"][:3]:
        print(f"  {stock['symbol']:<12} {stock['return_percentage']:+.2f}%")
    
    # Worst performers
    print("\nUnderperformers:")
    for stock in analysis["performance_metrics"]["worst_performers"][:3]:
        print(f"  {stock['symbol']:<12} {stock['return_percentage']:+.2f}%")
    
    print("\n" + "-"*70)
    
    # Market summary
    print("\nMarket Summary:")
    market_data = market.get_market_summary()
    for name, data in market_data["indices"].items():
        print(f"  {name:<15} {data['last_price']:,.2f} ({data['change_percent']:+.2f}%)")
    
    print("\nLatest News:")
    for news in market_data["latest_news"][:3]:
        print(f"  - {news['title']} ({news['source']})")
    
    print("\n" + "-"*70)
    
    # Claude insights
    print("\nGenerating Claude AI insights...")
    insights = claude.analyze_portfolio()
    
    print("\nCLAUDE AI INSIGHTS:")
    print("-"*70)
    print(insights)
    
    # Save report
    report_path = claude.save_report()
    print(f"\nFull report saved to: {report_path}")
    
    print("\n" + "="*70)
    print("Demo completed successfully!")
    print("="*70 + "\n")
    
    print("To run the actual Portfolio Intelligence system:")
    print("  1. Set up your API keys")
    print("  2. Run: python main.py --analyze --report")
    print("\nEnjoy using Portfolio Intelligence!\n")

if __name__ == "__main__":
    run_demo() 