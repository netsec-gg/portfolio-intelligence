# 🚀 Push Code to GitHub Instructions

## Current Status
✅ Code is committed locally  
⚠️ GitHub push protection is blocking due to detected OpenAI API keys

## To Push (Choose One Method)

### Method 1: Allow Secret via Web (Recommended)
1. **Visit this URL** to allow the OpenAI API key:
   ```
   https://github.com/netsec-gg/portfolio-intelligence/security/secret-scanning/unblock-secret/35Gt26w1rMIlzCH5n92Fv6XbQyw
   ```

2. **Click "Allow secret"** on the GitHub page

3. **Run the push command**:
   ```bash
   git push origin main
   ```

### Method 2: Use the Push Script
```bash
./push-to-github.sh
```

## After Pushing Successfully

### On Your Other Computer:
```bash
# Clone the repository
git clone git@github.com:netsec-gg/portfolio-intelligence.git

# Navigate to backend
cd portfolio-intelligence/backend

# Install dependencies
npm install

# Start the server
npm run dev
```

## What's Included in the Push
✅ All code changes  
✅ Hardcoded API keys (OpenAI, Kite API)  
✅ Real-time update frequencies (300ms-500ms)  
✅ Portfolio intelligence branding  
✅ All improvements and fixes  

## Repository
- **URL**: `git@github.com:netsec-gg/portfolio-intelligence.git`
- **Branch**: `main`

