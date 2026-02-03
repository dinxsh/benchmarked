### **Alchemy (RPC + Dev Stack)**

* **Free Tier:** 300M compute units/mo (~big headroom to start) ([Alchemy][1])
* **Paid:**
  • Pay-as-you-go — ~$5 for 11M CUs (~$0.45–$0.40/1M CUs) ([Alchemy][2])
  • Growth/Scale tiers with higher throughput (~$49–$199/mo & up) ([Alchemy][1])
* **Enterprise:** custom pricing & SLAs. ([Alchemy][1])

---

### **Infura**

* **Free:** ~100k requests/day (~3M/mo) ([Ankr][3])
* **Paid Tiers:**
  • Developer ~$50/mo (~~200k/day)
  • Team ~$225/mo (~1M/day)
  • Growth ~$1000+/mo (~5M+/day) ([Ankr][3])
* **Notes:** decent structure but daily caps can throttle. ([5Hz][4])

---

### **Chainstack**

* **Free:** 3M requests/mo ([Chainstack][5])
* **Paid plans:**
  • Growth ~$49/mo (20M requests)
  • Pro ~$199/mo (80M)
  • Business ~$349/mo (140M)
  • Enterprise ~$990/mo (400M+) ([Chainstack][5])
* Extra usage: ~$10–$20 per additional 1M units. ([Chainstack][5])

---

### **QuickNode**

* **Free:** 10M API credits/mo (trial/free credit) ([GetBlock.io][6])
* **Paid tiers:**
  • ~$49/mo – ~80M credits
  • ~$249/mo – ~450M
  • ~$499/mo – ~950M
  • ~$999/mo – ~2B credits ([GetBlock.io][6])

---

### **Ankr**

* **Free:** ~30M credits/mo (base freemium) ([Chainstack][7])
* **Pay-as-you-go:** ~$10 buys 100M credits (or larger prepaid bundles ~$300–$3000) ([GetBlock.io][6])
* Enterprise: custom pricing. ([GetBlock.io][6])

---

### **GetBlock**

* **Free:** ~40K requests/mo ([Alchemy][8])
* **Pay per bundle (rough):**
  • ~$6 – 500K
  • ~$10 – 1M
  • ~$30 – 5M
  • ~$50 – 10M
  • ~$200 – 50M
  • ~$500/mo – unlimited ([GetBlock.io][6])

---

## 📈 Indexing / Data API Providers (More than simple RPC)

### **The Graph (Indexed Data + Subgraphs)**

* **Free:** 100K queries/mo baseline. ([The Graph][9])
* **Usage pricing:** ~$2 per 100K queries (pay-as-you-grow). ([The Graph][9])

---

### **Bitquery**

* Offers **GraphQL data APIs for 40+ chains** with Free/Starter/Growth/Enterprise tiers — exact pricing custom via dashboard (paid plans start usually ~$249+/mo). ([Bitquery][10])

### **Covalent**

* Unified REST data APIs with **free tier (~100K–1M calls)** then paid credits (~$50+/mo and up). ([coinpaprika.com][11])

### **Subsquid (Data indexing & query engine)**

* Not simple RPC pricing; its hosted/indexed service is subscription-based (flat scale pricing rather than per-call). Exact pricing needs dashboard quote. ([CoinMarketCap][12])


| Provider   | Free Tier    | Entry Paid   | Paid Unit Cost      | Notes                                          |
| ---------- | ------------ | ------------ | ------------------- | ---------------------------------------------- |
| Alchemy    | 300M CUs     | ~$5/payg     | ~$0.40–$0.45/1M CUs | Best free, dev tools. ([Alchemy][1])           |
| Infura     | 3M req/mo    | ~$50/mo      | ~tiered             | Daily caps. ([Ankr][3])                        |
| Chainstack | 3M req/mo    | ~$49/mo      | ~$10–$20/1M extra   | Structured tiers. ([Chainstack][5])            |
| QuickNode  | 10M credits  | ~$49/mo      | per credits         | Strong throughput. ([GetBlock.io][6])          |
| Ankr       | ~30M credits | ~$10/payg    | ~$0.10/100M credits | Simple credit system. ([Chainstack][7])        |
| GetBlock   | ~40K req     | ~$6 bundle   | per bundle          | Pay-per-bundle. ([GetBlock.io][6])             |
| The Graph  | 100K queries | ~$2/100K     | ~$0.02/1K           | Data focused. ([The Graph][9])                 |
| Bitquery   | 10K trial    | ~$249+/mo    | custom              | GraphQL data API. ([Bitquery][10])             |
| Covalent   | ~100K        | ~$50+/mo     | custom              | Unified REST data. ([coinpaprika.com][11])     |
| Subsquid   | —            | subscription | flat                | Indexed & query service. ([CoinMarketCap][12]) |