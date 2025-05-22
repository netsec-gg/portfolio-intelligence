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
    from investment_advisor import InvestmentAdvisor
    from financial_planning import FinancialPlanner
    from tax_optimizer import TaxOptimizer
    import config
except ImportError as e:
    logger.error(f"Error importing components: {str(e)}")
    sys.exit(1)

def parse_arguments():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description="Portfolio Intelligence System")
    
    # Basic operations
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
    
    # Investment advisor operations
    parser.add_argument('--strategy-assessment', action='store_true',
                      help='Perform portfolio strategy assessment')
    
    parser.add_argument('--risk-profile', type=str, choices=['conservative', 'moderate', 'aggressive'],
                      help='Set risk profile for analysis')
    
    # Financial planning operations
    parser.add_argument('--retirement-plan', action='store_true',
                      help='Generate retirement planning analysis')
    
    parser.add_argument('--target-age', type=int,
                      help='Target retirement age')
    
    parser.add_argument('--monthly-contribution', type=float,
                      help='Monthly savings/contribution amount')
    
    parser.add_argument('--financial-plan', action='store_true',
                      help='Generate comprehensive financial plan')
    
    # Tax optimization operations
    parser.add_argument('--tax-optimize', action='store_true',
                      help='Generate tax optimization recommendations')
    
    parser.add_argument('--tax-bracket', type=int,
                      help='Tax bracket percentage')
    
    parser.add_argument('--tax-loss-harvest', action='store_true',
                      help='Identify tax-loss harvesting opportunities')
    
    # Health check and dashboard
    parser.add_argument('--health-check', action='store_true',
                      help='Perform portfolio health check')
    
    parser.add_argument('--full-report', action='store_true',
                      help='Include full details in reports')
    
    parser.add_argument('--dashboard', action='store_true',
                      help='Generate interactive dashboard')
    
    parser.add_argument('--live', action='store_true',
                      help='Use live data for analysis and monitoring')
    
    return parser.parse_args()

def display_header():
    """Display application header"""
    print("\n" + "="*70)
    print("                  PORTFOLIO INTELLIGENCE SYSTEM")
    print("                 Powered by Claude AI and Cursor")
    print("="*70 + "\n")

def update_client_profile(args, advisor):
    """Update client profile based on command line arguments"""
    profile_updated = False
    current_profile = advisor.client_profile
    
    if args.risk_profile:
        current_profile["risk_tolerance"] = args.risk_profile
        profile_updated = True
    
    if args.target_age:
        current_profile["retirement_age"] = args.target_age
        profile_updated = True
    
    if args.monthly_contribution:
        current_profile["monthly_savings"] = args.monthly_contribution
        profile_updated = True
    
    if args.tax_bracket:
        current_profile["tax_bracket"] = args.tax_bracket
        profile_updated = True
    
    if profile_updated:
        advisor.save_client_profile(current_profile)
        logger.info("Client profile updated with command line parameters")

