#!/usr/bin/env python3
"""
Investment Advisor Module for Portfolio Intelligence

This module provides professional-grade investment advice based on
portfolio analysis, market conditions, and financial goals.
"""

import os
import json
import logging
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("InvestmentAdvisor")

class InvestmentAdvisor:
    """Core investment advisor that provides professional-grade financial advice"""
    
    def __init__(self, portfolio_intelligence, market_monitor=None, claude_insights=None):
        """Initialize the investment advisor with required components"""
        self.portfolio = portfolio_intelligence
        self.market = market_monitor
        self.claude = claude_insights
        self.reports_dir = Path("reports")
        self.reports_dir.mkdir(exist_ok=True)
        self.client_profile = self._load_client_profile()
        logger.info("Investment Advisor initialized")
    
    def _load_client_profile(self):
        """Load client profile from config or use defaults"""
        profile_path = Path("data") / "client_profile.json"
        
        if profile_path.exists():
            try:
                with open(profile_path, 'r') as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Error loading client profile: {str(e)}")
        
        # Default profile
        return {
            "risk_tolerance": "moderate",  # conservative, moderate, aggressive
            "investment_horizon": 10,      # years
            "tax_bracket": 30,             # percent
            "financial_goals": [
                {"name": "Retirement", "target_amount": 10000000, "target_year": 2040},
                {"name": "Home Purchase", "target_amount": 5000000, "target_year": 2025}
            ],
            "age": 35,
            "income": 1500000,
            "monthly_savings": 50000,
            "retirement_age": 60
        }
    
    def save_client_profile(self, profile):
        """Save updated client profile"""
        profile_path = Path("data") / "client_profile.json"
        
        try:
            with open(profile_path, 'w') as f:
                json.dump(profile, f, indent=4)
            self.client_profile = profile
            logger.info("Client profile updated")
            return True
        except Exception as e:
            logger.error(f"Error saving client profile: {str(e)}")
            return False
    
    def get_portfolio_assessment(self):
        """Provide comprehensive assessment of the current portfolio"""
        # Ensure we have the latest portfolio data
        self.portfolio.refresh_data()
        analysis = self.portfolio.analyze_portfolio()
        
        # Get market context if available
        market_context = self.market.get_market_summary() if self.market else {}
        
        # Core portfolio metrics
        summary = analysis["summary"]
        risk_metrics = analysis["risk_metrics"]
        
        # Prepare assessment
        assessment = {
            "overview": {
                "total_value": summary["total_value"],
                "total_investment": summary["total_investment"],
                "total_pnl": summary["total_pnl"],
                "pnl_percentage": summary["pnl_percentage"],
                "holdings_count": len(self.portfolio.holdings),
                "assessment_date": datetime.now().isoformat()
            },
            "risk_profile": {
                "portfolio_beta": risk_metrics["portfolio_beta"],
                "volatility": risk_metrics["volatility"],
                "sharpe_ratio": risk_metrics["sharpe_ratio"],
                "value_at_risk": self._calculate_value_at_risk(analysis),
                "max_drawdown": risk_metrics["max_drawdown"],
                "diversification_score": self._calculate_diversification_score(analysis)
            },
            "allocation": {
                "sectors": analysis["sector_allocation"],
                "asset_classes": self._calculate_asset_class_allocation(),
                "concentration_risk": self._assess_concentration_risk(analysis)
            },
            "performance": {
                "best_performers": analysis["performance_metrics"]["best_performers"][:5],
                "worst_performers": analysis["performance_metrics"]["worst_performers"][:5],
                "overall_rating": self._rate_overall_performance(analysis)
            },
            "recommendations": self._generate_recommendations(analysis, market_context)
        }
        
        return assessment
    
    def _calculate_value_at_risk(self, analysis, confidence=0.95):
        """Calculate Value at Risk (VaR) for the portfolio"""
        portfolio_value = analysis["summary"]["total_value"]
        volatility = analysis["risk_metrics"]["volatility"] / 100  # Convert to decimal
        
        # Simple parametric VaR calculation using normal distribution
        # For more accuracy, historical simulation or Monte Carlo methods would be used
        z_score = 1.645  # 95% confidence level
        daily_var = portfolio_value * volatility * z_score / np.sqrt(252)
        
        return round(daily_var, 2)
    
    def _calculate_diversification_score(self, analysis):
        """Calculate a diversification score for the portfolio"""
        sector_allocation = analysis["sector_allocation"]
        
        # More sectors = better diversification (simple measure)
        sector_count_score = min(len(sector_allocation) / 10, 1) * 0.4
        
        # Evenly distributed sectors = better diversification
        sector_values = list(sector_allocation.values())
        sector_std = np.std(sector_values) if sector_values else 0
        concentration_score = max(0, 1 - (sector_std / 15)) * 0.6
        
        # Combined score (0-100)
        return round((sector_count_score + concentration_score) * 100, 1)
    
    def _calculate_asset_class_allocation(self):
        """Calculate asset class allocation from holdings"""
        asset_classes = {
            "Equity": 0,
            "ETF": 0,
            "REIT": 0,
            "Bonds": 0,
            "Gold": 0,
            "Cash": 0
        }
        
        # Map holdings to asset classes based on product type or sector
        total_value = 0
        
        for holding in self.portfolio.holdings:
            value = holding["quantity"] * holding["last_price"]
            total_value += value
            
            symbol = holding["tradingsymbol"]
            
            # Simplified classification based on symbols
            if "GOLD" in symbol or "GOLDBEES" in symbol:
                asset_classes["Gold"] += value
            elif "BEES" in symbol or "ETF" in symbol:
                asset_classes["ETF"] += value
            elif symbol in ["LIQUIDBEES"]:
                asset_classes["Cash"] += value
            elif "REIT" in symbol or symbol in ["EMBASSY", "MINDSPACE"]:
                asset_classes["REIT"] += value
            elif symbol in ["RITES", "IRFC"]:
                asset_classes["Bonds"] += value
            else:
                asset_classes["Equity"] += value
        
        # Convert to percentages
        if total_value > 0:
            for asset_class in asset_classes:
                asset_classes[asset_class] = round(asset_classes[asset_class] / total_value * 100, 2)
        
        return asset_classes
    
    def _assess_concentration_risk(self, analysis):
        """Assess concentration risk in the portfolio"""
        concentration_risks = []
        
        # Check sector concentration
        for sector, allocation in analysis["sector_allocation"].items():
            if allocation > 25:
                concentration_risks.append({
                    "type": "sector",
                    "name": sector,
                    "allocation": allocation,
                    "recommendation": f"Consider reducing exposure to {sector} sector"
                })
        
        # Check stock concentration
        for holding in self.portfolio.holdings:
            value = holding["quantity"] * holding["last_price"]
            percentage = value / analysis["summary"]["total_value"] * 100
            
            if percentage > 10:
                concentration_risks.append({
                    "type": "stock",
                    "name": holding["tradingsymbol"],
                    "allocation": round(percentage, 2),
                    "recommendation": f"Consider trimming position in {holding['tradingsymbol']}"
                })
        
        return concentration_risks
    
    def _rate_overall_performance(self, analysis):
        """Rate the overall portfolio performance"""
        # Factors to consider
        pnl_percentage = analysis["summary"]["pnl_percentage"]
        sharpe_ratio = analysis["risk_metrics"]["sharpe_ratio"]
        
        # Basic rating algorithm
        if pnl_percentage > 20 and sharpe_ratio > 1.0:
            rating = "Excellent"
        elif pnl_percentage > 10 and sharpe_ratio > 0.7:
            rating = "Good"
        elif pnl_percentage > 0:
            rating = "Satisfactory"
        elif pnl_percentage > -10:
            rating = "Needs Improvement"
        else:
            rating = "Poor"
        
        return rating
    
    def _generate_recommendations(self, analysis, market_context):
        """Generate actionable investment recommendations"""
        recommendations = []
        
        # Rebalancing recommendations
        if self._needs_rebalancing(analysis):
            recommendations.append({
                "type": "rebalancing",
                "priority": "high",
                "description": "Portfolio requires rebalancing to align with target allocation",
                "actions": self._get_rebalancing_actions(analysis)
            })
        
        # Tax optimization
        tax_actions = self._get_tax_optimization_actions(analysis)
        if tax_actions:
            recommendations.append({
                "type": "tax_optimization",
                "priority": "medium",
                "description": "Consider tax-loss harvesting to offset gains",
                "actions": tax_actions
            })
        
        # Risk management
        risk_actions = self._get_risk_management_actions(analysis)
        if risk_actions:
            recommendations.append({
                "type": "risk_management",
                "priority": "high",
                "description": "Portfolio risk level needs attention",
                "actions": risk_actions
            })
        
        # Opportunity recommendations
        if market_context:
            opportunity_actions = self._get_opportunity_actions(analysis, market_context)
            if opportunity_actions:
                recommendations.append({
                    "type": "opportunities",
                    "priority": "medium",
                    "description": "Market opportunities based on current conditions",
                    "actions": opportunity_actions
                })
        
        return recommendations
    
    def _needs_rebalancing(self, analysis):
        """Determine if portfolio needs rebalancing"""
        # Simple check - more sophisticated in practice
        for sector, allocation in analysis["sector_allocation"].items():
            if allocation > 30:  # More than 30% in one sector
                return True
        
        return False
    
    def _get_rebalancing_actions(self, analysis):
        """Get specific rebalancing actions"""
        actions = []
        
        # Check overweight sectors
        for sector, allocation in analysis["sector_allocation"].items():
            if allocation > 30:
                # Find stocks in this sector to reduce
                sector_stocks = [h for h in self.portfolio.holdings 
                                if self._get_sector_for_stock(h["tradingsymbol"]) == sector]
                
                # Sort by position size
                sector_stocks.sort(key=lambda x: x["quantity"] * x["last_price"], reverse=True)
                
                if sector_stocks:
                    top_stock = sector_stocks[0]["tradingsymbol"]
                    actions.append(f"Reduce position in {top_stock} to lower {sector} exposure")
        
        # Check underweight asset classes
        asset_classes = self._calculate_asset_class_allocation()
        if self.client_profile["risk_tolerance"] == "moderate":
            if asset_classes["Equity"] > 75:
                actions.append("Increase bond allocation for better risk balance")
            elif asset_classes["Equity"] < 50:
                actions.append("Increase equity exposure to improve growth potential")
        
        return actions
    
    def _get_tax_optimization_actions(self, analysis):
        """Get tax optimization actions"""
        actions = []
        current_year = datetime.now().year
        
        # Look for tax-loss harvesting opportunities
        loss_makers = [h for h in self.portfolio.holdings if h["pnl"] < 0]
        
        # Sort by largest losses
        loss_makers.sort(key=lambda x: x["pnl"])
        
        for holding in loss_makers[:3]:
            symbol = holding["tradingsymbol"]
            loss_amount = abs(holding["pnl"])
            
            actions.append(f"Consider selling {symbol} to harvest tax loss of ₹{loss_amount:.2f}")
        
        # Look for long-term vs short-term capital gains opportunities
        # Would require purchase date information, simplified here
        
        return actions
    
    def _get_risk_management_actions(self, analysis):
        """Get risk management actions"""
        actions = []
        
        # Check portfolio volatility
        if analysis["risk_metrics"]["volatility"] > 25:
            actions.append("Reduce overall portfolio volatility by adding more stable assets")
        
        # Check for stocks with large drawdowns
        for holding in self.portfolio.holdings:
            if holding["day_change"] < -5:  # More than 5% down in a day
                symbol = holding["tradingsymbol"]
                actions.append(f"Consider setting a stop-loss for {symbol} which is showing high volatility")
        
        # Diversification recommendations
        sector_count = len(analysis["sector_allocation"])
        if sector_count < 5:
            actions.append("Increase sector diversification to reduce concentrated risk")
        
        return actions
    
    def _get_opportunity_actions(self, analysis, market_context):
        """Get opportunity-based actions"""
        actions = []
        
        # Check market conditions for opportunities
        if "indices" in market_context:
            for index_name, index_data in market_context["indices"].items():
                if index_data["change_percent"] < -3:  # Market dip
                    actions.append(f"Consider buying opportunity as {index_name} is down {index_data['change_percent']:.2f}%")
        
        # Check for sector rotation opportunities
        if "latest_news" in market_context:
            # Simplified - would use more advanced sentiment analysis
            positive_sectors = set()
            negative_sectors = set()
            
            for news in market_context["latest_news"]:
                if "sentiment" in news:
                    if news["sentiment"] == "positive" and "relevance" in news:
                        for symbol in news["relevance"]:
                            sector = self._get_sector_for_stock(symbol)
                            if sector:
                                positive_sectors.add(sector)
                    elif news["sentiment"] == "negative" and "relevance" in news:
                        for symbol in news["relevance"]:
                            sector = self._get_sector_for_stock(symbol)
                            if sector:
                                negative_sectors.add(sector)
            
            for sector in positive_sectors:
                if sector not in analysis["sector_allocation"] or analysis["sector_allocation"][sector] < 10:
                    actions.append(f"Consider increasing exposure to {sector} based on positive news")
        
        return actions
    
    def _get_sector_for_stock(self, symbol):
        """Get the sector for a stock"""
        # Would use a mapping table in practice
        # Simplified example mapping
        sector_map = {
            "INFY": "IT",
            "TCS": "IT",
            "HDFCBANK": "Banking",
            "ICICIBANK": "Banking",
            "RELIANCE": "Diversified",
            "ITC": "FMCG",
            "TATAMOTORS": "Auto"
        }
        
        return sector_map.get(symbol, "Other")
    
    def get_retirement_analysis(self):
        """Analyze and provide retirement planning advice"""
        profile = self.client_profile
        current_portfolio = self.portfolio.analyze_portfolio()["summary"]["total_value"]
        
        # Basic retirement calculation
        current_age = profile["age"]
        retirement_age = profile["retirement_age"]
        years_to_retirement = retirement_age - current_age
        
        # Assuming 7% annual return
        annual_return_rate = 0.07
        
        # Calculate future portfolio value
        future_portfolio = current_portfolio * (1 + annual_return_rate) ** years_to_retirement
        
        # Calculate effect of additional savings
        monthly_savings = profile["monthly_savings"]
        annual_savings = monthly_savings * 12
        
        # Future value of monthly contributions
        future_savings = 0
        for year in range(1, years_to_retirement + 1):
            future_savings += annual_savings * (1 + annual_return_rate) ** year
        
        total_retirement_corpus = future_portfolio + future_savings
        
        # Calculate retirement income
        # Assuming 4% safe withdrawal rate
        annual_retirement_income = total_retirement_corpus * 0.04
        monthly_retirement_income = annual_retirement_income / 12
        
        # Calculate if on track for retirement
        retirement_goal = next((goal for goal in profile["financial_goals"] 
                              if goal["name"].lower() == "retirement"), None)
        
        target_amount = retirement_goal["target_amount"] if retirement_goal else total_retirement_corpus * 1.2
        on_track_percentage = (total_retirement_corpus / target_amount) * 100
        
        retirement_analysis = {
            "current_age": current_age,
            "retirement_age": retirement_age,
            "years_to_retirement": years_to_retirement,
            "current_portfolio": current_portfolio,
            "projected_portfolio_growth": future_portfolio,
            "projected_savings_growth": future_savings,
            "total_retirement_corpus": total_retirement_corpus,
            "target_retirement_corpus": target_amount,
            "on_track_percentage": on_track_percentage,
            "projected_monthly_income": monthly_retirement_income,
            "projected_annual_income": annual_retirement_income,
            "status": "On Track" if on_track_percentage >= 80 else "Need Attention",
            "recommendations": self._get_retirement_recommendations(on_track_percentage, current_age, retirement_age)
        }
        
        return retirement_analysis
    
    def _get_retirement_recommendations(self, on_track_percentage, current_age, retirement_age):
        """Generate retirement planning recommendations"""
        recommendations = []
        
        if on_track_percentage < 60:
            recommendations.append("Significantly increase monthly savings to meet retirement goals")
            recommendations.append("Consider postponing retirement by a few years")
            recommendations.append("Evaluate more aggressive investment strategy for higher returns")
        elif on_track_percentage < 80:
            recommendations.append("Moderately increase monthly savings to improve retirement readiness")
            recommendations.append("Review portfolio allocation for potential return enhancement")
        else:
            recommendations.append("Current savings strategy is effective for retirement goals")
            recommendations.append("Consider tax-efficient retirement vehicles for additional optimization")
        
        # Age-specific recommendations
        if current_age < 40:
            recommendations.append("Long time horizon allows for higher equity allocation")
        elif current_age < 50:
            recommendations.append("Begin gradual shift to more conservative allocation in the next 5-10 years")
        else:
            recommendations.append("Focus on wealth preservation and income generation as retirement approaches")
        
        return recommendations
    
    def get_tax_optimization_strategy(self):
        """Provide tax optimization strategy for the portfolio"""
        profile = self.client_profile
        tax_bracket = profile["tax_bracket"]
        portfolio_analysis = self.portfolio.analyze_portfolio()
        
        # Identify tax optimization opportunities
        holdings = self.portfolio.holdings
        
        # Short term vs long term capital gains
        # Would require purchase date data in practice
        short_term_gains = 0
        long_term_gains = 0
        short_term_positions = []
        tax_loss_harvest_candidates = []
        
        # Simplified simulation - in practice would use actual purchase dates
        for holding in holdings:
            value = holding["quantity"] * holding["last_price"]
            pnl = holding["pnl"]
            
            # Simulate some as short-term (less than 1 year)
            if hash(holding["tradingsymbol"]) % 3 == 0:  # Random assignment for demo
                short_term_gains += max(0, pnl)
                if pnl > 0:
                    short_term_positions.append({
                        "symbol": holding["tradingsymbol"],
                        "gain": pnl,
                        "value": value
                    })
            
            # Identify tax loss harvesting candidates
            if pnl < 0:
                tax_loss_harvest_candidates.append({
                    "symbol": holding["tradingsymbol"],
                    "loss": abs(pnl),
                    "value": value
                })
        
        # Sort tax loss harvest candidates by loss amount
        tax_loss_harvest_candidates.sort(key=lambda x: x["loss"], reverse=True)
        
        # Calculate tax implications
        short_term_tax = short_term_gains * (tax_bracket / 100)
        
        # Create optimization strategy
        strategy = {
            "tax_profile": {
                "tax_bracket": tax_bracket,
                "short_term_gains": short_term_gains,
                "estimated_tax_liability": short_term_tax
            },
            "tax_loss_harvesting": {
                "candidates": tax_loss_harvest_candidates[:5],  # Top 5 candidates
                "potential_tax_savings": sum(c["loss"] for c in tax_loss_harvest_candidates[:5]) * (tax_bracket / 100)
            },
            "short_term_positions": {
                "approaching_long_term": short_term_positions,
                "holding_recommendation": "Consider holding positions approaching one-year mark to qualify for lower long-term capital gains tax"
            },
            "recommendations": self._get_tax_recommendations(tax_bracket, short_term_gains, tax_loss_harvest_candidates)
        }
        
        return strategy
    
    def _get_tax_recommendations(self, tax_bracket, short_term_gains, tax_loss_candidates):
        """Generate tax optimization recommendations"""
        recommendations = []
        
        # Tax-loss harvesting
        if tax_loss_candidates:
            total_losses = sum(c["loss"] for c in tax_loss_candidates)
            if short_term_gains > 0:
                if total_losses >= short_term_gains:
                    recommendations.append(f"Harvest losses to offset ₹{short_term_gains:.2f} in short-term gains")
                else:
                    recommendations.append(f"Harvest ₹{total_losses:.2f} in losses to partially offset short-term gains")
            else:
                recommendations.append(f"Harvest up to ₹{total_losses:.2f} in losses to offset other income (subject to limits)")
        
        # Tax-efficient investments
        if tax_bracket >= 30:
            recommendations.append("Consider tax-free or tax-deferred investment vehicles")
            recommendations.append("Increase allocation to ELSS funds for tax benefits under Section 80C")
        
        # Dividend vs growth
        recommendations.append("Prefer growth-oriented investments over dividend-paying stocks for better tax efficiency")
        
        return recommendations
    
    def generate_advisory_report(self, report_type="comprehensive"):
        """Generate a comprehensive advisory report"""
        # Ensure we have the latest data
        self.portfolio.refresh_data()
        
        report = {
            "generated_at": datetime.now().isoformat(),
            "client_profile": self.client_profile,
            "portfolio_assessment": self.get_portfolio_assessment()
        }
        
        if report_type in ["comprehensive", "retirement"]:
            report["retirement_analysis"] = self.get_retirement_analysis()
        
        if report_type in ["comprehensive", "tax"]:
            report["tax_strategy"] = self.get_tax_optimization_strategy()
        
        # Save report
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_path = self.reports_dir / f"advisory_report_{timestamp}.json"
        
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=4)
        
        logger.info(f"Advisory report generated: {report_path}")
        
        # Generate Claude insights if available
        if self.claude:
            insights_path = self.claude.save_report(f"advisory_insights_{timestamp}.md")
            logger.info(f"Claude insights added: {insights_path}")
        
        return report_path

