#!/usr/bin/env python3
"""
Financial Planning Module for Portfolio Intelligence

This module provides comprehensive financial planning capabilities,
including retirement planning, goal-based investing, and wealth projections.
"""

import os
import json
import logging
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from pathlib import Path
import matplotlib.pyplot as plt
from matplotlib.ticker import FuncFormatter

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("FinancialPlanning")

class FinancialPlanner:
    """Financial planning and goal-based investment advisor"""
    
    def __init__(self, portfolio_intelligence, investment_advisor=None):
        """Initialize the financial planner with required components"""
        self.portfolio = portfolio_intelligence
        self.advisor = investment_advisor
        self.reports_dir = Path("reports")
        self.reports_dir.mkdir(exist_ok=True)
        self.charts_dir = self.reports_dir / "charts"
        self.charts_dir.mkdir(exist_ok=True)
        
        # Load client profile
        if investment_advisor:
            self.client_profile = investment_advisor.client_profile
        else:
            self.client_profile = self._load_default_profile()
        
        logger.info("Financial Planner initialized")
    
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
            "financial_goals": [
                {"name": "Retirement", "target_amount": 10000000, "target_year": 2040},
                {"name": "Home Purchase", "target_amount": 5000000, "target_year": 2025}
            ],
            "age": 35,
            "income": 1500000,
            "monthly_savings": 50000,
            "retirement_age": 60
        }
    
    def create_financial_roadmap(self):
        """Create a comprehensive financial roadmap"""
        # Ensure we have the latest portfolio data
        self.portfolio.refresh_data()
        
        # Get current portfolio value
        portfolio_value = self.portfolio.analyze_portfolio()["summary"]["total_value"]
        
        # Extract client information
        current_age = self.client_profile["age"]
        retirement_age = self.client_profile["retirement_age"]
        monthly_savings = self.client_profile["monthly_savings"]
        annual_savings = monthly_savings * 12
        financial_goals = self.client_profile["financial_goals"]
        
        # Sort goals by target year
        sorted_goals = sorted(financial_goals, key=lambda x: x["target_year"])
        
        # Initialize timeline
        current_year = datetime.now().year
        timeline = []
        current_portfolio = portfolio_value
        annual_income = self.client_profile["income"]
        
        # Calculate expected returns based on risk profile
        expected_returns = {
            "conservative": 0.06,  # 6%
            "moderate": 0.08,      # 8%
            "aggressive": 0.10     # 10%
        }
        annual_return_rate = expected_returns.get(self.client_profile["risk_tolerance"], 0.08)
        
        # Project financial timeline year by year
        for year in range(current_year, current_year + 40):  # 40-year projection
            age = current_age + (year - current_year)
            
            # Check if we've reached retirement
            is_retired = age >= retirement_age
            
            # Calculate savings contribution (stops at retirement)
            year_contribution = 0 if is_retired else annual_savings
            
            # Calculate portfolio growth
            year_growth = current_portfolio * annual_return_rate
            
            # Check for goal milestones in this year
            year_goals = [g for g in sorted_goals if g["target_year"] == year]
            goal_withdrawals = sum(g["target_amount"] for g in year_goals)
            
            # Calculate retirement withdrawals
            retirement_withdrawal = 0
            if is_retired:
                # 4% safe withdrawal rate
                retirement_withdrawal = current_portfolio * 0.04
            
            # Update portfolio value
            new_portfolio = current_portfolio + year_growth + year_contribution - goal_withdrawals - retirement_withdrawal
            
            # Calculate annual income (includes retirement income if retired)
            if is_retired:
                year_income = retirement_withdrawal
            else:
                # Assume 5% annual income growth until retirement
                year_income = annual_income * (1.05 ** (year - current_year))
            
            # Add to timeline
            timeline.append({
                "year": year,
                "age": age,
                "portfolio_value": current_portfolio,
                "contribution": year_contribution,
                "growth": year_growth,
                "goal_withdrawals": goal_withdrawals,
                "retirement_withdrawal": retirement_withdrawal,
                "year_end_portfolio": new_portfolio,
                "income": year_income,
                "goals_achieved": [g["name"] for g in year_goals],
                "is_retired": is_retired
            })
            
            # Update current portfolio for next year
            current_portfolio = new_portfolio
        
        # Generate charts
        self._generate_wealth_projection_chart(timeline)
        self._generate_goals_chart(sorted_goals, timeline)
        
        # Generate roadmap summary
        roadmap = {
            "client_profile": self.client_profile,
            "current_portfolio": portfolio_value,
            "expected_annual_return": annual_return_rate * 100,
            "timeline": timeline,
            "retirement_analysis": self._analyze_retirement(timeline),
            "goals_analysis": self._analyze_goals(sorted_goals, timeline),
            "recommendations": self._generate_roadmap_recommendations(timeline, sorted_goals)
        }
        
        return roadmap
    
    def _analyze_retirement(self, timeline):
        """Analyze retirement readiness from timeline"""
        retirement_age = self.client_profile["retirement_age"]
        
        # Find retirement year in timeline
        retirement_entries = [t for t in timeline if t["age"] == retirement_age]
        if not retirement_entries:
            return {
                "status": "Unknown",
                "retirement_corpus": 0,
                "sustainable_income": 0,
                "income_replacement_ratio": 0
            }
        
        retirement_entry = retirement_entries[0]
        
        # Get pre-retirement income (year before retirement)
        pre_retirement_entries = [t for t in timeline if t["age"] == retirement_age - 1]
        pre_retirement_income = pre_retirement_entries[0]["income"] if pre_retirement_entries else 0
        
        # Calculate income replacement ratio
        retirement_corpus = retirement_entry["portfolio_value"]
        sustainable_income = retirement_corpus * 0.04  # 4% rule
        income_replacement_ratio = (sustainable_income / pre_retirement_income * 100) if pre_retirement_income > 0 else 0
        
        # Determine retirement readiness status
        if income_replacement_ratio >= 80:
            status = "Excellent"
        elif income_replacement_ratio >= 60:
            status = "Good"
        elif income_replacement_ratio >= 40:
            status = "Adequate"
        else:
            status = "Needs Attention"
        
        # Project portfolio sustainability in retirement
        retirement_timeline = [t for t in timeline if t["is_retired"]]
        end_portfolio = retirement_timeline[-1]["year_end_portfolio"] if retirement_timeline else 0
        
        sustainability = "Sustainable" if end_portfolio > retirement_corpus * 0.5 else "At Risk"
        
        return {
            "status": status,
            "retirement_corpus": retirement_corpus,
            "sustainable_income": sustainable_income,
            "income_replacement_ratio": income_replacement_ratio,
            "portfolio_sustainability": sustainability,
            "portfolio_at_age_90": end_portfolio
        }
    
    def _analyze_goals(self, goals, timeline):
        """Analyze progress toward financial goals"""
        goals_analysis = []
        current_year = datetime.now().year
        
        for goal in goals:
            goal_year = goal["target_year"]
            goal_amount = goal["target_amount"]
            years_to_goal = goal_year - current_year
            
            # Find current progress
            current_portfolio = self.portfolio.analyze_portfolio()["summary"]["total_value"]
            
            # Simplified allocation model (in practice would be more sophisticated)
            # Assume larger allocation to nearer-term goals
            if years_to_goal <= 3:
                allocation_percent = 0.3  # 30% allocation to short-term goals
            elif years_to_goal <= 10:
                allocation_percent = 0.4  # 40% allocation to medium-term goals
            else:
                allocation_percent = 0.3  # 30% allocation to long-term goals
            
            # Adjust based on goal size relative to portfolio
            allocation_percent = min(allocation_percent, goal_amount / (current_portfolio * 2)) if current_portfolio > 0 else 0.1
            
            current_allocation = current_portfolio * allocation_percent
            progress_percent = (current_allocation / goal_amount) * 100
            
            # Calculate projected progress
            goal_timeline = [t for t in timeline if t["year"] <= goal_year]
            if goal_timeline:
                final_entry = goal_timeline[-1]
                
                # Check if goal is marked as achieved in timeline
                goal_achieved = goal["name"] in final_entry["goals_achieved"]
                
                # Calculate required monthly savings to reach goal
                required_monthly_savings = 0
                if years_to_goal > 0 and not goal_achieved:
                    shortfall = goal_amount - current_allocation
                    # Using PMT formula
                    r = (1 + self._get_expected_return_for_timeframe(years_to_goal)) ** (1/12) - 1  # Monthly rate
                    n = years_to_goal * 12  # Number of months
                    required_monthly_savings = (shortfall * r) / ((1 + r) ** n - 1)
            else:
                goal_achieved = False
                required_monthly_savings = 0
            
            goals_analysis.append({
                "name": goal["name"],
                "target_amount": goal_amount,
                "target_year": goal_year,
                "years_remaining": years_to_goal,
                "current_allocation": current_allocation,
                "progress_percent": progress_percent,
                "required_monthly_savings": required_monthly_savings,
                "projected_to_achieve": goal_achieved,
                "recommended_allocation": self._recommend_goal_allocation(goal, years_to_goal)
            })
        
        return goals_analysis
    
    def _get_expected_return_for_timeframe(self, years):
        """Get expected return rate based on time horizon and risk profile"""
        risk_tolerance = self.client_profile["risk_tolerance"]
        
        # Base rates by risk profile
        base_rates = {
            "conservative": 0.05,  # 5%
            "moderate": 0.07,      # 7%
            "aggressive": 0.09     # 9%
        }
        
        base_rate = base_rates.get(risk_tolerance, 0.07)
        
        # Adjust based on time horizon
        if years < 3:
            # Short-term - lower return expectation
            return base_rate - 0.02
        elif years < 10:
            # Medium-term - standard return expectation
            return base_rate
        else:
            # Long-term - higher return expectation
            return base_rate + 0.01
    
    def _recommend_goal_allocation(self, goal, years_to_goal):
        """Recommend asset allocation for a specific goal"""
        # Base allocations by time horizon
        if years_to_goal < 3:
            # Short-term goals need stability
            return {
                "Equity": 20,
                "Bonds": 50,
                "Cash": 30,
                "Gold": 0,
                "REIT": 0
            }
        elif years_to_goal < 7:
            # Medium-term goals need balanced approach
            return {
                "Equity": 50,
                "Bonds": 30,
                "Cash": 10,
                "Gold": 5,
                "REIT": 5
            }
        else:
            # Long-term goals can have higher equity
            return {
                "Equity": 70,
                "Bonds": 15,
                "Cash": 5,
                "Gold": 5,
                "REIT": 5
            }
    
    def _generate_roadmap_recommendations(self, timeline, goals):
        """Generate recommendations based on financial roadmap"""
        recommendations = []
        current_year = datetime.now().year
        
        # Analyze retirement readiness
        retirement_analysis = self._analyze_retirement(timeline)
        
        if retirement_analysis["income_replacement_ratio"] < 60:
            recommendations.append({
                "category": "Retirement",
                "priority": "high",
                "description": "Increase retirement savings",
                "details": f"Current income replacement ratio of {retirement_analysis['income_replacement_ratio']:.1f}% is below target. Consider increasing monthly contributions."
            })
        
        # Analyze near-term goals
        near_term_goals = [g for g in goals if g["target_year"] - current_year <= 5]
        goals_analysis = self._analyze_goals(goals, timeline)
        
        for goal in near_term_goals:
            goal_analysis = next((g for g in goals_analysis if g["name"] == goal["name"]), None)
            if goal_analysis and goal_analysis["progress_percent"] < 70:
                recommendations.append({
                    "category": "Goal Planning",
                    "priority": "high",
                    "description": f"Accelerate savings for {goal['name']}",
                    "details": f"Current progress is only {goal_analysis['progress_percent']:.1f}%. Consider monthly contribution of ₹{goal_analysis['required_monthly_savings']:,.2f} to achieve this goal."
                })
        
        # Investment allocation recommendations
        current_asset_allocation = None
        if hasattr(self.advisor, '_calculate_asset_class_allocation'):
            current_asset_allocation = self.advisor._calculate_asset_class_allocation()
        
        if current_asset_allocation:
            risk_profile = self.client_profile["risk_tolerance"]
            
            # Target allocations by risk profile
            target_allocations = {
                "conservative": {"Equity": 40, "Bonds": 40, "Cash": 10, "Gold": 5, "REIT": 5},
                "moderate": {"Equity": 60, "Bonds": 25, "Cash": 5, "Gold": 5, "REIT": 5},
                "aggressive": {"Equity": 80, "Bonds": 10, "Cash": 0, "Gold": 5, "REIT": 5}
            }
            
            target = target_allocations.get(risk_profile, target_allocations["moderate"])
            
            # Check for significant deviations
            for asset_class, target_pct in target.items():
                current_pct = current_asset_allocation.get(asset_class, 0)
                if abs(current_pct - target_pct) > 15:  # More than 15% deviation
                    action = "Increase" if current_pct < target_pct else "Reduce"
                    recommendations.append({
                        "category": "Asset Allocation",
                        "priority": "medium",
                        "description": f"{action} {asset_class} allocation",
                        "details": f"Current allocation of {current_pct:.1f}% differs from target of {target_pct:.1f}%. Consider rebalancing."
                    })
        
        # Cash reserve recommendations
        emergency_fund = 6 * (self.client_profile["income"] / 12)  # 6 months of expenses
        cash_allocation = current_asset_allocation.get("Cash", 0) if current_asset_allocation else 0
        current_cash = self.portfolio.analyze_portfolio()["summary"]["total_value"] * (cash_allocation / 100)
        
        if current_cash < emergency_fund:
            recommendations.append({
                "category": "Emergency Fund",
                "priority": "high",
                "description": "Build emergency fund",
                "details": f"Current cash reserves of ₹{current_cash:,.2f} are below the recommended 6 months of expenses (₹{emergency_fund:,.2f})."
            })
        
        return recommendations
    
    def _generate_wealth_projection_chart(self, timeline):
        """Generate wealth projection chart"""
        years = [t["year"] for t in timeline]
        portfolio_values = [t["portfolio_value"] for t in timeline]
        
        plt.figure(figsize=(12, 6))
        plt.plot(years, portfolio_values, marker='o', linestyle='-', linewidth=2)
        
        # Mark retirement year
        retirement_age = self.client_profile["retirement_age"]
        current_age = self.client_profile["age"]
        current_year = datetime.now().year
        retirement_year = current_year + (retirement_age - current_age)
        
        retirement_entries = [t for t in timeline if t["year"] == retirement_year]
        if retirement_entries:
            retirement_value = retirement_entries[0]["portfolio_value"]
            plt.axvline(x=retirement_year, color='r', linestyle='--', alpha=0.7)
            plt.annotate(f'Retirement\n₹{retirement_value/1000000:.1f}M', 
                        xy=(retirement_year, retirement_value),
                        xytext=(retirement_year+1, retirement_value*1.1),
                        arrowprops=dict(facecolor='red', shrink=0.05, alpha=0.7))
        
        # Mark goal milestones
        for goal in self.client_profile["financial_goals"]:
            goal_year = goal["target_year"]
            goal_entries = [t for t in timeline if t["year"] == goal_year]
            if goal_entries:
                goal_value = goal_entries[0]["portfolio_value"]
                plt.scatter(goal_year, goal_value, s=100, c='green', zorder=5)
                plt.annotate(f'{goal["name"]}\n₹{goal["target_amount"]/100000:.1f}L', 
                            xy=(goal_year, goal_value),
                            xytext=(goal_year-1, goal_value*0.9),
                            arrowprops=dict(facecolor='green', shrink=0.05))
        
        # Format y-axis to show in lakhs/crores
        def crore_formatter(x, pos):
            if x >= 10000000:  # 1 crore
                return f'₹{x/10000000:.1f}Cr'
            elif x >= 100000:  # 1 lakh
                return f'₹{x/100000:.1f}L'
            else:
                return f'₹{x:.0f}'
            
        plt.gca().yaxis.set_major_formatter(FuncFormatter(crore_formatter))
        
        plt.title('Wealth Projection Timeline', fontsize=16)
        plt.xlabel('Year', fontsize=12)
        plt.ylabel('Portfolio Value', fontsize=12)
        plt.grid(True, alpha=0.3)
        plt.tight_layout()
        
        # Save chart
        chart_path = self.charts_dir / "wealth_projection.png"
        plt.savefig(chart_path)
        plt.close()
        
        return chart_path
    
    def _generate_goals_chart(self, goals, timeline):
        """Generate goals progress chart"""
        goals_analysis = self._analyze_goals(goals, timeline)
        
        goal_names = [g["name"] for g in goals_analysis]
        progress_values = [g["progress_percent"] for g in goals_analysis]
        
        plt.figure(figsize=(10, 6))
        bars = plt.bar(goal_names, progress_values, color='skyblue')
        
        # Add target line at 100%
        plt.axhline(y=100, color='r', linestyle='--', alpha=0.7)
        
        # Add data labels
        for bar in bars:
            height = bar.get_height()
            plt.text(bar.get_x() + bar.get_width()/2., height + 5,
                    f'{height:.1f}%', ha='center', va='bottom')
        
        plt.title('Financial Goals Progress', fontsize=16)
        plt.xlabel('Goals', fontsize=12)
        plt.ylabel('Progress (%)', fontsize=12)
        plt.ylim(0, max(110, max(progress_values) + 10))
        plt.grid(True, alpha=0.3, axis='y')
        plt.tight_layout()
        
        # Save chart
        chart_path = self.charts_dir / "goals_progress.png"
        plt.savefig(chart_path)
        plt.close()
        
        return chart_path
    
    def generate_financial_plan(self):
        """Generate a comprehensive financial plan"""
        # Create financial roadmap
        roadmap = self.create_financial_roadmap()
        
        # Generate summary of financial plan
        financial_plan = {
            "client_profile": self.client_profile,
            "current_portfolio": self.portfolio.analyze_portfolio()["summary"],
            "retirement_analysis": roadmap["retirement_analysis"],
            "goals_analysis": roadmap["goals_analysis"],
            "recommendations": roadmap["recommendations"],
            "charts": {
                "wealth_projection": str(self.charts_dir / "wealth_projection.png"),
                "goals_progress": str(self.charts_dir / "goals_progress.png")
            }
        }
        
        # Save plan to file
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        plan_path = self.reports_dir / f"financial_plan_{timestamp}.json"
        
        with open(plan_path, 'w') as f:
            json.dump(financial_plan, f, indent=4)
        
        logger.info(f"Financial plan generated: {plan_path}")
        
        return plan_path

