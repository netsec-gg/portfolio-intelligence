#!/usr/bin/env python3
"""
PortfolioIntelligence: AI-powered portfolio analysis and optimization tool

This module provides the core functionality for analyzing a portfolio using the
Kite API via Model Context Protocol (MCP) and Claude AI for advanced insights.
"""

import os
import json
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import logging

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("portfolio_intelligence.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("PortfolioIntelligence")

class PortfolioIntelligence:
    """Main class for portfolio analysis and optimization"""
    
    def __init__(self, config_path="config.json"):
        """Initialize with configuration
        
        Args:
            config_path: Path to the configuration JSON file
        """
        self.config = self._load_config(config_path)
        self.kite = None
        self.holdings = None
        self.positions = None
        self.market_data = {}
        self.sector_mapping = {}
        self.news_data = []
        
        # Load sector mappings
        self._load_sector_mappings()
        
        # Initialize Kite connection
        self._initialize_kite()
        
        logger.info("Portfolio Intelligence initialized successfully")
    
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
                "kite_mcp": {
                    "url": "https://mcp.kite.trade/sse",
                    "enabled": True
                },
                "analysis": {
                    "risk_threshold": 25,
                    "correlation_threshold": 0.7,
                    "rebalance_frequency": "monthly",
                    "sector_allocation": {
                        "max_single_sector": 30,
                        "min_sectors": 5
                    }
                },
                "news_sources": [
                    "economic_times",
                    "moneycontrol",
                    "bloomberg_india"
                ]
            }
            return default_config
    
    def _load_sector_mappings(self):
        """Load sector mappings for stocks"""
        # This would ideally come from a database or API
        # For now, we'll use a small sample of mappings
        try:
            with open("data/sector_mappings.json", 'r') as f:
                self.sector_mapping = json.load(f)
        except FileNotFoundError:
            logger.warning("Sector mappings file not found, creating sample data")
            # Create sample sector mappings
            self.sector_mapping = {
                "INFY": "IT",
                "TCS": "IT",
                "HDFCBANK": "Banking",
                "RELIANCE": "Energy",
                "BHARTIARTL": "Telecom",
                "ITC": "FMCG",
                "HINDUNILVR": "FMCG",
                "TATASTEEL": "Metals",
                "ASIANPAINT": "Paints"
                # More would be added in a real implementation
            }
            
            # Save to file for future use
            os.makedirs("data", exist_ok=True)
            with open("data/sector_mappings.json", 'w') as f:
                json.dump(self.sector_mapping, f, indent=2)
    
    def _initialize_kite(self):
        """Initialize Kite connection using MCP"""
        # This is a placeholder for the actual implementation
        # In reality, this would use the MCP connection to Kite
        logger.info("Initializing connection to Kite API via MCP")
        
        # Placeholder - would be replaced with actual kite MCP integration
        class KiteMockClient:
            def __init__(self, url):
                self.url = url
                self.logged_in = False
            
            def login(self):
                self.logged_in = True
                return True
            
            def get_holdings(self):
                # Return sample holdings data
                return [
                    {
                        "tradingsymbol": "INFY",
                        "exchange": "NSE",
                        "quantity": 10,
                        "average_price": 1450.75,
                        "last_price": 1560.25,
                        "pnl": 1095.00,
                        "day_change": 2.3
                    },
                    {
                        "tradingsymbol": "HDFCBANK",
                        "exchange": "NSE",
                        "quantity": 15,
                        "average_price": 1650.50,
                        "last_price": 1710.80,
                        "pnl": 904.50,
                        "day_change": -0.8
                    },
                    {
                        "tradingsymbol": "RELIANCE",
                        "exchange": "NSE",
                        "quantity": 8,
                        "average_price": 2430.25,
                        "last_price": 2510.60,
                        "pnl": 642.80,
                        "day_change": 1.2
                    }
                ]
            
            def get_positions(self):
                # Return sample positions data
                return {
                    "net": [
                        {
                            "tradingsymbol": "NIFTY24JUNFUT",
                            "exchange": "NFO",
                            "quantity": 1,
                            "average_price": 22450.75,
                            "last_price": 22560.25,
                            "pnl": 109.50,
                            "day_change": 0.7
                        }
                    ],
                    "day": []
                }
                
            def get_quote(self, instruments):
                # Return sample quotes data
                quotes = {}
                for instrument in instruments:
                    exchange, symbol = instrument.split(":")
                    quotes[instrument] = {
                        "instrument_token": 12345,
                        "timestamp": datetime.now().isoformat(),
                        "last_price": 1500.25,
                        "volume": 1234567,
                        "ohlc": {
                            "open": 1490.00,
                            "high": 1520.50,
                            "low": 1485.75,
                            "close": 1495.25
                        }
                    }
                return quotes
                
            def get_historical_data(self, instrument_token, from_date, to_date, interval):
                # Return sample historical data
                data = []
                current_date = from_date
                while current_date <= to_date:
                    data.append({
                        "date": current_date.isoformat(),
                        "open": 1500 + np.random.normal(0, 10),
                        "high": 1520 + np.random.normal(0, 10),
                        "low": 1480 + np.random.normal(0, 10),
                        "close": 1510 + np.random.normal(0, 10),
                        "volume": int(100000 + np.random.normal(0, 10000))
                    })
                    if interval == "day":
                        current_date += timedelta(days=1)
                    else:
                        current_date += timedelta(minutes=int(interval.replace("minute", "")))
                return data
                
        # Initialize the mock client
        # In a real implementation, this would use the actual Kite client via MCP
        self.kite = KiteMockClient(self.config["kite_mcp"]["url"])
        success = self.kite.login()
        
        if success:
            logger.info("Successfully connected to Kite API")
        else:
            logger.error("Failed to connect to Kite API")
    
    def refresh_data(self):
        """Refresh all portfolio and market data"""
        logger.info("Refreshing portfolio and market data")
        
        # Get holdings
        self.holdings = self.kite.get_holdings()
        
        # Get positions
        self.positions = self.kite.get_positions()
        
        # Get market data for holdings
        self._fetch_market_data()
        
        # Get latest news
        self._fetch_news()
        
        logger.info(f"Data refreshed: {len(self.holdings)} holdings, {len(self.positions['net'])} net positions")
        return {
            "holdings": self.holdings,
            "positions": self.positions,
            "market_data": self.market_data,
            "news": self.news_data
        }
    
    def _fetch_market_data(self):
        """Fetch market data for holdings"""
        if not self.holdings:
            logger.warning("No holdings available for fetching market data")
            return
        
        instruments = [f"{holding['exchange']}:{holding['tradingsymbol']}" for holding in self.holdings]
        self.market_data = self.kite.get_quote(instruments)
        
        # In a real implementation, we'd also fetch historical data
        # For demonstration, we'll just log this
        logger.info(f"Fetched market data for {len(instruments)} instruments")
    
    def _fetch_news(self):
        """Fetch news related to holdings and general market"""
        # This is a placeholder for actual news fetching
        # In a real implementation, this would use news APIs
        
        # Sample news data
        self.news_data = [
            {
                "title": "IT sector showing signs of recovery, says industry body",
                "source": "Economic Times",
                "url": "https://economictimes.com/tech/article123456.cms",
                "date": datetime.now().isoformat(),
                "relevance": ["INFY", "TCS"],
                "sentiment": 0.75  # Positive sentiment
            },
            {
                "title": "RBI keeps repo rate unchanged, banking stocks show mixed reaction",
                "source": "MoneyControl",
                "url": "https://moneycontrol.com/news/business/markets/article789012.html",
                "date": datetime.now().isoformat(),
                "relevance": ["HDFCBANK", "Banking"],
                "sentiment": 0.1  # Neutral sentiment
            },
            {
                "title": "Oil prices surge 5% on supply concerns",
                "source": "Bloomberg India",
                "url": "https://bloomberg.com/news/articles/article345678",
                "date": datetime.now().isoformat(),
                "relevance": ["RELIANCE", "Energy"],
                "sentiment": -0.6  # Negative sentiment for most, but could be positive for energy
            }
        ]
        
        logger.info(f"Fetched {len(self.news_data)} news articles")
    
    def analyze_portfolio(self):
        """Perform comprehensive portfolio analysis"""
        if not self.holdings:
            logger.warning("No holdings available for analysis")
            return None
        
        logger.info("Performing comprehensive portfolio analysis")
        
        # Ensure we have the latest data
        self.refresh_data()
        
        # Initialize analysis results
        analysis = {
            "summary": {
                "total_value": 0,
                "total_investment": 0,
                "total_pnl": 0,
                "pnl_percentage": 0,
                "day_change": 0
            },
            "sector_allocation": {},
            "risk_metrics": {
                "portfolio_beta": 0,
                "volatility": 0,
                "sharpe_ratio": 0,
                "max_drawdown": 0
            },
            "performance_metrics": {
                "best_performers": [],
                "worst_performers": [],
                "unrealized_gains": 0,
                "unrealized_losses": 0
            },
            "diversification": {
                "hhi_index": 0,  # Herfindahl-Hirschman Index for concentration
                "correlation_matrix": {},
                "high_correlation_pairs": []
            },
            "alerts": [],
            "recommendations": []
        }
        
        # Calculate summary metrics
        total_value = sum(holding["quantity"] * holding["last_price"] for holding in self.holdings)
        total_investment = sum(holding["quantity"] * holding["average_price"] for holding in self.holdings)
        total_pnl = sum(holding["pnl"] for holding in self.holdings)
        
        analysis["summary"]["total_value"] = total_value
        analysis["summary"]["total_investment"] = total_investment
        analysis["summary"]["total_pnl"] = total_pnl
        analysis["summary"]["pnl_percentage"] = (total_pnl / total_investment) * 100 if total_investment > 0 else 0
        
        # Calculate day change
        weighted_day_change = sum(
            (holding["quantity"] * holding["last_price"] * holding["day_change"]) 
            for holding in self.holdings
        ) / total_value if total_value > 0 else 0
        
        analysis["summary"]["day_change"] = weighted_day_change
        
        # Calculate sector allocation
        sector_values = {}
        for holding in self.holdings:
            symbol = holding["tradingsymbol"]
            sector = self.sector_mapping.get(symbol, "Other")
            value = holding["quantity"] * holding["last_price"]
            
            if sector in sector_values:
                sector_values[sector] += value
            else:
                sector_values[sector] = value
        
        # Convert to percentages
        for sector, value in sector_values.items():
            analysis["sector_allocation"][sector] = (value / total_value) * 100 if total_value > 0 else 0
        
        # Identify best and worst performers
        sorted_holdings = sorted(self.holdings, key=lambda h: (h["last_price"] - h["average_price"]) / h["average_price"], reverse=True)
        
        analysis["performance_metrics"]["best_performers"] = [
            {
                "symbol": h["tradingsymbol"],
                "return_percentage": ((h["last_price"] - h["average_price"]) / h["average_price"]) * 100,
                "contribution": (h["pnl"] / total_pnl) * 100 if total_pnl > 0 else 0
            }
            for h in sorted_holdings[:3]  # Top 3
        ]
        
        analysis["performance_metrics"]["worst_performers"] = [
            {
                "symbol": h["tradingsymbol"],
                "return_percentage": ((h["last_price"] - h["average_price"]) / h["average_price"]) * 100,
                "contribution": (h["pnl"] / total_pnl) * 100 if total_pnl < 0 else 0
            }
            for h in sorted_holdings[-3:]  # Bottom 3
        ]
        
        # Calculate unrealized gains and losses
        gains = sum(h["pnl"] for h in self.holdings if h["pnl"] > 0)
        losses = sum(h["pnl"] for h in self.holdings if h["pnl"] < 0)
        
        analysis["performance_metrics"]["unrealized_gains"] = gains
        analysis["performance_metrics"]["unrealized_losses"] = losses
        
        # In a real implementation, we would calculate actual risk metrics
        # For this demo, we'll use placeholder values
        analysis["risk_metrics"] = {
            "portfolio_beta": 1.1,  # > 1 means more volatile than market
            "volatility": 15.2,     # Annual volatility in percentage
            "sharpe_ratio": 0.85,   # Risk-adjusted return
            "max_drawdown": -18.5   # Maximum peak-to-trough decline
        }
        
        # Calculate concentration (HHI)
        hhi = sum((holding["quantity"] * holding["last_price"] / total_value) ** 2 for holding in self.holdings) * 10000
        analysis["diversification"]["hhi_index"] = hhi
        
        # Generate alerts
        self._generate_alerts(analysis)
        
        # Generate recommendations
        self._generate_recommendations(analysis)
        
        logger.info("Portfolio analysis completed successfully")
        return analysis
    
    def _generate_alerts(self, analysis):
        """Generate alerts based on portfolio analysis"""
        alerts = []
        
        # Check sector concentration
        for sector, allocation in analysis["sector_allocation"].items():
            if allocation > self.config["analysis"]["sector_allocation"]["max_single_sector"]:
                alerts.append({
                    "type": "sector_concentration",
                    "severity": "warning",
                    "message": f"High concentration in {sector} sector ({allocation:.2f}%). Consider diversifying."
                })
        
        # Check if number of sectors is too low
        if len(analysis["sector_allocation"]) < self.config["analysis"]["sector_allocation"]["min_sectors"]:
            alerts.append({
                "type": "sector_diversification",
                "severity": "warning",
                "message": f"Portfolio is concentrated in only {len(analysis['sector_allocation'])} sectors. Consider adding more sectors."
            })
        
        # Check portfolio beta
        if analysis["risk_metrics"]["portfolio_beta"] > 1.5:
            alerts.append({
                "type": "high_beta",
                "severity": "warning",
                "message": f"Portfolio beta is high ({analysis['risk_metrics']['portfolio_beta']:.2f}). Consider reducing exposure to volatile stocks."
            })
        
        # Check volatility
        if analysis["risk_metrics"]["volatility"] > 20:
            alerts.append({
                "type": "high_volatility",
                "severity": "warning",
                "message": f"Portfolio volatility is high ({analysis['risk_metrics']['volatility']:.2f}%). Consider adding more stable assets."
            })
        
        # Check drawdown
        if analysis["risk_metrics"]["max_drawdown"] < -25:
            alerts.append({
                "type": "high_drawdown",
                "severity": "warning",
                "message": f"Maximum drawdown is concerning ({analysis['risk_metrics']['max_drawdown']:.2f}%). Consider risk management strategies."
            })
        
        # Check HHI index
        if analysis["diversification"]["hhi_index"] > 2500:
            alerts.append({
                "type": "high_concentration",
                "severity": "warning",
                "message": f"Portfolio is highly concentrated (HHI: {analysis['diversification']['hhi_index']:.2f}). Consider diversifying."
            })
        
        # Add news-based alerts
        for news in self.news_data:
            if news["sentiment"] < -0.5:  # Strongly negative news
                relevant_symbols = news["relevance"]
                alerts.append({
                    "type": "negative_news",
                    "severity": "info",
                    "message": f"Negative news for {', '.join(relevant_symbols)}: {news['title']}",
                    "source": news["source"],
                    "url": news["url"]
                })
        
        analysis["alerts"] = alerts
    
    def _generate_recommendations(self, analysis):
        """Generate recommendations based on portfolio analysis"""
        recommendations = []
        
        # Sector rebalancing recommendations
        overweight_sectors = []
        underweight_sectors = []
        
        # In a real implementation, we'd compare to market weights or target allocation
        # For this demo, we'll use some arbitrary thresholds
        for sector, allocation in analysis["sector_allocation"].items():
            if allocation > 25:
                overweight_sectors.append(sector)
            elif allocation < 5:
                underweight_sectors.append(sector)
        
        if overweight_sectors:
            recommendations.append({
                "type": "sector_rebalance",
                "action": "reduce",
                "target": overweight_sectors,
                "message": f"Consider reducing exposure to {', '.join(overweight_sectors)} sectors to improve diversification."
            })
        
        if underweight_sectors:
            recommendations.append({
                "type": "sector_rebalance",
                "action": "increase",
                "target": underweight_sectors,
                "message": f"Consider increasing exposure to {', '.join(underweight_sectors)} sectors to improve diversification."
            })
        
        # Profit booking recommendations
        for performer in analysis["performance_metrics"]["best_performers"]:
            if performer["return_percentage"] > 30:  # Arbitrary threshold
                recommendations.append({
                    "type": "profit_booking",
                    "action": "sell",
                    "target": performer["symbol"],
                    "message": f"Consider booking partial profits in {performer['symbol']} (+{performer['return_percentage']:.2f}%)."
                })
        
        # Loss cutting recommendations
        for performer in analysis["performance_metrics"]["worst_performers"]:
            if performer["return_percentage"] < -20:  # Arbitrary threshold
                recommendations.append({
                    "type": "loss_cutting",
                    "action": "sell",
                    "target": performer["symbol"],
                    "message": f"Consider cutting losses in {performer['symbol']} ({performer['return_percentage']:.2f}%)."
                })
        
        # Risk management recommendations
        if analysis["risk_metrics"]["volatility"] > 20:
            recommendations.append({
                "type": "risk_management",
                "action": "hedge",
                "message": "Consider hedging strategies to reduce portfolio volatility."
            })
        
        # Add news-based recommendations
        for news in self.news_data:
            if news["sentiment"] > 0.7:  # Strongly positive news
                relevant_symbols = [s for s in news["relevance"] if s in self.sector_mapping.keys()]
                if relevant_symbols:
                    recommendations.append({
                        "type": "news_based",
                        "action": "research",
                        "target": relevant_symbols,
                        "message": f"Positive news for {', '.join(relevant_symbols)}. Consider researching potential opportunity.",
                        "source": news["source"],
                        "url": news["url"]
                    })
        
        analysis["recommendations"] = recommendations
    
    def get_actionable_insights(self):
        """Get actionable insights that can be implemented immediately"""
        analysis = self.analyze_portfolio()
        if not analysis:
            return None
        
        # Summarize the most important insights and actions
        insights = {
            "immediate_actions": [],
            "monitoring_suggestions": [],
            "research_areas": []
        }
        
        # Extract immediate actions from recommendations
        for rec in analysis["recommendations"]:
            if rec["type"] in ["profit_booking", "loss_cutting"]:
                insights["immediate_actions"].append({
                    "action": rec["action"],
                    "target": rec["target"],
                    "message": rec["message"]
                })
        
        # Extract monitoring suggestions from alerts
        for alert in analysis["alerts"]:
            insights["monitoring_suggestions"].append({
                "type": alert["type"],
                "message": alert["message"]
            })
        
        # Extract research areas from news and recommendations
        for news in self.news_data:
            relevant_symbols = [s for s in news["relevance"] if s in self.sector_mapping.keys()]
            if relevant_symbols:
                insights["research_areas"].append({
                    "topic": news["title"],
                    "related_holdings": relevant_symbols,
                    "source": news["source"],
                    "url": news["url"]
                })
        
        logger.info("Generated actionable insights")
        return insights
    
    def get_claude_insights(self):
        """Generate advanced insights using Claude AI via Cursor"""
        # This would integrate with Cursor's Claude features
        # For the demo, we'll create some simulated insights
        
        analysis = self.analyze_portfolio()
        if not analysis:
            return "No portfolio data available for analysis."
        
        # In a real implementation, this would call Claude through the Cursor interface
        # For now, we'll create a placeholder response
        
        claude_insights = f"""
# AI-Powered Portfolio Analysis

## Portfolio Overview
- Total Value: ₹{analysis['summary']['total_value']:.2f}
- Total P&L: ₹{analysis['summary']['total_pnl']:.2f} ({analysis['summary']['pnl_percentage']:.2f}%)
- Day Change: {analysis['summary']['day_change']:.2f}%

## Key Insights

### Sector Allocation
Your portfolio is currently {len(analysis['sector_allocation'])} sectors, with the highest allocations in:
{', '.join([f"{sector} ({allocation:.2f}%)" for sector, allocation in sorted(analysis['sector_allocation'].items(), key=lambda x: x[1], reverse=True)[:3]])}

### Risk Profile
- Beta: {analysis['risk_metrics']['portfolio_beta']:.2f}
- Volatility: {analysis['risk_metrics']['volatility']:.2f}%
- Sharpe Ratio: {analysis['risk_metrics']['sharpe_ratio']:.2f}

### Performance Highlights
Best performers: {', '.join([f"{p['symbol']} (+{p['return_percentage']:.2f}%)" for p in analysis['performance_metrics']['best_performers']])}
Worst performers: {', '.join([f"{p['symbol']} ({p['return_percentage']:.2f}%)" for p in analysis['performance_metrics']['worst_performers']])}

## Recommendations

1. **Consider rebalancing your sector allocation**
   {analysis['recommendations'][0]['message'] if analysis['recommendations'] else 'No specific recommendations at this time.'}

2. **Review your risk exposure**
   {analysis['recommendations'][1]['message'] if len(analysis['recommendations']) > 1 else 'Risk levels appear acceptable at this time.'}

3. **Market News Impact**
   {self.news_data[0]['title'] if self.news_data else 'No significant news impacting your portfolio at this time.'}

## Suggested Actions

{chr(10).join([f"- {action['message']}" for action in analysis['recommendations'][:3]])}
"""
        
        logger.info("Generated Claude AI insights")
        return claude_insights

