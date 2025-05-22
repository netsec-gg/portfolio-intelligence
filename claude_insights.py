#!/usr/bin/env python3
"""
Claude Insights Module for Portfolio Intelligence

This module integrates with Claude AI through Cursor to generate
advanced portfolio insights and recommendations.
"""

import os
import logging
import json
from datetime import datetime

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ClaudeInsights")

class ClaudeInsights:
    """Class for generating portfolio insights using Claude AI through Cursor"""
    
    def __init__(self, portfolio_intelligence, market_monitor=None):
        """Initialize with portfolio and market data sources"""
        self.portfolio = portfolio_intelligence
        self.market = market_monitor
        self.last_analysis = None
        logger.info("Claude Insights initialized")
    
    def analyze_portfolio(self):
        """Analyze portfolio using Claude AI through Cursor"""
        logger.info("Analyzing portfolio with Claude AI")
        
        # Get portfolio and market data
        portfolio_analysis = self.portfolio.analyze_portfolio()
        market_data = self.market.get_market_summary() if self.market else {}
        
        # Create prompt for Claude
        prompt = self._create_claude_prompt(portfolio_analysis, market_data)
        
        # Simulate Claude's response for demo purposes
        # In production, this would call Claude through Cursor's API
        response = self._simulate_claude_response(portfolio_analysis, market_data)
        
        # Save analysis
        self.last_analysis = {
            "timestamp": datetime.now().isoformat(),
            "portfolio_analysis": portfolio_analysis,
            "market_data": market_data,
            "prompt": prompt,
            "response": response
        }
        
        return response
    
    def _create_claude_prompt(self, portfolio, market):
        """Create a prompt for Claude based on portfolio and market data"""
        prompt = """
Please analyze this portfolio data and provide actionable insights.

## Portfolio Summary
- Total Value: {total_value:.2f}
- Total P&L: {total_pnl:.2f} ({pnl_percentage:.2f}%)
- Sector Allocation: {sectors}

## Performance
- Best Performers: {best_performers}
- Worst Performers: {worst_performers}

## Market Conditions
{market_conditions}

Please provide:
1. An assessment of this portfolio's risk-return profile
2. Specific recommendations for optimization
3. Actions to take based on market developments
""".format(
            total_value=portfolio["summary"]["total_value"],
            total_pnl=portfolio["summary"]["total_pnl"],
            pnl_percentage=portfolio["summary"]["pnl_percentage"],
            sectors=", ".join([f"{s}:{a:.1f}%" for s, a in portfolio["sector_allocation"].items()]),
            best_performers=", ".join([f"{p['symbol']} (+{p['return_percentage']:.2f}%)" 
                                     for p in portfolio["performance_metrics"]["best_performers"]]),
            worst_performers=", ".join([f"{p['symbol']} ({p['return_percentage']:.2f}%)" 
                                      for p in portfolio["performance_metrics"]["worst_performers"]]),
            market_conditions=self._format_market_data(market)
        )
        
        return prompt
    
    def _format_market_data(self, market_data):
        """Format market data for the prompt"""
        if not market_data or "indices" not in market_data:
            return "No market data available"
        
        indices = [f"{name}: {data['last_price']:.2f} ({data['change_percent']:+.2f}%)" 
                  for name, data in market_data["indices"].items()]
        
        news = []
        if "latest_news" in market_data and market_data["latest_news"]:
            news = [f"- {item['title']}" for item in market_data["latest_news"][:3]]
        
        return "Indices:\n" + "\n".join(indices) + "\n\nNews:\n" + "\n".join(news)
    
    def _simulate_claude_response(self, portfolio, market):
        """Simulate Claude's response for demo purposes"""
        return f"""# Portfolio Intelligence Report

## Executive Summary

Your portfolio of {len(self.portfolio.holdings)} stocks is valued at ₹{portfolio['summary']['total_value']:.2f} with a total P&L of ₹{portfolio['summary']['total_pnl']:.2f} ({portfolio['summary']['pnl_percentage']:.2f}%).

## Key Insights

1. **Sector Allocation**: Your portfolio is {'well-diversified' if len(portfolio['sector_allocation']) >= 5 else 'concentrated in few sectors'} across {len(portfolio['sector_allocation'])} sectors.

2. **Risk Profile**: With a Sharpe ratio of {portfolio['risk_metrics']['sharpe_ratio']:.2f}, your portfolio {'is generating good returns for the risk taken' if portfolio['risk_metrics']['sharpe_ratio'] > 1 else 'could be optimized for better risk-adjusted returns'}.

3. **Performance**: Your top performer is {portfolio['performance_metrics']['best_performers'][0]['symbol']} (+{portfolio['performance_metrics']['best_performers'][0]['return_percentage']:.2f}%), while {portfolio['performance_metrics']['worst_performers'][-1]['symbol']} is underperforming ({portfolio['performance_metrics']['worst_performers'][-1]['return_percentage']:.2f}%).

## Recommendations

1. **Profit Booking**: {'Consider booking partial profits in high-performing stocks.' if any(p['return_percentage'] > 25 for p in portfolio['performance_metrics']['best_performers']) else 'Hold your profitable positions for now.'}

2. **Portfolio Rebalancing**: {'Reduce exposure to overweight sectors.' if any(allocation > 25 for allocation in portfolio['sector_allocation'].values()) else 'Your sector allocation appears balanced.'}

3. **Risk Management**: {'Add more stable assets to reduce volatility.' if portfolio['risk_metrics']['volatility'] > 20 else 'Your portfolio volatility is within acceptable limits.'}

## Market Context

{self._format_market_context(market) if market else "No market data available."}

## Next Steps

1. Review the specific recommendations for each position
2. Monitor identified risk factors closely
3. Consider rebalancing at your next portfolio review
4. Set up alerts for highlighted stocks

For more detailed analysis, ask specific questions about any holding or sector.
"""
    
    def _format_market_context(self, market_data):
        """Format market context for the response"""
        if not market_data:
            return "No market data available."
        
        result = ""
        
        if "indices" in market_data:
            result += "Market indices:\n"
            for name, data in list(market_data['indices'].items())[:3]:
                result += f"- {name}: {data['last_price']:.2f} ({data['change_percent']:+.2f}%)\n"
        
        if "latest_news" in market_data and market_data["latest_news"]:
            result += "\nRecent market news:\n"
            for news in market_data['latest_news'][:3]:
                result += f"- {news['title']}\n"
        
        return result
    
    def get_insights_for_stock(self, symbol):
        """Get Claude insights for a specific stock"""
        # Find the stock in portfolio
        stock = next((h for h in self.portfolio.holdings if h["tradingsymbol"] == symbol), None)
        if not stock:
            return f"Stock {symbol} not found in portfolio."
        
        # Get relevant news
        news = self.market.get_relevant_news([symbol]) if self.market else []
        
        # Create analysis text
        return f"""# Analysis for {symbol}

## Position Summary
- Current Price: ₹{stock['last_price']:.2f}
- Purchase Price: ₹{stock['average_price']:.2f}
- P&L: ₹{stock['pnl']:.2f} ({((stock['last_price'] - stock['average_price']) / stock['average_price'] * 100):.2f}%)
- Day Change: {stock['day_change']}%

## Recommendation
{self._get_stock_recommendation(stock)}

## Recent News
{self._format_stock_news(news)}
"""
    
    def _get_stock_recommendation(self, stock):
        """Generate a recommendation for a stock"""
        return_percent = ((stock['last_price'] - stock['average_price']) / stock['average_price'] * 100)
        
        if return_percent > 25:
            return "Consider booking partial profits in this position."
        elif return_percent < -15:
            return "Review this position carefully. Consider cutting losses if fundamentals have deteriorated."
        else:
            return "Hold this position and monitor for changes in fundamentals."
    
    def _format_stock_news(self, news):
        """Format news for a stock"""
        if not news:
            return "No recent news found for this stock."
        
        return "\n".join([f"- {item['title']} ({item['source']})" for item in news[:3]])
    
    def save_report(self, filename=None):
        """Save the last analysis to a file"""
        if not self.last_analysis:
            logger.warning("No analysis available to save")
            return None
        
        # Generate filename if not provided
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"portfolio_report_{timestamp}.md"
        
        # Create reports directory if it doesn't exist
        os.makedirs("reports", exist_ok=True)
        
        # Full path to the report file
        report_path = os.path.join("reports", filename)
        
        # Save to file
        try:
            with open(report_path, 'w') as f:
                f.write(self.last_analysis["response"])
            logger.info(f"Report saved to {report_path}")
            return report_path
        except Exception as e:
            logger.error(f"Error saving report: {str(e)}")
            return None

def main():
    """Demo function"""
    # Import here to avoid circular imports
    from portfolio_analyzer import PortfolioIntelligence
    from market_monitor import MarketMonitor
    
    # Initialize components
    portfolio = PortfolioIntelligence()
    market = MarketMonitor(portfolio)
    claude = ClaudeInsights(portfolio, market)
    
    # Generate insights
    market.start_monitoring()
    portfolio.refresh_data()
    insights = claude.analyze_portfolio()
    
    # Print insights
    print("\n" + "="*50)
    print("CLAUDE AI INSIGHTS")
    print("="*50 + "\n")
    print(insights[:500] + "...\n")
    
    # Save report
    report_path = claude.save_report()
    print(f"Full report saved to: {report_path}")
    
    # Clean up
    market.stop_monitoring()

if __name__ == "__main__":
    main() 