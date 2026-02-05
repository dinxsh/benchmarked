# Token Price API Keys - Quick Reference

## 🔑 API Keys Status

### ✅ Already Configured (Working)
```bash
MORALIS_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  ✅
BITQUERY_API_KEY=ory_at_Tfhb6dTuhei1EDk6ntdv5R8RT3iseNKk69o90OLAp_o...  ✅
ALCHEMY_API_KEY=TGpsWM-QXyu8fm0t5fjLv  ✅
```

### ❌ Missing (Need to Add)
```bash
GOLDRUSH_API_KEY=  ❌ REQUIRED - Get from https://goldrush.dev/
COINGECKO_API_KEY=  ⚠️ OPTIONAL - Get from https://www.coingecko.com/en/api
```

### ⚠️ Optional Enhancement
```bash
ANKR_API_KEY=  (Not needed - no price API)
```

---

## 📝 How to Get API Keys

### 1. GoldRush (REQUIRED) 🏆
**Priority**: HIGH - Currently causing errors

1. Visit: https://goldrush.dev/
2. Click "Sign Up" or "Get API Key"
3. Create free account
4. Copy API key (format: `cqt_xxxxxxxxxxxxx`)
5. Add to `.env.local`:
   ```bash
   GOLDRUSH_API_KEY=cqt_your_key_here
   ```

**Free Tier**: 
- 100,000 credits/month
- 50 requests/second
- All pricing endpoints included

---

### 2. CoinGecko (OPTIONAL) 🦎
**Priority**: MEDIUM - Works without key but limited

1. Visit: https://www.coingecko.com/en/api
2. Click "Get Your Free API Key"
3. Sign up for free account
4. Copy API key from dashboard
5. Add to `.env.local`:
   ```bash
   COINGECKO_API_KEY=CG-your_key_here
   ```

**Free Tier**:
- 10,000 calls/month
- 10-50 calls/minute
- Demo mode available (limited)

---

### 3. Alchemy (OPTIONAL) ⚡
**Priority**: LOW - Already have endpoint key

**Current Status**: You already have an API key extracted from your endpoint!
```bash
ALCHEMY_API_KEY=TGpsWM-QXyu8fm0t5fjLv  ✅
```

If you need a new one:
1. Visit: https://dashboard.alchemy.com/
2. Select your app
3. View API key
4. Update `.env.local` if needed

**Free Tier**:
- 300M compute units/month
- Prices API included
- Multiple networks

---

## 🚀 Quick Setup (Copy & Paste)

### Step 1: Get GoldRush Key
```bash
# 1. Visit https://goldrush.dev/
# 2. Sign up and get API key
# 3. Copy the key (starts with cqt_)
```

### Step 2: Update .env.local
Open `.env.local` and replace this line:
```bash
# BEFORE (line 26)
GOLDRUSH_API_KEY=cqt_rQbxkC37Gy7Vt7yTt7hdPX3GTpgT

# AFTER
GOLDRUSH_API_KEY=cqt_YOUR_NEW_KEY_HERE
```

### Step 3: Restart Server
```bash
# Press Ctrl+C to stop
npm run dev
```

### Step 4: Test
1. Go to: http://localhost:3001/dashboard/token-price
2. Enter: `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`
3. Click: "BENCHMARK ALL PROVIDERS"
4. GoldRush should now show ✅ Success!

---

## 📊 Expected Results After Setup

| Provider | Status | Needs Key | Action |
|----------|--------|-----------|--------|
| CoinGecko | ✅ Working | Optional | None |
| Moralis | ✅ Working | ✅ Has key | None |
| **GoldRush** | **❌ Error** | **✅ Need key** | **Add key!** |
| Bitquery | ✅ Working | ✅ Has key | None |
| Alchemy | ✅ Ready | ✅ Has key | None |
| QuickNode | ⚠️ N/A | Needs add-on | Optional |
| Ankr | ⚠️ N/A | N/A | Expected |
| Infura | ⚠️ N/A | N/A | Expected |
| Chainstack | ⚠️ N/A | N/A | Expected |
| Subsquid | ⚠️ N/A | N/A | Expected |

---

## 🎯 Success Checklist

- [ ] Get GoldRush API key from https://goldrush.dev/
- [ ] Replace `GOLDRUSH_API_KEY` in `.env.local`
- [ ] Restart dev server (`npm run dev`)
- [ ] Test at `/dashboard/token-price`
- [ ] Verify GoldRush shows ✅ Success
- [ ] (Optional) Get CoinGecko API key for better rate limits
- [ ] (Optional) Enable QuickNode Odos add-on

---

## 💡 Pro Tips

1. **GoldRush is the priority** - It's currently showing errors
2. **CoinGecko works without key** - But limited to 10-50 calls/min
3. **Alchemy key already set** - Should work once you test
4. **4 providers will always be N/A** - Ankr, Infura, Chainstack, Subsquid don't have price APIs
5. **Target: 4-6 working providers** - That's 40-60% success rate!

---

## 🆘 Need Help?

### GoldRush 401 Error
- **Cause**: Invalid/missing API key
- **Fix**: Get new key from https://goldrush.dev/

### CoinGecko Rate Limited
- **Cause**: Too many requests
- **Fix**: Get API key or wait 1 minute

### Alchemy 403 Error
- **Cause**: API key doesn't have Prices API access
- **Fix**: Check your Alchemy plan

### QuickNode "Method not found"
- **Cause**: Odos add-on not enabled
- **Fix**: Enable in QuickNode marketplace

---

## 📞 Support Links

- GoldRush: https://docs.goldrush.dev/
- CoinGecko: https://support.coingecko.com/
- Alchemy: https://docs.alchemy.com/
- Moralis: https://docs.moralis.io/
- Bitquery: https://docs.bitquery.io/

---

**Last Updated**: 2026-02-05  
**Version**: 1.0
