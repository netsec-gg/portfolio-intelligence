# Exact API Keys You Need - Quick Start Guide

## 🎯 What You Need (In Order of Priority)

### 1. **NEWS API** - Get This First (FREE Options Available)

**Option 1: NewsAPI.org (Easiest - FREE)**
1. Go to: https://newsapi.org/register
2. Sign up (free)
3. Go to Dashboard → API Keys
4. Copy your API key
5. Add to `.env.local` file:
   ```
   NEWS_API_KEY=your_key_here
   ```
6. **Free limit**: 100 requests/day (enough for testing)

**Option 2: Alpha Vantage (Better for Stock News - FREE)**
1. Go to: https://www.alphavantage.co/support/#api-key
2. Enter email, get instant API key
3. Add to `.env.local`:
   ```
   ALPHA_VANTAGE_API_KEY=your_key_here
   ```
4. **Free limit**: 500 requests/day

**Which to choose?**
- **NewsAPI.org**: Easier, instant, but limited to 100/day
- **Alpha Vantage**: More requests, better for stocks, also FREE

---

### 2. **FII/DII DATA** - Requires Paid Subscription (EMAIL REQUIRED - NO DASHBOARD)

**⚠️ IMPORTANT**: Moneycontrol Pro does NOT have a dashboard. You MUST email them.

**Best Option: Moneycontrol Pro API**
1. **Email**: pro@moneycontrol.com OR feedback@moneycontrol.com
2. **Phone**: 022-66067000 (Mon-Fri, 10:30 AM - 5 PM)
3. **Subject**: "API Access Request for FII/DII Data"
4. **Ask for**: "API access for FII/DII data, bulk deals, and market intelligence"
5. **Response time**: Usually 1-3 business days
6. **Pricing**: Usually ₹5,000-20,000/month
7. Once you get API key, add to `.env.local`:
   ```
   MONEYCONTROL_API_KEY=your_key_here
   ```

**Alternative: TrueData**
1. **Email**: sales@truedata.in
2. **Website**: https://www.truedata.in/contact (may have contact form)
3. **Ask for**: "Market data API with FII/DII data"
4. **Pricing**: ₹5,000-10,000/month
5. Add to `.env.local`:
   ```
   TRUEDATA_API_KEY=your_key_here
   ```

**Why no dashboard?**
- FII/DII data is proprietary Indian market data
- Requires business verification
- Enterprise/B2B service model
- All providers require email contact

**Until you get paid API:**
- App will show placeholder data (₹5,000 Cr buy, ₹4,800 Cr sell)
- This is intentional fallback until you get real API

---

### 3. **DIVIDEND DATA** - Requires Paid Subscription

**Best Option: Moneycontrol Pro API (Same as FII/DII)**
- If you get Moneycontrol Pro API, it includes dividends
- No separate API needed

**Alternative: Global Datafeeds**
1. Website: https://globaldatafeeds.in/
2. Fill contact form
3. Ask for: "Fundamental data API with dividend and corporate actions"
4. Add to `.env.local`:
   ```
   GLOBALDATAFEEDS_API_KEY=your_key_here
   ```

**Alternative: Alpha Vantage (Has Dividend Data)**
- If you got Alpha Vantage key above, it also has dividend data
- API endpoint: `https://www.alphavantage.co/query?function=DIVIDEND&symbol=INFY&apikey=YOUR_KEY`
- No additional key needed if you already have Alpha Vantage

**Until you get paid API:**
- App will show sample dividend data
- This is intentional fallback

---

## 📝 Step-by-Step Setup

### Step 1: Create `.env.local` file

Create file: `/Users/dmeg/portify/backend/.env.local`

```bash
# News API (Choose ONE)
NEWS_API_KEY=your_newsapi_key_here
# OR
ALPHA_VANTAGE_API_KEY=your_alphavantage_key_here

# FII/DII API (Required for real data)
MONEYCONTROL_API_KEY=your_moneycontrol_key_here
# OR
TRUEDATA_API_KEY=your_truedata_key_here

# Dividend API (If different from above)
GLOBALDATAFEEDS_API_KEY=your_globaldatafeeds_key_here
```

### Step 2: Get FREE News API Key (Do This Now)

1. **NewsAPI.org** (Recommended for quick start):
   - Visit: https://newsapi.org/register
   - Sign up with email
   - Go to Dashboard
   - Copy API key
   - Add to `.env.local`: `NEWS_API_KEY=paste_key_here`

2. **OR Alpha Vantage** (Better for stocks):
   - Visit: https://www.alphavantage.co/support/#api-key
   - Enter email
   - Get instant key
   - Add to `.env.local`: `ALPHA_VANTAGE_API_KEY=paste_key_here`

### Step 3: Contact for FII/DII API (Paid)

**Email Moneycontrol Pro:**
```
To: pro@moneycontrol.com
Subject: API Access Request for FII/DII Data

Hi,

I'm building a personal portfolio management tool and need API access for:
- FII/DII daily data
- Bulk deals
- Market intelligence

Please provide pricing and API documentation.

Thanks!
```

**OR Email TrueData:**
```
To: sales@truedata.in
Subject: Market Data API Inquiry

Hi,

I need API access for FII/DII data for my portfolio app.
Please provide pricing and API details.

Thanks!
```

### Step 4: Restart Server

```bash
cd /Users/dmeg/portify/backend
npm run dev
```

---

## 💰 Cost Summary

### **Minimum Setup (FREE)**
- News: NewsAPI.org Free (100/day) or Alpha Vantage Free (500/day)
- FII/DII: Placeholder data (until you get paid API)
- Dividends: Sample data (until you get paid API)
- **Cost: $0/month**

### **Full Setup (Paid)**
- News: Included in Moneycontrol Pro
- FII/DII: Moneycontrol Pro API
- Dividends: Moneycontrol Pro API
- **Cost: ₹5,000-20,000/month (~$60-240/month)**

### **Budget Setup**
- News: Alpha Vantage Free ($0)
- FII/DII: TrueData (₹5,000/month ~$60)
- Dividends: Alpha Vantage (included in free tier)
- **Cost: ~$60/month**

---

## 🚀 Quick Start (5 Minutes)

1. **Get NewsAPI.org key** (FREE):
   - https://newsapi.org/register
   - Copy key → Add to `.env.local`

2. **Restart server**:
   ```bash
   npm run dev
   ```

3. **News should work immediately**

4. **For FII/DII and Dividends**:
   - Email Moneycontrol Pro (pro@moneycontrol.com)
   - Wait for response with API key
   - Add to `.env.local`
   - Restart server

---

## 📧 Email Templates

### For Moneycontrol Pro:
```
Subject: API Access Request for Portfolio Management Tool

Hi Moneycontrol Team,

I'm building a personal portfolio management application and need API access for:
- FII/DII daily trading data
- Bulk deals information
- Corporate actions (dividends, splits, bonuses)
- Market news

Please provide:
1. API documentation
2. Pricing information
3. How to get started

Thank you!
[Your Name]
```

### For TrueData:
```
Subject: Market Data API Inquiry - FII/DII Data

Hi TrueData Team,

I need API access for FII/DII data for my portfolio management application.
Please provide pricing and API access details.

Thank you!
[Your Name]
```

---

## ✅ What Works Right Now

- ✅ **News**: Will work with NewsAPI.org free key (get it now!)
- ⚠️ **FII/DII**: Shows placeholder until you get paid API
- ⚠️ **Dividends**: Shows sample data until you get paid API

**Get NewsAPI.org key NOW** → News will work immediately!
**Contact Moneycontrol Pro** → FII/DII and Dividends will work once you get API key!

