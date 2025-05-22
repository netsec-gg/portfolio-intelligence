#!/usr/bin/env python3
"""
Tax Optimization Module for Portfolio Intelligence

This module provides tax optimization strategies, tax-loss harvesting,
and helps structure portfolios for tax efficiency.
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
logger = logging.getLogger("TaxOptimizer")

class TaxOptimizer:
    """Tax optimization and tax-efficient investing advisor"""
    
    def __init__(self, portfolio_intelligence, investment_advisor=None):
        """Initialize the tax optimizer with required components"""
        self.portfolio = portfolio_intelligence
        self.advisor = investment_advisor
        self.reports_dir = Path("reports")
        self.reports_dir.mkdir(exist_ok=True)
        
        # Load client profile
        if investment_advisor:
            self.client_profile = investment_advisor.client_profile
        else:
            self.client_profile = self._load_default_profile()
        
        # Define tax parameters
        self.tax_parameters = self._load_tax_parameters()
        
        logger.info("Tax Optimizer initialized")
    
    def _load_default_profile(self):
        """Load default client profile if advisor not available"""
        profile_path = Path("data") / "client_profile.json"
        
        if profile_path.exists():
            try:
                with open(profile_path, 'r') as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Error loading client profile: {str(e)}")
        
        # Default profile
        return {
            "risk_tolerance": "moderate",
            "investment_horizon": 10,
            "tax_bracket": 30,
            "income": 1500000
        }
    
    def _load_tax_parameters(self):
        """Load tax parameters for calculations"""
        # In a real system, these would come from a database or API
        # that is updated with current tax laws
        return {
            "short_term_capital_gains": {
                "rate": self.client_profile["tax_bracket"] / 100,
                "holding_period": 365  # days
            },
            "long_term_capital_gains": {
                "rate": 0.10,
                "holding_period": 365  # days
            },
            "dividend_tax": {
                "rate": self.client_profile["tax_bracket"] / 100
            },
            "tax_loss_harvesting": {
                "wash_sale_period": 30,  # days
                "max_annual_deduction": 100000
            },
            "tax_exempt_investments": [
                "PPF",
                "ELSS",
                "NPS"
            ],
            "section_80c_limit": 150000
        }
    
    def analyze_tax_efficiency(self):
        """Analyze the tax efficiency of the current portfolio"""
        # Ensure we have the latest portfolio data
        self.portfolio.refresh_data()
        
        # Get current portfolio value and holdings
        portfolio_analysis = self.portfolio.analyze_portfolio()
        holdings = self.portfolio.holdings
        
        # For a real implementation, we would need purchase dates
        # Here we're simulating with random holding periods
        current_date = datetime.now()
        np.random.seed(42)  # For reproducible results
        
        # Categorize holdings by tax status
        short_term_holdings = []
        long_term_holdings = []
        dividend_stocks = []
        tax_inefficient = []
        tax_efficient = []
        
        total_value = portfolio_analysis["summary"]["total_value"]
        total_gains = 0
        total_short_term_gains = 0
        total_long_term_gains = 0
        
        for holding in holdings:
            symbol = holding["tradingsymbol"]
            quantity = holding["quantity"]
            current_price = holding["last_price"]
            cost_basis = holding["average_price"]
            value = quantity * current_price
            gain = value - (quantity * cost_basis)
            
            # Simulate holding period (would be actual data in production)
            days_held = np.random.randint(1, 730)  # Random between 1 day and 2 years
            purchase_date = current_date - timedelta(days=days_held)
            
            # Simulate dividend yield (would be actual data in production)
            dividend_yield = 0
            if symbol in ["HDFCBANK", "ICICIBANK", "SBIN", "ITC", "RELIANCE"]:
                dividend_yield = np.random.uniform(0.01, 0.04)  # 1-4% dividend yield
            
            # Categorize by holding period
            is_long_term = days_held > self.tax_parameters["long_term_capital_gains"]["holding_period"]
            
            holding_data = {
                "symbol": symbol,
                "quantity": quantity,
                "cost_basis": cost_basis,
                "current_price": current_price,
                "value": value,
                "gain": gain,
                "gain_percent": (gain / (quantity * cost_basis)) * 100 if cost_basis > 0 else 0,
                "days_held": days_held,
                "purchase_date": purchase_date.strftime("%Y-%m-%d"),
                "dividend_yield": dividend_yield,
                "is_long_term": is_long_term
            }
            
            # Categorize by tax status
            if is_long_term:
                long_term_holdings.append(holding_data)
                total_long_term_gains += max(0, gain)  # Only count positive gains
            else:
                short_term_holdings.append(holding_data)
                total_short_term_gains += max(0, gain)  # Only count positive gains
            
            # Track total gains
            total_gains += gain
            
            # Identify dividend stocks
            if dividend_yield > 0:
                dividend_stocks.append(holding_data)
            
            # Classify tax efficiency
            if dividend_yield > 0.03 or (not is_long_term and gain > 0):
                tax_inefficient.append(holding_data)
            elif is_long_term or gain <= 0:
                tax_efficient.append(holding_data)
        
        # Calculate tax implications
        estimated_tax = 0
        if total_short_term_gains > 0:
            estimated_tax += total_short_term_gains * self.tax_parameters["short_term_capital_gains"]["rate"]
        if total_long_term_gains > 0:
            estimated_tax += total_long_term_gains * self.tax_parameters["long_term_capital_gains"]["rate"]
        
        # Calculate dividend tax
        annual_dividends = sum(h["value"] * h["dividend_yield"] for h in dividend_stocks)
        dividend_tax = annual_dividends * self.tax_parameters["dividend_tax"]["rate"]
        estimated_tax += dividend_tax
        
        # Calculate tax efficiency metrics
        tax_drag = (estimated_tax / total_value) * 100 if total_value > 0 else 0
        
        # Tax efficiency score (0-100)
        tax_efficient_value = sum(h["value"] for h in tax_efficient)
        tax_efficiency_score = (tax_efficient_value / total_value) * 100 if total_value > 0 else 0
        
        # Prepare analysis result
        tax_analysis = {
            "summary": {
                "total_value": total_value,
                "total_gains": total_gains,
                "short_term_gains": total_short_term_gains,
                "long_term_gains": total_long_term_gains,
                "annual_dividends": annual_dividends,
                "estimated_tax": estimated_tax,
                "tax_drag": tax_drag,
                "tax_efficiency_score": tax_efficiency_score
            },
            "holdings_breakdown": {
                "short_term_count": len(short_term_holdings),
                "long_term_count": len(long_term_holdings),
                "dividend_stocks_count": len(dividend_stocks),
                "tax_efficient_count": len(tax_efficient),
                "tax_inefficient_count": len(tax_inefficient)
            },
            "short_term_holdings": short_term_holdings,
            "long_term_holdings": long_term_holdings,
            "dividend_stocks": dividend_stocks,
            "tax_efficient": tax_efficient,
            "tax_inefficient": tax_inefficient,
            "recommendations": self._generate_tax_recommendations(
                short_term_holdings, long_term_holdings, dividend_stocks, tax_inefficient, estimated_tax
            )
        }
        
        return tax_analysis
    
    def _generate_tax_recommendations(self, short_term, long_term, dividend_stocks, tax_inefficient, estimated_tax):
        """Generate tax optimization recommendations"""
        recommendations = []
        
        # 1. Tax-loss harvesting opportunities
        loss_candidates = []
        for holding in short_term + long_term:
            if holding["gain"] < 0:
                loss_candidates.append(holding)
        
        if loss_candidates:
            # Sort by largest losses
            loss_candidates.sort(key=lambda x: x["gain"])
            
            potential_savings = 0
            for candidate in loss_candidates[:3]:  # Top 3 opportunities
                # Calculate potential tax savings
                if candidate["is_long_term"]:
                    rate = self.tax_parameters["long_term_capital_gains"]["rate"]
                else:
                    rate = self.tax_parameters["short_term_capital_gains"]["rate"]
                
                savings = abs(candidate["gain"]) * rate
                potential_savings += savings
                
                recommendations.append({
                    "type": "tax_loss_harvesting",
                    "priority": "high",
                    "description": f"Harvest tax loss from {candidate['symbol']}",
                    "details": f"Sell {candidate['symbol']} to realize loss of ₹{abs(candidate['gain']):,.2f} and potentially save ₹{savings:,.2f} in taxes. Consider similar investments to maintain market exposure while avoiding wash sale rules."
                })
            
            if potential_savings > 0:
                recommendations.append({
                    "type": "tax_loss_summary",
                    "priority": "high",
                    "description": "Implement tax-loss harvesting strategy",
                    "details": f"By harvesting losses, you could potentially save up to ₹{potential_savings:,.2f} in taxes this year."
                })
        
        # 2. Short-term to long-term conversion opportunities
        approaching_long_term = []
        long_term_threshold = self.tax_parameters["long_term_capital_gains"]["holding_period"]
        
        for holding in short_term:
            days_to_long_term = long_term_threshold - holding["days_held"]
            if days_to_long_term <= 60 and holding["gain"] > 0:  # Within 60 days of long-term status
                approaching_long_term.append({
                    "symbol": holding["symbol"],
                    "days_to_long_term": days_to_long_term,
                    "gain": holding["gain"],
                    "potential_tax_saving": holding["gain"] * (
                        self.tax_parameters["short_term_capital_gains"]["rate"] - 
                        self.tax_parameters["long_term_capital_gains"]["rate"]
                    )
                })
        
        if approaching_long_term:
            approaching_long_term.sort(key=lambda x: x["days_to_long_term"])
            
            for candidate in approaching_long_term[:3]:  # Top 3 opportunities
                recommendations.append({
                    "type": "long_term_conversion",
                    "priority": "medium",
                    "description": f"Hold {candidate['symbol']} for {candidate['days_to_long_term']} more days",
                    "details": f"Waiting {candidate['days_to_long_term']} days for long-term status could save approximately ₹{candidate['potential_tax_saving']:,.2f} in taxes."
                })
        
        # 3. Dividend tax efficiency
        high_dividend_value = sum(stock["value"] for stock in dividend_stocks if stock["dividend_yield"] > 0.03)
        high_dividend_percent = (high_dividend_value / self.portfolio.analyze_portfolio()["summary"]["total_value"]) * 100
        
        if high_dividend_percent > 20 and self.client_profile["tax_bracket"] > 20:
            recommendations.append({
                "type": "dividend_tax",
                "priority": "medium",
                "description": "Optimize dividend tax efficiency",
                "details": f"Consider moving high-yield dividend stocks ({high_dividend_percent:.1f}% of portfolio) to tax-advantaged accounts or shifting toward growth-oriented investments for better tax efficiency."
            })
        
        # 4. Tax-advantaged investment opportunities
        if self.client_profile["tax_bracket"] >= 30:
            recommendations.append({
                "type": "tax_advantaged",
                "priority": "medium",
                "description": "Increase tax-advantaged investments",
                "details": "Given your high tax bracket, consider increasing allocations to ELSS funds, PPF, or NPS to reduce tax liability while saving for long-term goals."
            })
        
        # 5. Asset location optimization
        recommendations.append({
            "type": "asset_location",
            "priority": "low",
            "description": "Optimize asset location",
            "details": "Consider holding tax-inefficient assets in tax-advantaged accounts and tax-efficient assets in taxable accounts."
        })
        
        return recommendations
    
    def identify_tax_loss_harvesting_opportunities(self):
        """Identify specific tax-loss harvesting opportunities"""
        # Get tax analysis
        tax_analysis = self.analyze_tax_efficiency()
        
        # Extract holdings with losses
        holdings_with_losses = []
        for holding in tax_analysis["short_term_holdings"] + tax_analysis["long_term_holdings"]:
            if holding["gain"] < 0:
                holdings_with_losses.append(holding)
        
        # Sort by largest losses
        holdings_with_losses.sort(key=lambda x: x["gain"])
        
        # Prepare opportunities
        opportunities = []
        total_potential_savings = 0
        
        for holding in holdings_with_losses:
            # Calculate potential tax savings
            if holding["is_long_term"]:
                rate = self.tax_parameters["long_term_capital_gains"]["rate"]
            else:
                rate = self.tax_parameters["short_term_capital_gains"]["rate"]
            
            loss = abs(holding["gain"])
            tax_savings = loss * rate
            total_potential_savings += tax_savings
            
            # Find potential replacement securities (in a real system, would use a screener)
            # Here we're just providing example alternatives based on sector
            alternatives = self._suggest_alternatives(holding["symbol"])
            
            opportunities.append({
                "symbol": holding["symbol"],
                "current_price": holding["current_price"],
                "quantity": holding["quantity"],
                "total_loss": loss,
                "tax_savings": tax_savings,
                "days_held": holding["days_held"],
                "is_long_term": holding["is_long_term"],
                "alternatives": alternatives,
                "wash_sale_date": (datetime.now() + timedelta(days=self.tax_parameters["tax_loss_harvesting"]["wash_sale_period"])).strftime("%Y-%m-%d")
            })
        
        # Prepare summary
        harvesting_plan = {
            "tax_year": datetime.now().year,
            "total_potential_savings": total_potential_savings,
            "opportunities_count": len(opportunities),
            "opportunities": opportunities,
            "strategy": {
                "description": "Tax-Loss Harvesting Strategy",
                "steps": [
                    "Sell securities with losses to realize tax benefits",
                    "Reinvest proceeds in similar but not substantially identical securities",
                    "Wait 30 days before repurchasing original securities to avoid wash sale rules",
                    "Track realized losses for tax reporting"
                ],
                "considerations": [
                    "Transaction costs may reduce net benefits",
                    "Market movements during 30-day period introduce risk",
                    "Annual loss deduction limit of ₹100,000 for offsetting ordinary income",
                    "Unrealized losses have no tax benefit until sold"
                ]
            }
        }
        
        return harvesting_plan
    
    def _suggest_alternatives(self, symbol):
        """Suggest alternative investments to avoid wash sales"""
        # In a real system, this would use a sophisticated algorithm
        # Here we're just providing example alternatives based on common sectors
        alternatives_map = {
            "INFY": ["TCS", "WIPRO", "HCLTECH", "TECHM"],
            "TCS": ["INFY", "WIPRO", "HCLTECH", "TECHM"],
            "HDFCBANK": ["ICICIBANK", "AXISBANK", "KOTAKBANK", "SBIN"],
            "ICICIBANK": ["HDFCBANK", "AXISBANK", "KOTAKBANK", "SBIN"],
            "RELIANCE": ["IOC", "BPCL", "ONGC"],
            "ITC": ["HINDUNILVR", "DABUR", "MARICO", "NESTLEIND"],
            "TATAMOTORS": ["MARUTI", "M&M", "HEROMOTOCO", "BAJAJ-AUTO"],
            "NIFTYBEES": ["KOTAKBEES", "HDFCNIFTY", "UTINIFTY"],
            "GOLDBEES": ["AXISGOLD", "KOTAKGOLD", "HDFCMFGETF"]
        }
        
        # Default alternatives if symbol not in map
        default_alternatives = ["INDEX ETF", "SECTOR ETF", "Similar company in same sector"]
        
        return alternatives_map.get(symbol, default_alternatives)
    
    def generate_tax_efficient_plan(self):
        """Generate a comprehensive tax-efficient investment plan"""
        # Analyze current tax efficiency
        tax_analysis = self.analyze_tax_efficiency()
        
        # Identify tax-loss harvesting opportunities
        harvesting_plan = self.identify_tax_loss_harvesting_opportunities()
        
        # Calculate current year estimated tax impact
        current_tax_impact = tax_analysis["summary"]["estimated_tax"]
        
        # Develop tax-efficient investment strategy
        tax_bracket = self.client_profile["tax_bracket"]
        annual_income = self.client_profile["income"]
        
        # Tax-advantaged investment recommendations
        tax_advantaged_recommendations = []
        
        # 1. Section 80C investments (up to ₹1.5 lakh)
        section_80c_limit = self.tax_parameters["section_80c_limit"]
        section_80c_recommendations = []
        
        if tax_bracket >= 20:
            section_80c_recommendations = [
                {"instrument": "ELSS Mutual Funds", "allocation": 0.40, "description": "Equity exposure with 3-year lock-in"},
                {"instrument": "PPF", "allocation": 0.30, "description": "Safe government-backed investment with sovereign guarantee"},
                {"instrument": "NPS Tier 1", "allocation": 0.30, "description": "Additional tax benefit under Section 80CCD(1B)"}
            ]
            
            tax_advantaged_recommendations.append({
                "category": "Section 80C",
                "limit": section_80c_limit,
                "tax_saving": section_80c_limit * (tax_bracket / 100),
                "recommendations": section_80c_recommendations
            })
        
        # 2. Asset location strategy
        taxable_account_strategy = []
        tax_advantaged_account_strategy = []
        
        if tax_bracket >= 30:
            # High tax bracket - emphasize tax efficiency
            taxable_account_strategy = [
                {"asset_type": "Growth-oriented stocks", "allocation": 0.40, "description": "Focus on long-term capital appreciation with minimal dividends"},
                {"asset_type": "Index ETFs", "allocation": 0.30, "description": "Low turnover and tax-efficient exposure to market"},
                {"asset_type": "Municipal bonds", "allocation": 0.15, "description": "Tax-exempt interest income"},
                {"asset_type": "Tax-managed funds", "allocation": 0.15, "description": "Actively managed for tax efficiency"}
            ]
            
            tax_advantaged_account_strategy = [
                {"asset_type": "REITs", "allocation": 0.10, "description": "High-income producing real estate investments"},
                {"asset_type": "High-dividend stocks", "allocation": 0.25, "description": "Income-generating stocks with higher tax implications"},
                {"asset_type": "Corporate bonds", "allocation": 0.25, "description": "Taxable interest income better held in tax-advantaged accounts"},
                {"asset_type": "Actively managed funds", "allocation": 0.40, "description": "Higher turnover funds with potential tax implications"}
            ]
        else:
            # Lower tax bracket - more balanced approach
            taxable_account_strategy = [
                {"asset_type": "Blend of growth and dividend stocks", "allocation": 0.50, "description": "Balanced approach to income and growth"},
                {"asset_type": "Index ETFs", "allocation": 0.30, "description": "Core market exposure with tax efficiency"},
                {"asset_type": "Tax-efficient bond funds", "allocation": 0.20, "description": "Fixed income with tax considerations"}
            ]
            
            tax_advantaged_account_strategy = [
                {"asset_type": "High-yield bonds", "allocation": 0.30, "description": "Higher income bonds with greater tax implications"},
                {"asset_type": "REITs", "allocation": 0.20, "description": "Real estate exposure with income focus"},
                {"asset_type": "Actively managed funds", "allocation": 0.50, "description": "Growth-focused active management"}
            ]
        
        # Assemble the complete tax-efficient plan
        tax_plan = {
            "current_tax_assessment": {
                "tax_efficiency_score": tax_analysis["summary"]["tax_efficiency_score"],
                "estimated_annual_tax": current_tax_impact,
                "tax_drag_percent": tax_analysis["summary"]["tax_drag"]
            },
            "tax_loss_harvesting": {
                "immediate_opportunities": len(harvesting_plan["opportunities"]),
                "potential_tax_savings": harvesting_plan["total_potential_savings"]
            },
            "tax_advantaged_investment_strategy": tax_advantaged_recommendations,
            "asset_location_strategy": {
                "taxable_accounts": taxable_account_strategy,
                "tax_advantaged_accounts": tax_advantaged_account_strategy
            },
            "transaction_timing": {
                "end_of_year_considerations": [
                    "Review realized gains and harvest additional losses if needed",
                    "Consider postponing gains until new tax year if beneficial",
                    "Assess mutual fund distribution dates before new investments"
                ],
                "ongoing_monitoring": [
                    "Track holding periods for short-term to long-term transitions",
                    "Monitor tax-loss harvesting opportunities throughout the year",
                    "Review dividend schedules for tax planning"
                ]
            },
            "recommended_actions": self._get_tax_efficient_actions(tax_analysis, harvesting_plan)
        }
        
        # Save tax plan to file
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        plan_path = self.reports_dir / f"tax_efficient_plan_{timestamp}.json"
        
        with open(plan_path, 'w') as f:
            json.dump(tax_plan, f, indent=4)
        
        logger.info(f"Tax efficient plan generated: {plan_path}")
        
        return plan_path
    
    def _get_tax_efficient_actions(self, tax_analysis, harvesting_plan):
        """Generate specific recommended actions for tax efficiency"""
        actions = []
        
        # Add tax-loss harvesting actions
        for opportunity in harvesting_plan["opportunities"][:3]:  # Top 3 opportunities
            actions.append({
                "type": "immediate",
                "priority": "high",
                "action": f"Harvest loss in {opportunity['symbol']}",
                "details": f"Sell {opportunity['quantity']} shares of {opportunity['symbol']} to realize loss of ₹{opportunity['total_loss']:,.2f}, potentially saving ₹{opportunity['tax_savings']:,.2f} in taxes.",
                "considerations": f"Consider replacing with {', '.join(opportunity['alternatives'][:2])} to maintain market exposure."
            })
        
        # Add short-term to long-term conversion actions
        for recommendation in tax_analysis["recommendations"]:
            if recommendation["type"] == "long_term_conversion":
                actions.append({
                    "type": "timing",
                    "priority": recommendation["priority"],
                    "action": recommendation["description"],
                    "details": recommendation["details"]
                })
        
        # Add asset location actions
        if tax_analysis["summary"]["tax_efficiency_score"] < 70:
            actions.append({
                "type": "structural",
                "priority": "medium",
                "action": "Restructure portfolio for tax efficiency",
                "details": "Consider moving dividend-paying stocks to tax-advantaged accounts and holding growth-oriented investments in taxable accounts."
            })
        
        # Add Section 80C recommendation if applicable
        if self.client_profile["tax_bracket"] >= 20:
            actions.append({
                "type": "annual",
                "priority": "high",
                "action": "Maximize Section 80C investments",
                "details": f"Invest ₹{self.tax_parameters['section_80c_limit']:,} in tax-saving instruments like ELSS funds, PPF, and NPS to reduce tax liability by approximately ₹{self.tax_parameters['section_80c_limit'] * (self.client_profile['tax_bracket'] / 100):,.2f}."
            })
        
        return actions

def main():
    """Demo function"""
    # Import components
    from portfolio_analyzer import PortfolioIntelligence
    from investment_advisor import InvestmentAdvisor
    
    # Initialize components
    portfolio = PortfolioIntelligence()
    advisor = InvestmentAdvisor(portfolio)
    
    # Initialize tax optimizer
    tax_optimizer = TaxOptimizer(portfolio, advisor)
    
    # Generate tax analysis
    portfolio.refresh_data()
    tax_analysis = tax_optimizer.analyze_tax_efficiency()
    
    # Generate tax plan
    plan_path = tax_optimizer.generate_tax_efficient_plan()
    
    # Print summary
    print("\n" + "="*70)
    print("           TAX OPTIMIZATION DEMO")
    print("="*70 + "\n")
    
    print("Tax Efficiency Analysis:")
    print(f"  Efficiency Score:     {tax_analysis['summary']['tax_efficiency_score']:.1f}/100")
    print(f"  Estimated Annual Tax: ₹{tax_analysis['summary']['estimated_tax']:,.2f}")
    print(f"  Tax Drag:             {tax_analysis['summary']['tax_drag']:.2f}%")
    
    # Print tax-loss harvesting opportunities
    harvesting_plan = tax_optimizer.identify_tax_loss_harvesting_opportunities()
    print("\nTax-Loss Harvesting Opportunities:")
    print(f"  Total Opportunities:  {harvesting_plan['opportunities_count']}")
    print(f"  Potential Savings:    ₹{harvesting_plan['total_potential_savings']:,.2f}")
    
    # Print top opportunities
    if harvesting_plan["opportunities"]:
        print("\nTop Opportunities:")
        for opportunity in harvesting_plan["opportunities"][:3]:
            print(f"  {opportunity['symbol']}:")
            print(f"    Loss Amount:        ₹{opportunity['total_loss']:,.2f}")
            print(f"    Potential Savings:  ₹{opportunity['tax_savings']:,.2f}")
            print(f"    Alternatives:       {', '.join(opportunity['alternatives'][:2])}")
    
    # Print recommendations
    print("\nKey Recommendations:")
    for rec in tax_analysis["recommendations"][:3]:
        print(f"  [{rec['priority'].upper()}] {rec['description']}")
        print(f"    {rec['details']}")
    
    print(f"\nDetailed tax plan saved to: {plan_path}")
    
    print("\n" + "="*70)

if __name__ == "__main__":
    main() 