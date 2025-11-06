# Required API Keys and Services for Portify

## 🎯 Current Status

Your app is currently using **FREE** APIs which have limitations:
- ❌ **News**: RSS feeds (unreliable, often blocked)
- ❌ **FII/DII**: NSE scraping (blocked, showing placeholder data)
- ❌ **Dividends**: NSE Corporate Actions (not working, showing sample data)

## ✅ What You Need to Get

### 1. **News API** - REQUIRED

**Option A: NewsAPI.org (Recommended for Quick Start)**
- **Website**: https://newsapi.org/
- **Free Tier**: 100 requests/day
- **Paid Tier**: $449/month for 250,000 requests
- **Sign Up**: https://newsapi.org/register
- **Get API Key**: After signup, go to Dashboard → API Keys
- **Add to `.env`**: `NEWS_API_KEY=your_key_here`

**Option B: Alpha Vantage News API (Better for Stock News)**
- **Website**: https://www.alphavantage.co/
- **Free Tier**: 5 calls/minute, 500/day
- **Paid Tier**: $49.99/month for 1,200 calls/day
- **Sign Up**: https://www.alphavantage.co/support/#api-key
- **Get API Key**: Free signup, instant key
- **Add to `.env`**: `ALPHA_VANTAGE_API_KEY=your_key_here`

**Option C: Financial Modeling Prep (Best for Indian Market)**
- **Website**: https://site.financialmodelingprep.com/
- **Free Tier**: 250 calls/day
- **Paid Tier**: $14/month for 750 calls/day
- **Sign Up**: https://site.financialmodelingprep.com/developer/docs/
- **Get API Key**: Free signup
- **Add to `.env`**: `FMP_API_KEY=your_key_here`

---

### 2. **FII/DII Data** - REQUIRED

**Option A: Moneycontrol Pro API (Best Option)**
- **Website**: https://www.moneycontrol.com/
- **Contact**: pro@moneycontrol.com or https://www.moneycontrol.com/contact-us
- **Price**: ₹5,000-50,000/month (contact for exact pricing)
- **Features**: FII/DII, Bulk Deals, Corporate Actions, Real-time Data
- **Add to `.env`**: `MONEYCONTROL_API_KEY=your_key_here`

**Option B: TrueData API (Good Alternative)**
- **Website**: https://www.truedata.in/
- **Contact**: sales@truedata.in or https://www.truedata.in/contact
- **Price**: ₹5,000-10,000/month
- **Features**: FII/DII, Real-time NSE/BSE data
- **Add to `.env`**: `TRUEDATA_API_KEY=your_key_here`

**Option C: Dartstock Analytics (FII/DII Specialized)**
- **Website**: https://www.dartstock.com/
- **Contact**: Contact form on website
- **Price**: Contact for pricing
- **Features**: Daily FII/DII activity (equity & debt)
- **Add to `.env`**: `DARTSTOCK_API_KEY=your_key_here`

**Option D: Free Alternative - NSE India (Unreliable)**
- Currently trying to scrape NSE website (blocked)
- Would need better scraping with proxies/rotating IPs
- Not recommended for production

---

### 3. **Dividend Data** - REQUIRED

**Option A: Moneycontrol Pro API (Best - Includes Dividends)**
- Same as FII/DII option above
- Includes corporate actions, dividends, splits, bonuses
- **Add to `.env`**: `MONEYCONTROL_API_KEY=your_key_here`

**Option B: Global Datafeeds Fundamental Data API**
- **Website**: https://globaldatafeeds.in/
- **Contact**: Contact form on website
- **Price**: Contact for pricing
- **Features**: Corporate actions, dividends, financial statements
- **Add to `.env`**: `GLOBALDATAFEEDS_API_KEY=your_key_here`

**Option C: Alpha Vantage (Has Dividend Data)**
- **Website**: https://www.alphavantage.co/
- **Free Tier**: 5 calls/minute
- **Paid Tier**: $49.99/month
- **API Endpoint**: `https://www.alphavantage.co/query?function=DIVIDEND&symbol=INFY&apikey=YOUR_KEY`
- **Add to `.env`**: `ALPHA_VANTAGE_API_KEY=your_key_here`

**Option D: Yahoo Finance API (Free but Unreliable)**
- Can scrape Yahoo Finance dividend pages
- Not recommended for production
- Would need to implement scraping

---

## 🚀 Recommended Setup (Minimum Cost)

### **Budget Option (~$50-100/month)**

1. **News**: NewsAPI.org Free Tier (100 requests/day) OR Alpha Vantage Free (500/day)
   - Cost: **$0** (free tier)
   - If you need more: Alpha Vantage Paid ($49.99/month)

2. **FII/DII**: TrueData API
   - Cost: **₹5,000-10,000/month** (~$60-120/month)
   - Most reliable for Indian market

3. **Dividends**: Alpha Vantage API (includes dividend data)
   - Cost: **$49.99/month** (if using paid tier)
   - OR use Moneycontrol Pro which includes everything

**Total**: ~$110-170/month

---

### **Best Value Option (~$100-200/month)**

**Moneycontrol Pro API** - All-in-One Solution
- Includes: News, FII/DII, Dividends, Corporate Actions, Real-time Data
- Cost: **₹5,000-20,000/month** (~$60-240/month)
- **Contact**: pro@moneycontrol.com
- **Why**: One API for everything, most reliable for Indian market

---

## 📝 How to Add API Keys

1. **Create `.env.local` file** in `/Users/dmeg/portify/backend/`:

```bash
# News API
NEWS_API_KEY=your_newsapi_key_here
# OR
ALPHA_VANTAGE_API_KEY=your_alphavantage_key_here

# FII/DII API
MONEYCONTROL_API_KEY=your_moneycontrol_key_here
# OR
TRUEDATA_API_KEY=your_truedata_key_here

# Dividend API (if different from above)
GLOBALDATAFEEDS_API_KEY=your_globaldatafeeds_key_here
```

2. **Restart your dev server**:
```bash
npm run dev
```

---

## 🔧 Quick Start (Free Tier)

**For immediate testing with FREE APIs:**

1. **NewsAPI.org** (Free - 100 requests/day):
   - Sign up: https://newsapi.org/register
   - Get key instantly
   - Add to `.env.local`: `NEWS_API_KEY=your_key`

2. **Alpha Vantage** (Free - 500 requests/day):
   - Sign up: https://www.alphavantage.co/support/#api-key
   - Get key instantly
   - Add to `.env.local`: `ALPHA_VANTAGE_API_KEY=your_key`
   - Can use for both news AND dividends

3. **FII/DII** - No good free option, you'll need to:
   - Contact Moneycontrol Pro or TrueData
   - OR use placeholder data until you get API access

---

## 📞 Contact Information

**Moneycontrol Pro**:
- Email: pro@moneycontrol.com
- Website: https://www.moneycontrol.com/contact-us
- Ask for: API access for FII/DII, Dividends, Corporate Actions

**TrueData**:
- Email: sales@truedata.in
- Website: https://www.truedata.in/contact
- Ask for: Market data API with FII/DII

**Global Datafeeds**:
- Website: https://globaldatafeeds.in/
- Contact form on website
- Ask for: Fundamental data API with dividends

---

## ⚠️ Current Limitations

Without paid APIs:
- ✅ **News**: Will work with NewsAPI.org free tier (limited to 100/day)
- ❌ **FII/DII**: Currently showing placeholder data (₹5,000 Cr buy, ₹4,800 Cr sell)
- ❌ **Dividends**: Currently showing sample data (not real)

**To fix everything**: Get Moneycontrol Pro API (one API for all three)

