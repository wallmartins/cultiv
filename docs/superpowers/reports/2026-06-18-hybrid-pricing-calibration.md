# Hybrid pricing calibration report

Policy version: 2026-06-18
Observed jobs: 14
Target margin: 67.5%
Credit USD value (revenue/credit): $0.022641
Canonical credit cost (validation-post × balanced): 12

## Observed generations

| Job | Format | Mode | In tokens | Out tokens | USD cost | Debited credits | Planned price |
|-----|--------|------|-----------|------------|----------|-----------------|---------------|
| 4ccbd781… | linkedin-post | fast | 6770 | 1096 | $0.0436 | 28 | 1 |
| 6131f9dd… | linkedin-post | strict | 20349 | 3358 | $0.1316 | 84 | 10 |
| 6680853f… | linkedin-post | strict | 18871 | 3214 | $0.1239 | 82 | 10 |
| ec1231bb… | linkedin-post | strict | 21522 | 3320 | $0.1359 | 90 | 10 |
| 6857507f… | validation-post | balanced | 9765 | 3283 | $0.0883 | 44 | 2.5 |
| ce684b7c… | architecture-post | strict | 30189 | 10265 | $0.2750 | 138 | 10 |
| 76063a42… | linkedin-post | strict | 21499 | 3322 | $0.1358 | 90 | 10 |
| 8dd45a92… | linkedin-post | strict | 21515 | 3315 | $0.1358 | 90 | 10 |
| 3fa58b06… | linkedin-post | strict | 21456 | 3279 | $0.1350 | 89 | 10 |
| 42683c47… | long-form-blog | strict | 19115 | 8936 | $0.2105 | 96 | 10 |
| 1d81dc07… | linkedin-post | strict | 21537 | 3267 | $0.1352 | 90 | 10 |
| 3afb9f91… | newsletter | strict | 20522 | 5976 | $0.1718 | 95 | 10 |
| 82493ac6… | linkedin-post | strict | 24239 | 3287 | $0.1463 | 97 | 10 |
| 0d3b5306… | linkedin-post | strict | 24204 | 3188 | $0.1446 | 96 | 10 |

## Cost cells (p50 used for pricing)

| Format | Mode | Samples | p50 USD | p90 USD | Source | Credit price |
|--------|------|---------|---------|---------|--------|--------------|
| twitter-thread | fast | 0 | $0.0300 | $0.0375 | theoretical | 4.1 |
| twitter-thread | balanced | 0 | $0.0900 | $0.1125 | theoretical | 12.3 |
| twitter-thread | strict | 0 | $0.3500 | $0.4375 | theoretical | 47.6 |
| linkedin-post | fast | 1 | $0.0436 | $0.0436 | observed | 6 |
| linkedin-post | balanced | 0 | $0.1200 | $0.1500 | theoretical | 16.4 |
| linkedin-post | strict | 9 | $0.1358 | $0.1463 | observed | 18.5 |
| validation-post | fast | 0 | $0.0400 | $0.0500 | theoretical | 5.5 |
| validation-post | balanced | 1 | $0.0883 | $0.0883 | observed | 12 |
| validation-post | strict | 0 | $0.5500 | $0.6875 | theoretical | 74.8 |
| newsletter | fast | 0 | $0.0450 | $0.0562 | theoretical | 6.2 |
| newsletter | balanced | 0 | $0.1700 | $0.2125 | theoretical | 23.2 |
| newsletter | strict | 1 | $0.1718 | $0.1718 | observed | 23.4 |
| long-form-blog | fast | 0 | $0.0800 | $0.1000 | theoretical | 10.9 |
| long-form-blog | balanced | 0 | $0.2800 | $0.3500 | theoretical | 38.1 |
| long-form-blog | strict | 1 | $0.2105 | $0.2105 | observed | 28.7 |
| architecture-post | fast | 0 | $0.0850 | $0.1063 | theoretical | 11.6 |
| architecture-post | balanced | 0 | $0.3000 | $0.3750 | theoretical | 40.8 |
| architecture-post | strict | 1 | $0.2750 | $0.2750 | observed | 37.4 |

## Quota equivalences (monthly grant ÷ canonical)

| Plan | Credits/mo | ~Quotas | Revenue USD/mo | COGS (all balanced) | Gross margin |
|------|------------|---------|----------------|---------------------|--------------|
| free | 96 | 8 | $0.00 | $0.71 | 0.0% |
| criador | 300 | 25 | $24.00 | $2.21 | 90.8% |
| pro | 720 | 60 | $59.00 | $5.30 | 91.0% |

## Reference conversions

- 1 quota ≈ 12 internal credits
- Pro balanced validation-post: 12 credits ≈ 1 quota(s)
- Pro strict long-form-blog: 28.7 credits ≈ 3 quota(s)
