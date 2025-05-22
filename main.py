#!/usr/bin/env python3
"""
Portfolio Intelligence System - Main Entry Point

This module ties together all components of the Portfolio Intelligence system.
"""

import os
import sys
import time
import logging
import argparse
from datetime import datetime

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

# Import components
try:
    from portfolio_analyzer import PortfolioIntelligence
    from market_monitor import MarketMonitor
    from claude_insights import ClaudeInsights
    import config
except ImportError as e:
    logger.error(f"Error importing components: {str(e)}")
    sys.exit(1)

def parse_arguments():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description="Portfolio Intelligence System")
    
    parser.add_argument('--analyze', action='store_true', 
                      help='Analyze portfolio and generate insights')
    
    parser.add_argument('--monitor', action='store_true',
                      help='Start market monitoring')
    
    parser.add_argument('--time', type=int, default=0,
                      help='Time in minutes to run monitoring (0 = indefinite)')
    
    parser.add_argument('--report', action='store_true',
                      help='Generate a detailed report')
    
    parser.add_argument('--stock', type=str,
                      help='Get insights for a specific stock')
    
    parser.add_argument('--refresh', action='store_true',
                      help='Force refresh of portfolio data')
    
    parser.add_argument('--alert-only', action='store_true',
                      help='Only show alerts, not full analysis')
    
    return parser.parse_args()

def display_header():
    """Display application header"""
    print("\n" + "="*70)
    print("                  PORTFOLIO INTELLIGENCE SYSTEM")
    print("                 Powered by Claude AI and Cursor")
    print("="*70 + "\n")

def run():
    """Main execution function"""
    args = parse_arguments()
    display_header()
    
    try:
        # Initialize components
        logger.info("Initializing Portfolio Intelligence components...")
        portfolio = PortfolioIntelligence()
        market = MarketMonitor(portfolio)
        claude = ClaudeInsights(portfolio, market)
        
        # Refresh data if requested
        if args.refresh:
            logger.info("Refreshing portfolio data...")
            portfolio.refresh_data()
        
        # Analyze portfolio
        if args.analyze or args.report or args.stock:
            if not args.stock:
                logger.info("Analyzing portfolio...")
                analysis = portfolio.analyze_portfolio()
                
                # Display summary
                summary = analysis["summary"]
                print(f"Portfolio Summary:")
                print(f"  Total Value:     ₹{summary['total_value']:,.2f}")
                print(f"  Investment:      ₹{summary['total_investment']:,.2f}")
                print(f"  P&L:             ₹{summary['total_pnl']:,.2f} ({summary['pnl_percentage']:+.2f}%)")
                print(f"  Day Change:      {summary['day_change_value']:+,.2f} ({summary['day_change_percent']:+.2f}%)")
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
        
        # Get Claude insights
        if args.report:
            logger.info("Generating Claude AI insights...")
            insights = claude.analyze_portfolio()
            
            print("\nCLAUDE AI INSIGHTS:")
            print("-"*70)
            print(insights[:800] + "...\n")
            
            # Save report
            report_path = claude.save_report()
            print(f"Full report saved to: {report_path}")
        
        # Get insights for specific stock
        if args.stock:
            logger.info(f"Generating insights for {args.stock}...")
            stock_insights = claude.get_insights_for_stock(args.stock)
            print("\n" + stock_insights)
        
        # Start monitoring
        if args.monitor:
            logger.info("Starting market monitoring...")
            market.start_monitoring()
            
            try:
                if args.time > 0:
                    print(f"\nMonitoring market for {args.time} minutes...")
                    end_time = time.time() + (args.time * 60)
                    
                    while time.time() < end_time:
                        # Get market summary
                        summary = market.get_market_summary()
                        alerts = market.get_alerts()
                        
                        if not args.alert_only:
                            # Display market summary
                            print(f"\nMarket Summary ({datetime.now().strftime('%H:%M:%S')}):")
                            for name, data in summary["indices"].items():
                                print(f"  {name:<15} {data['last_price']:,.2f} ({data['change_percent']:+.2f}%)")
                        
                        # Display alerts
                        if alerts:
                            print("\nAlerts:")
                            for alert in alerts:
                                print(f"  {alert['timestamp']} - {alert['message']}")
                        
                        # Sleep for 60 seconds
                        time.sleep(60)
                else:
                    print("\nMonitoring market indefinitely. Press Ctrl+C to stop...")
                    while True:
                        # Get market summary
                        summary = market.get_market_summary()
                        alerts = market.get_alerts()
                        
                        if not args.alert_only:
                            # Display market summary
                            print(f"\nMarket Summary ({datetime.now().strftime('%H:%M:%S')}):")
                            for name, data in summary["indices"].items():
                                print(f"  {name:<15} {data['last_price']:,.2f} ({data['change_percent']:+.2f}%)")
                        
                        # Display alerts
                        if alerts:
                            print("\nAlerts:")
                            for alert in alerts:
                                print(f"  {alert['timestamp']} - {alert['message']}")
                        
                        # Sleep for 60 seconds
                        time.sleep(60)
            except KeyboardInterrupt:
                print("\nMonitoring stopped by user.")
            finally:
                market.stop_monitoring()
        
        # If no specific action requested, show help
        if not (args.analyze or args.monitor or args.report or args.stock):
            print("No action specified. Use --help to see available options.")
            
    except Exception as e:
        logger.error(f"Error in main execution: {str(e)}", exc_info=True)
        print(f"\nError: {str(e)}")
    finally:
        print("\nPortfolio Intelligence System execution completed.")

if __name__ == "__main__":
    run() 