def main():
    """Main function to demonstrate usage"""
    intelligence = PortfolioIntelligence()
    
    # Refresh data
    intelligence.refresh_data()
    
    # Analyze portfolio
    analysis = intelligence.analyze_portfolio()
    
    # Get actionable insights
    insights = intelligence.get_actionable_insights()
    
    # Get Claude insights
    claude_insights = intelligence.get_claude_insights()
    
    # Output results
    print("\n\n" + "="*50)
    print("PORTFOLIO INTELLIGENCE DEMO")
    print("="*50)
    
    print("\nPortfolio Summary:")
    print(f"Total Value: ₹{analysis['summary']['total_value']:.2f}")
    print(f"Total P&L: ₹{analysis['summary']['total_pnl']:.2f} ({analysis['summary']['pnl_percentage']:.2f}%)")
    
    print("\nTop Alerts:")
    for alert in analysis["alerts"][:3]:
        print(f"- {alert['message']}")
    
    print("\nTop Recommendations:")
    for rec in analysis["recommendations"][:3]:
        print(f"- {rec['message']}")
    
    print("\nClaude AI Insights:")
    print(claude_insights[:500] + "...\n")
    
    print("="*50)
    print("For complete analysis, run with the --full flag")
    print("="*50)

if __name__ == "__main__":
    main() 