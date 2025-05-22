#!/usr/bin/env python3
"""
Market Monitor module for Portfolio Intelligence

This module provides functionality to monitor markets, track news, and alert
on important market movements or news that could impact the user's portfolio.
"""

import json
import time
import logging
import threading
from datetime import datetime, timedelta
import random  # For demo purposes only

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("market_monitor.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("MarketMonitor")

class MarketMonitor:
    """Class for monitoring market conditions and relevant news"""
    
    def __init__(self, portfolio_intelligence, config_path="config.json"):
        """Initialize market monitor
        
        Args:
            portfolio_intelligence: PortfolioIntelligence instance
            config_path: Path to configuration file
        """
        self.portfolio_intelligence = portfolio_intelligence
        self.config = self._load_config(config_path)
        self.market_indices = {}
        self.monitored_stocks = set()
        self.news_cache = []
        self.alerts = []
        self.running = False
        self.monitoring_thread = None
        
        # Load monitored stocks from portfolio
        self._load_monitored_stocks()
        
        logger.info("Market Monitor initialized")
    
    def _load_config(self, config_path):
        """Load configuration from JSON file"""
        try:
            with open(config_path, 'r') as f:
                config = json.load(f)
                logger.info(f"Configuration loaded from {config_path}")
                return config
        except Exception as e:
            logger.error(f"Error loading configuration: {str(e)}")
            # Create default config
            default_config = {
                "market_monitor": {
                    "indices": ["NIFTY 50", "NIFTY BANK", "NIFTY IT"],
                    "update_interval": 300,  # seconds
                    "price_alert_threshold": 5.0,  # percentage
                    "volume_alert_threshold": 200,  # percentage of average
                    "news_sources": [
                        "economic_times",
                        "moneycontrol",
                        "bloomberg_india",
                        "reuters_india"
                    ],
                    "news_keywords": [
                        "market crash",
                        "market rally",
                        "interest rate",
                        "inflation",
                        "RBI",
                        "Fed",
                        "earnings"
                    ]
                }
            }
            return default_config
    
    def _load_monitored_stocks(self):
        """Load stocks to monitor from portfolio and watchlist"""
        # Get stocks from portfolio
        if hasattr(self.portfolio_intelligence, 'holdings') and self.portfolio_intelligence.holdings:
            for holding in self.portfolio_intelligence.holdings:
                self.monitored_stocks.add(holding["tradingsymbol"])
        
        # Add some key indices to monitor
        for index in self.config["market_monitor"]["indices"]:
            self.monitored_stocks.add(index)
        
        logger.info(f"Monitoring {len(self.monitored_stocks)} stocks and indices")
    
    def start_monitoring(self):
        """Start the market monitoring thread"""
        if self.running:
            logger.warning("Market monitor is already running")
            return
        
        self.running = True
        self.monitoring_thread = threading.Thread(target=self._monitoring_loop)
        self.monitoring_thread.daemon = True
        self.monitoring_thread.start()
        
        logger.info("Market monitoring started")
    
    def stop_monitoring(self):
        """Stop the market monitoring thread"""
        if not self.running:
            logger.warning("Market monitor is not running")
            return
        
        self.running = False
        self.monitoring_thread.join(timeout=5.0)
        
        logger.info("Market monitoring stopped")
    
    def _monitoring_loop(self):
        """Main monitoring loop that runs in a separate thread"""
        update_interval = self.config["market_monitor"]["update_interval"]
        
        while self.running:
            try:
                # Update market data
                self._update_market_data()
                
                # Update news
                self._update_news()
                
                # Check for alerts
                self._check_alerts()
                
                # Sleep for the specified interval
                time.sleep(update_interval)
            except Exception as e:
                logger.error(f"Error in monitoring loop: {str(e)}")
                # Sleep for a shorter interval if there was an error
                time.sleep(min(update_interval, 60))
    
    def _update_market_data(self):
        """Update market data for monitored stocks and indices"""
        logger.info("Updating market data")
        
        # In a real implementation, this would call the Kite API
        # For demo purposes, we'll generate some random data
        
        for symbol in self.monitored_stocks:
            # Check if it's an index
            if symbol in self.config["market_monitor"]["indices"]:
                self._update_index_data(symbol)
            else:
                self._update_stock_data(symbol)
        
        logger.info(f"Updated market data for {len(self.monitored_stocks)} symbols")
    
    def _update_index_data(self, index_name):
        """Update data for a market index"""
        # In a real implementation, this would call the Kite API
        # For demo purposes, we'll generate some random data
        
        # If the index doesn't exist in our data, initialize it
        if index_name not in self.market_indices:
            self.market_indices[index_name] = {
                "last_price": 20000.0 if "NIFTY 50" in index_name else 40000.0 if "NIFTY BANK" in index_name else 30000.0,
                "change": 0.0,
                "change_percent": 0.0,
                "history": [],
                "last_updated": datetime.now()
            }
        
        # Get the current data
        current_data = self.market_indices[index_name]
        
        # Generate a random price change (-1% to +1%)
        change_percent = random.uniform(-1.0, 1.0)
        last_price = current_data["last_price"]
        new_price = last_price * (1 + change_percent / 100)
        
        # Update the data
        self.market_indices[index_name] = {
            "last_price": new_price,
            "change": new_price - last_price,
            "change_percent": change_percent,
            "history": current_data["history"] + [(datetime.now(), new_price)],
            "last_updated": datetime.now()
        }
        
        # Keep only the last 100 historical data points
        if len(self.market_indices[index_name]["history"]) > 100:
            self.market_indices[index_name]["history"] = self.market_indices[index_name]["history"][-100:]
    
    def _update_stock_data(self, symbol):
        """Update data for an individual stock"""
        # In a real implementation, this would call the Kite API
        # For the demo, we'll rely on the portfolio_intelligence instance's data
        
        # Check if we have the stock in our portfolio
        holdings = self.portfolio_intelligence.holdings if hasattr(self.portfolio_intelligence, 'holdings') else []
        for holding in holdings:
            if holding["tradingsymbol"] == symbol:
                # We already have this data in the portfolio_intelligence instance
                return
        
        # If it's not in our portfolio, we would fetch it from the Kite API
        # For the demo, we'll just log this
        logger.debug(f"Would fetch data for non-portfolio stock: {symbol}")
    
    def _update_news(self):
        """Update news data from various sources"""
        logger.info("Updating news data")
        
        # In a real implementation, this would call news APIs
        # For demo purposes, we'll generate some random news
        
        # List of potential news headlines for demo
        potential_headlines = [
            {
                "title": "Markets react positively to government's economic stimulus",
                "source": "Economic Times",
                "url": "https://economictimes.com/markets/stimulus-impact/article123456.cms",
                "relevance": ["NIFTY 50", "NIFTY BANK"],
                "sentiment": 0.8,  # Positive
                "keywords": ["stimulus", "economy", "government"]
            },
            {
                "title": "IT companies report strong quarterly earnings",
                "source": "MoneyControl",
                "url": "https://moneycontrol.com/news/business/earnings/article789012.html",
                "relevance": ["INFY", "TCS", "NIFTY IT"],
                "sentiment": 0.7,  # Positive
                "keywords": ["earnings", "IT sector", "quarterly results"]
            },
            {
                "title": "RBI likely to maintain status quo on interest rates",
                "source": "Bloomberg India",
                "url": "https://bloomberg.com/news/articles/article345678",
                "relevance": ["NIFTY BANK", "HDFCBANK"],
                "sentiment": 0.1,  # Neutral
                "keywords": ["RBI", "interest rates", "monetary policy"]
            },
            {
                "title": "Global markets tumble on recession fears",
                "source": "Reuters India",
                "url": "https://reuters.com/markets/global-market-selloff/article901234",
                "relevance": ["NIFTY 50"],
                "sentiment": -0.8,  # Negative
                "keywords": ["recession", "global markets", "selloff"]
            },
            {
                "title": "Oil prices surge on supply constraints",
                "source": "Economic Times",
                "url": "https://economictimes.com/markets/commodities/article567890.cms",
                "relevance": ["RELIANCE"],
                "sentiment": -0.5,  # Negative for most, but could be positive for energy
                "keywords": ["oil prices", "commodities", "energy"]
            }
        ]
        
        # Randomly select a news item to add
        if random.random() < 0.3:  # 30% chance of new news
            news_item = random.choice(potential_headlines)
            news_item["date"] = datetime.now().isoformat()
            
            # Add to the cache if not already present
            if not any(item["title"] == news_item["title"] for item in self.news_cache):
                self.news_cache.append(news_item)
                
                # Check if this news is relevant to our portfolio
                self._process_news_item(news_item)
        
        # Keep the cache size reasonable
        if len(self.news_cache) > 50:
            self.news_cache = self.news_cache[-50:]
        
        logger.info(f"News cache contains {len(self.news_cache)} items")
    
    def _process_news_item(self, news_item):
        """Process a news item to see if it's relevant and should trigger an alert"""
        # Check if the news is relevant to our monitored stocks
        relevant_symbols = [symbol for symbol in news_item["relevance"] if symbol in self.monitored_stocks]
        
        # Check if the news contains any of our monitored keywords
        relevant_keywords = [keyword for keyword in news_item["keywords"] 
                            if any(monitored_keyword.lower() in keyword.lower() 
                                for monitored_keyword in self.config["market_monitor"]["news_keywords"])]
        
        # If the news is relevant and has a strong sentiment, create an alert
        if (relevant_symbols or relevant_keywords) and abs(news_item["sentiment"]) > 0.5:
            alert = {
                "type": "news",
                "timestamp": datetime.now().isoformat(),
                "title": news_item["title"],
                "source": news_item["source"],
                "url": news_item["url"],
                "relevance": relevant_symbols,
                "sentiment": news_item["sentiment"],
                "keywords": relevant_keywords
            }
            
            self.alerts.append(alert)
            logger.info(f"Added news alert: {news_item['title']}")
    
    def _check_alerts(self):
        """Check for market conditions that should trigger alerts"""
        # Check for significant price movements in indices
        for index_name, index_data in self.market_indices.items():
            price_alert_threshold = self.config["market_monitor"]["price_alert_threshold"]
            
            # Check if the price change exceeds our threshold
            if abs(index_data["change_percent"]) >= price_alert_threshold:
                alert = {
                    "type": "price_movement",
                    "timestamp": datetime.now().isoformat(),
                    "symbol": index_name,
                    "price": index_data["last_price"],
                    "change_percent": index_data["change_percent"],
                    "message": f"{index_name} has moved {index_data['change_percent']:.2f}% today."
                }
                
                # Check if we already have a similar alert
                if not any(a["type"] == "price_movement" and a["symbol"] == index_name for a in self.alerts):
                    self.alerts.append(alert)
                    logger.info(f"Added price movement alert for {index_name}")
        
        # Keep the alerts list at a reasonable size
        if len(self.alerts) > 100:
            self.alerts = self.alerts[-100:]
    
    def get_market_summary(self):
        """Get a summary of current market conditions"""
        summary = {
            "indices": self.market_indices,
            "latest_news": self.news_cache[-5:] if self.news_cache else [],
            "alerts": self.alerts[-10:] if self.alerts else []
        }
        
        return summary
    
    def get_relevant_news(self, symbols=None):
        """Get news relevant to specific symbols"""
        if not symbols:
            # If no symbols are specified, use all monitored stocks
            symbols = list(self.monitored_stocks)
        
        # Filter news to only include items relevant to the specified symbols
        relevant_news = [
            news for news in self.news_cache
            if any(symbol in news["relevance"] for symbol in symbols)
        ]
        
        return relevant_news
    
    def get_market_alerts(self, max_alerts=10):
        """Get recent market alerts"""
        return self.alerts[-max_alerts:] if self.alerts else []

def main():
    """Main function for demonstrating market monitor"""
    # Import here to avoid circular imports
    from portfolio_analyzer import PortfolioIntelligence
    
    # Initialize portfolio intelligence
    portfolio_intelligence = PortfolioIntelligence()
    
    # Initialize market monitor
    monitor = MarketMonitor(portfolio_intelligence)
    
    # Start monitoring
    monitor.start_monitoring()
    
    try:
        # Run for a while, periodically printing updates
        for _ in range(5):
            time.sleep(5)
            
            # Get market summary
            summary = monitor.get_market_summary()
            
            # Print summary
            print("\n\n" + "="*50)
            print("MARKET MONITOR DEMO")
            print("="*50)
            
            print("\nMarket Indices:")
            for index_name, index_data in summary["indices"].items():
                print(f"- {index_name}: {index_data['last_price']:.2f} ({index_data['change_percent']:+.2f}%)")
            
            print("\nLatest News:")
            for news in summary["latest_news"][-3:]:
                print(f"- {news['title']} ({news['source']})")
            
            print("\nAlerts:")
            for alert in summary["alerts"][-3:]:
                if alert["type"] == "price_movement":
                    print(f"- {alert['message']}")
                elif alert["type"] == "news":
                    print(f"- News: {alert['title']}")
            
            print("="*50)
    
    finally:
        # Stop monitoring
        monitor.stop_monitoring()
        print("Market monitoring stopped")

if __name__ == "__main__":
    main() 