def run():
    """Main execution function"""
    args = parse_arguments()
    display_header()
    
    try:
        # Initialize core components
        logger.info("Initializing Portfolio Intelligence components...")
        portfolio = PortfolioIntelligence()
        market = MarketMonitor(portfolio)
        claude = ClaudeInsights(portfolio, market)
        
        # Initialize advanced components
        advisor = InvestmentAdvisor(portfolio, market, claude)
        planner = FinancialPlanner(portfolio, advisor)
        tax_optimizer = TaxOptimizer(portfolio, advisor)
        
        # Update client profile if needed
        update_client_profile(args, advisor)
        
        # Refresh data if requested
        if args.refresh or args.live:
            logger.info("Refreshing portfolio data...")
            portfolio.refresh_data()
        
        # Perform strategy assessment
        if args.strategy_assessment:
            logger.info("Performing portfolio strategy assessment...")
            assessment = advisor.get_portfolio_assessment()
            
            print("Portfolio Strategy Assessment:")
            print(f"  Total Value:     ₹{assessment['overview']['total_value']:,.2f}")
            print(f"  P&L:             ₹{assessment['overview']['total_pnl']:,.2f} ({assessment['overview']['pnl_percentage']:+.2f}%)")
            print(f"  Risk Score:      {assessment['risk_profile']['diversification_score']}/100")
            print(f"  Portfolio Rating: {assessment['performance']['overall_rating']}")
            
            print("\nKey Recommendations:")
            for rec in assessment["recommendations"]:
                print(f"  [{rec['priority'].upper()}] {rec['description']}")
                for action in rec["actions"][:3]:
                    print(f"   - {action}")
            
            if args.full_report:
                report_path = advisor.generate_advisory_report()
                print(f"\nDetailed advisory report saved to: {report_path}")
        
        # Generate retirement plan
        if args.retirement_plan:
            logger.info("Generating retirement planning analysis...")
            retirement_analysis = advisor.get_retirement_analysis()
            
            print("Retirement Analysis:")
            print(f"  Current Age:         {retirement_analysis['current_age']}")
            print(f"  Retirement Age:      {retirement_analysis['retirement_age']}")
            print(f"  Years to Retirement: {retirement_analysis['years_to_retirement']}")
            print(f"  Current Portfolio:   ₹{retirement_analysis['current_portfolio']:,.2f}")
            print(f"  Retirement Corpus:   ₹{retirement_analysis['total_retirement_corpus']:,.2f}")
            print(f"  Monthly Income:      ₹{retirement_analysis['projected_monthly_income']:,.2f}")
            print(f"  On Track:            {retirement_analysis['on_track_percentage']:.1f}% ({retirement_analysis['status']})")
            
            print("\nRecommendations:")
            for rec in retirement_analysis["recommendations"]:
                print(f"  - {rec}")
        
        # Generate comprehensive financial plan
        if args.financial_plan:
            logger.info("Generating comprehensive financial plan...")
            print("Generating financial plan...")
            plan_path = planner.generate_financial_plan()
            
            roadmap = planner.create_financial_roadmap()
            retirement = roadmap["retirement_analysis"]
            
            print("\nFinancial Plan Summary:")
            print(f"  Retirement Status:   {retirement['status']}")
            print(f"  Retirement Corpus:   ₹{retirement['retirement_corpus']:,.2f}")
            print(f"  Income Replacement:  {retirement['income_replacement_ratio']:.1f}%")
            
            print("\nFinancial Goals:")
            for goal in roadmap["goals_analysis"]:
                status = "On Track" if goal["projected_to_achieve"] else "Needs Attention"
                print(f"  {goal['name']} ({goal['target_year']}):")
                print(f"    Target:           ₹{goal['target_amount']:,.2f}")
                print(f"    Progress:         {goal['progress_percent']:.1f}%")
                print(f"    Status:           {status}")
            
            print(f"\nDetailed financial plan saved to: {plan_path}")
            print(f"Financial charts saved to: {planner.charts_dir}")
        
        # Generate tax optimization plan
        if args.tax_optimize:
            logger.info("Generating tax optimization recommendations...")
            tax_analysis = tax_optimizer.analyze_tax_efficiency()
            
            print("Tax Efficiency Analysis:")
            print(f"  Efficiency Score:     {tax_analysis['summary']['tax_efficiency_score']:.1f}/100")
            print(f"  Estimated Annual Tax: ₹{tax_analysis['summary']['estimated_tax']:,.2f}")
            print(f"  Tax Drag:             {tax_analysis['summary']['tax_drag']:.2f}%")
            
            print("\nKey Tax Recommendations:")
            for rec in tax_analysis["recommendations"][:3]:
                print(f"  [{rec['priority'].upper()}] {rec['description']}")
                print(f"    {rec['details']}")
            
            if args.full_report:
                plan_path = tax_optimizer.generate_tax_efficient_plan()
                print(f"\nDetailed tax plan saved to: {plan_path}")
        
        # Identify tax-loss harvesting opportunities
        if args.tax_loss_harvest:
            logger.info("Identifying tax-loss harvesting opportunities...")
            harvesting_plan = tax_optimizer.identify_tax_loss_harvesting_opportunities()
            
            print("Tax-Loss Harvesting Opportunities:")
            print(f"  Total Opportunities:  {harvesting_plan['opportunities_count']}")
            print(f"  Potential Savings:    ₹{harvesting_plan['total_potential_savings']:,.2f}")
            
            if harvesting_plan["opportunities"]:
                print("\nTop Opportunities:")
                for opportunity in harvesting_plan["opportunities"][:3]:
                    print(f"  {opportunity['symbol']}:")
                    print(f"    Loss Amount:        ₹{opportunity['total_loss']:,.2f}")
                    print(f"    Potential Savings:  ₹{opportunity['tax_savings']:,.2f}")
                    print(f"    Alternatives:       {', '.join(opportunity['alternatives'][:2])}")
        
        # Perform portfolio health check
        if args.health_check:
            logger.info("Performing portfolio health check...")
            assessment = advisor.get_portfolio_assessment()
            
            print("Portfolio Health Check:")
            
            # Overall health rating
            health_score = (
                assessment["risk_profile"]["diversification_score"] * 0.4 +
                (100 if assessment["risk_profile"]["sharpe_ratio"] > 1 else assessment["risk_profile"]["sharpe_ratio"] * 100) * 0.3 +
                (100 if assessment["overview"]["pnl_percentage"] > 10 else assessment["overview"]["pnl_percentage"] * 10) * 0.3
            )
            
            health_rating = "Excellent" if health_score > 80 else "Good" if health_score > 60 else "Fair" if health_score > 40 else "Needs Attention"
            
            print(f"  Overall Health:      {health_score:.1f}/100 ({health_rating})")
            print(f"  Diversification:     {assessment['risk_profile']['diversification_score']:.1f}/100")
            print(f"  Risk-Adjusted Return: {assessment['risk_profile']['sharpe_ratio']:.2f}")
            print(f"  Volatility:          {assessment['risk_profile']['volatility']:.2f}%")
            
            # Concentration risks
            if assessment["allocation"]["concentration_risk"]:
                print("\nConcentration Risks:")
                for risk in assessment["allocation"]["concentration_risk"]:
                    print(f"  {risk['type'].capitalize()}: {risk['name']} ({risk['allocation']:.1f}%)")
            
            # Quick recommendations
            print("\nQuick Fixes:")
            quick_fixes = [r for r in assessment["recommendations"] if r["priority"] == "high"]
            for fix in quick_fixes[:3]:
                print(f"  - {fix['description']}")
        
        # Generate interactive dashboard
        if args.dashboard:
            logger.info("Generating interactive dashboard...")
            print("Generating interactive dashboard (placeholder)...")
            
            # In a real implementation, this would generate an interactive dashboard
            # For now, we'll just show a summary of key metrics
            
            portfolio_analysis = portfolio.analyze_portfolio()
            assessment = advisor.get_portfolio_assessment()
            tax_analysis = tax_optimizer.analyze_tax_efficiency()
            
            print("\nPortfolio Dashboard:")
            print(f"  Total Value:        ₹{portfolio_analysis['summary']['total_value']:,.2f}")
            print(f"  Day Change:         {portfolio_analysis['summary']['day_change_percent']:+.2f}%")
            print(f"  Overall P&L:        {portfolio_analysis['summary']['pnl_percentage']:+.2f}%")
            print(f"  Diversification:    {assessment['risk_profile']['diversification_score']:.1f}/100")
            print(f"  Tax Efficiency:     {tax_analysis['summary']['tax_efficiency_score']:.1f}/100")
            
            # If live mode, simulate updates
            if args.live:
                print("\nLive Updates (press Ctrl+C to stop):")
                try:
                    for i in range(3):  # Just 3 updates for demo
                        time.sleep(2)
                        print(f"  Update {i+1}: Refreshing market data...")
                        market.update_market_data()
                        print(f"  Market Summary ({datetime.now().strftime('%H:%M:%S')}):")
                        
                        market_data = market.get_market_summary()
                        for name, data in list(market_data["indices"].items())[:3]:
                            print(f"    {name:<15} {data['last_price']:,.2f} ({data['change_percent']:+.2f}%)")
                except KeyboardInterrupt:
                    print("\nLive updates stopped by user.")
        
        # Standard portfolio analysis
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
            symbol = args.stock.upper()
            logger.info(f"Generating insights for {symbol}...")
            
            # First try Claude insights
            stock_insights = claude.get_insights_for_stock(symbol)
            print("\n" + stock_insights)
            
            # Then advisor insights if available
            try:
                # Get detailed advisor recommendations
                holdings = [h for h in portfolio.holdings if h["tradingsymbol"] == symbol]
                if holdings and hasattr(advisor, "get_stock_recommendations"):
                    advisor_insights = advisor.get_stock_recommendations(symbol)
                    print("\nADVISOR RECOMMENDATIONS:")
                    print("-"*70)
                    print(advisor_insights)
            except Exception as e:
                logger.warning(f"Could not get advisor insights for {symbol}: {str(e)}")
        
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
        if not any([
            args.analyze, args.monitor, args.report, args.stock,
            args.strategy_assessment, args.retirement_plan, args.financial_plan,
            args.tax_optimize, args.tax_loss_harvest, args.health_check,
            args.dashboard
        ]):
            print("No action specified. Use --help to see available options.")
            
    except Exception as e:
        logger.error(f"Error in main execution: {str(e)}", exc_info=True)
        print(f"\nError: {str(e)}")
    finally:
        print("\nPortfolio Intelligence System execution completed.")

if __name__ == "__main__":
    run() 