def main():
    """Demo function"""
    # Import components
    from portfolio_analyzer import PortfolioIntelligence
    from market_monitor import MarketMonitor
    from claude_insights import ClaudeInsights
    
    # Initialize components
    portfolio = PortfolioIntelligence()
    market = MarketMonitor(portfolio)
    claude = ClaudeInsights(portfolio, market)
    
    # Initialize investment advisor
    advisor = InvestmentAdvisor(portfolio, market, claude)
    
    # Generate assessment
    portfolio.refresh_data()
    assessment = advisor.get_portfolio_assessment()
    
    # Print overview
    print("\n" + "="*70)
    print("             INVESTMENT ADVISOR DEMO")
    print("="*70 + "\n")
    
    print("Portfolio Assessment:")
    print(f"  Total Value:     ₹{assessment['overview']['total_value']:,.2f}")
    print(f"  Total P&L:       ₹{assessment['overview']['total_pnl']:,.2f} ({assessment['overview']['pnl_percentage']:+.2f}%)")
    print(f"  Risk Rating:     {assessment['risk_profile']['diversification_score']}/100")
    print(f"  Overall Rating:  {assessment['performance']['overall_rating']}")
    
    # Print recommendations
    print("\nKey Recommendations:")
    for rec in assessment["recommendations"]:
        print(f"  [{rec['priority'].upper()}] {rec['description']}")
        for action in rec["actions"][:3]:
            print(f"   - {action}")
    
    # Generate report
    report_path = advisor.generate_advisory_report()
    print(f"\nDetailed advisory report saved to: {report_path}")
    
    print("\n" + "="*70)

if __name__ == "__main__":
    main() 