# Hybrid pricing calibration report

Policy version: 2026-06-18
Observed jobs: 3
Target margin: 67.5%
Credit USD value (revenue/credit): $0.036410
Canonical credit cost (validation-post × balanced): 12

## Observed generations

| Job | Format | Mode | In tokens | Out tokens | USD cost | Debited credits | Planned price |
|-----|--------|------|-----------|------------|----------|-----------------|---------------|
| job-fixt… | validation-post | balanced | 4200 | 1800 | $0.1420 | 2.5 | 2.5 |
| job-fixt… | linkedin-post | fast | 2800 | 650 | $0.0380 | 1 | 1 |
| job-fixt… | long-form-blog | strict | 18500 | 9200 | $1.2400 | 10 | 10 |

## Cost cells (p50 used for pricing)

| Format | Mode | Samples | p50 USD | p90 USD | Source | Credit price |
|--------|------|---------|---------|---------|--------|--------------|
| twitter-thread | fast | 0 | $0.0300 | $0.0375 | theoretical | 2.6 |
| twitter-thread | balanced | 0 | $0.0900 | $0.1125 | theoretical | 7.7 |
| twitter-thread | strict | 0 | $0.3500 | $0.4375 | theoretical | 29.6 |
| linkedin-post | fast | 1 | $0.0380 | $0.0380 | observed | 3.3 |
| linkedin-post | balanced | 0 | $0.1200 | $0.1500 | theoretical | 10.2 |
| linkedin-post | strict | 0 | $0.4500 | $0.5625 | theoretical | 38.1 |
| validation-post | fast | 0 | $0.0400 | $0.0500 | theoretical | 3.4 |
| validation-post | balanced | 1 | $0.1420 | $0.1420 | observed | 12 |
| validation-post | strict | 0 | $0.5500 | $0.6875 | theoretical | 46.5 |
| newsletter | fast | 0 | $0.0450 | $0.0562 | theoretical | 3.9 |
| newsletter | balanced | 0 | $0.1700 | $0.2125 | theoretical | 14.4 |
| newsletter | strict | 0 | $0.6500 | $0.8125 | theoretical | 55 |
| long-form-blog | fast | 0 | $0.0800 | $0.1000 | theoretical | 6.8 |
| long-form-blog | balanced | 0 | $0.2800 | $0.3500 | theoretical | 23.7 |
| long-form-blog | strict | 1 | $1.2400 | $1.2400 | observed | 104.8 |
| architecture-post | fast | 0 | $0.0850 | $0.1063 | theoretical | 7.2 |
| architecture-post | balanced | 0 | $0.3000 | $0.3750 | theoretical | 25.4 |
| architecture-post | strict | 0 | $1.2000 | $1.5000 | theoretical | 101.5 |

## Quota equivalences (monthly grant ÷ canonical)

| Plan | Credits/mo | ~Quotas | Revenue USD/mo | COGS (all balanced) | Gross margin |
|------|------------|---------|----------------|---------------------|--------------|
| free | 96 | 8 | $0.00 | $1.14 | 0.0% |
| criador | 300 | 25 | $24.00 | $3.55 | 85.2% |
| pro | 720 | 60 | $59.00 | $8.52 | 85.6% |

## Reference conversions

- 1 quota ≈ 12 internal credits
- Pro balanced validation-post: 12 credits ≈ 1 quota(s)
- Pro strict long-form-blog: 104.8 credits ≈ 9 quota(s)
