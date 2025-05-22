# Portfolio Intelligence

```
 _____         _    __      _ _         _____       _       _ _ _                       
|  __ \       | |  / _|    | (_)       |_   _|     | |     | | (_)                      
| |__) |__  __| |_| |_ ___ | |_  ___     | |  _ __ | |_ ___| | |_  __ _  ___ _ __   ___ ___ 
|  ___/ _ \/ _` __|  _/ _ \| | |/ _ \    | | | '_ \| __/ _ \ | | |/ _` |/ _ \ '_ \ / __/ _ \
| |  | (_) | (_| |_| || (_) | | | (_) |  _| |_| | | | ||  __/ | | | (_| |  __/ | | | (_|  __/
|_|   \___/ \__,_(_)_| \___/|_|_|\___/  |_____|_| |_|\__\___|_|_|_|\__, |\___|_| |_|\___\___|
                                                                   __/ |                  
    ____________________                                          |___/                   
   /                    \                      /\                                          
  /    $    MARKET    $  \                    /  \      AI-POWERED PORTFOLIO ANALYSIS      
 /        INSIGHTS       \                  /    \     RISK MANAGEMENT & OPTIMIZATION      
|       __________        |                /      \                                        
|      |\_|_|_|_|_\       |               /        \                                       
|      |  -    -  |       |              /          \                                      
|      |     >    |       |             /__________  \                                     
|      |    ___   |       |            |  __      /   |                                    
|      |_________|       |             | /  \    /    |        [ netsec.gg / 20XX ]        
|                        |             | \__/   /     |                                    
|    CLAUDE × CURSOR     |              \______/      |                                    
 \        v1.0.0        /               |      |      |                                    
  \                    /                |      |      |                                    
   \__________________/                 |______|______|                                    
```

An open-source portfolio analysis and optimization system powered by Claude AI and Cursor.

![Portfolio Intelligence](https://netsec.gg/assets/img/portfolio-intelligence-banner.png)

## Overview

Portfolio Intelligence combines market data from Zerodha's Kite API with advanced AI analysis from Claude to provide deep insights into your investment portfolio. The system helps you make data-driven decisions by:

- Analyzing your current holdings and positions
- Monitoring market movements and relevant news
- Generating actionable insights and optimization recommendations
- Providing alerts for significant portfolio events

## Features

### 1. Portfolio Analysis
- Comprehensive portfolio valuation and P&L tracking
- Sector-wise allocation analysis
- Performance metrics (returns, Sharpe ratio, volatility)
- Risk assessment and diversification measurement

### 2. Market Monitoring
- Real-time tracking of key market indices
- Monitoring of stocks in your portfolio
- News aggregation and sentiment analysis
- Correlation with your portfolio holdings

### 3. AI-Powered Insights
- Advanced portfolio optimization recommendations
- Actionable trade suggestions based on market conditions
- Risk management advice
- Long-term strategy alignment

### 4. Reporting and Visualization
- Detailed portfolio reports
- Performance visualization
- Sector allocation charts
- Historical trend analysis

## Getting Started

### Prerequisites
- Python 3.8 or higher
- Zerodha Kite account
- Cursor IDE with Claude AI access (for full AI integration)

### Installation

1. Clone the repository:
```
git clone https://github.com/netsec-gg/portfolio-intelligence.git
cd portfolio-intelligence
```

2. Install dependencies:
```
pip install -r requirements.txt
```

3. Set up your environment variables:
```
export KITE_API_KEY="your_api_key"
export KITE_API_SECRET="your_api_secret"
```

### Usage

#### Basic Portfolio Analysis
```
python main.py --analyze
```

#### Generate AI Insights Report
```
python main.py --report
```

#### Monitor Market with Alerts
```
python main.py --monitor --time 60
```

#### Get Insights for a Specific Stock
```
python main.py --stock INFY
```

#### Combining Operations
```
python main.py --refresh --analyze --report
```

## Architecture

The system consists of four main components:

1. **Portfolio Analyzer**: Connects to Kite API, fetches holdings/positions, and performs quantitative analysis.
2. **Market Monitor**: Tracks market movements, indices, and news relevant to your portfolio.
3. **Claude Insights**: Integrates with Claude AI to generate advanced insights and recommendations.
4. **Configuration**: Manages settings, sector mappings, and user preferences.

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Zerodha Kite API](https://kite.trade/) for market data
- [Claude AI](https://claude.ai/) for advanced portfolio insights
- [Cursor](https://cursor.sh/) for AI-powered development

## Disclaimer

This software is for educational and informational purposes only. It does not constitute financial advice. Always conduct your own research before making investment decisions. 