def main():
    """Demo function"""
    # Import components
    from portfolio_analyzer import PortfolioIntelligence
    from investment_advisor import InvestmentAdvisor
    
    # Initialize components
    portfolio = PortfolioIntelligence()
    advisor = InvestmentAdvisor(portfolio)
    
    # Initialize financial planner
    planner = FinancialPlanner(portfolio, advisor)
    
    # Generate financial plan
    portfolio.refresh_data()
    plan_path = planner.generate_financial_plan()
    
    # Print summary
    print("\n" + "="*70)
    print("           FINANCIAL PLANNING DEMO")
    print("="*70 + "\n")
    
    roadmap = planner.create_financial_roadmap()
    retirement = roadmap["retirement_analysis"]
    
    print("Retirement Analysis:")
    print(f"  Status:              {retirement['status']}")
    print(f"  Retirement Corpus:   ₹{retirement['retirement_corpus']:,.2f}")
    print(f"  Monthly Income:      ₹{retirement['sustainable_income']/12:,.2f}")
    print(f"  Replacement Ratio:   {retirement['income_replacement_ratio']:.1f}%")
    print(f"  Sustainability:      {retirement['portfolio_sustainability']}")
    
    print("\nFinancial Goals:")
    for goal in roadmap["goals_analysis"]:
        status = "On Track" if goal["projected_to_achieve"] else "Needs Attention"
        print(f"  {goal['name']} ({goal['target_year']}):")
        print(f"    Target:           ₹{goal['target_amount']:,.2f}")
        print(f"    Progress:         {goal['progress_percent']:.1f}%")
        print(f"    Status:           {status}")
        if not goal["projected_to_achieve"]:
            print(f"    Monthly Needed:    ₹{goal['required_monthly_savings']:,.2f}")
    
    print("\nKey Recommendations:")
    for rec in roadmap["recommendations"][:3]:
        print(f"  [{rec['priority'].upper()}] {rec['description']}")
        print(f"    {rec['details']}")
    
    print(f"\nDetailed financial plan saved to: {plan_path}")
    print(f"Charts saved to: {planner.charts_dir}")
    
    print("\n" + "="*70)

if __name__ == "__main__":
    main() 