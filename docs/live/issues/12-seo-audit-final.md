# Issue 12 — SEO, Structured Data & Final Audit

## What to build

Update SEO metadata, structured data, and run final quality audits across the entire rebranded surface. This is the final integration issue that verifies everything works together.

### SEO Metadata Updates

#### Title & Description
Update the root HTML `<head>` in the app entry:
- **Title:** `Cultiv — Texts that sound like you.` (en) / `Cultiv — Textos que soam como você.` (pt-BR)
- **Description:** Match the new SEO copy from Issues 03/04

#### OG Image
- Replace `public/cultiv-og-imprint.svg` with the new branded OG image (from Issue 01)
- Update `public/og.png` as raster fallback
- Ensure OG image displays correctly when sharing on Twitter, LinkedIn, WhatsApp

#### Meta Tags
Verify in `apps/web/src/marketing/components/JsonLd.tsx`:
- `name` matches new brand name
- `description` matches new SEO description
- `url` is correct
- `image` points to new OG image

### Structured Data

#### JsonLd.tsx
Update Organization schema:
```json
{
  "@type": "Organization",
  "name": "Cultiv",
  "url": "https://cultiv.app",
  "logo": "https://cultiv.app/cultiv-press-mark.svg",
  "description": "Cultiv learns how you write and generates text with your voice."
}
```

#### GeoStructuredData.tsx
Verify geo metadata is correct for the product's target market (Brazil).

#### LegalStructuredData.tsx
Verify legal page structured data references the correct URLs.

### Sitemap & Robots

#### sitemap.xml (`routes/sitemap[.]xml.ts`)
- Verify all marketing routes are included
- Verify canonical URLs are correct
- Add lastmod dates if not already present

#### robots.txt (`routes/robots[.]txt.ts`)
- Verify crawl rules are correct
- Ensure marketing pages are crawlable
- Ensure `/app/*` routes are disallowed

#### llms.txt (`routes/llms[.]txt.ts`)
- Update product description to match new brand voice
- Ensure the file is concise and accurate

#### llms-full.txt (`routes/llms-full[.]txt.ts`)
- Update full documentation to match new brand voice and product description

### hreflang

Verify hreflang tags are correct in the app entry:
- `<link rel="alternate" hreflang="pt-BR" href="https://cultiv.app/" />`
- `<link rel="alternate" hreflang="en" href="https://cultiv.app/en/" />`
- `<link rel="alternate" hreflang="x-default" href="https://cultiv.app/" />`

### Accessibility Audit

Run a full WCAG 2.1 AA audit:

- [ ] All interactive elements have visible focus indicators
- [ ] All images have appropriate alt text
- [ ] Color contrast ratios meet AA standards (4.5:1 for text, 3:1 for large text)
- [ ] All form fields have associated labels
- [ ] Navigation is keyboard-accessible
- [ ] Screen reader testing with VoiceOver/NVDA
- [ ] `prefers-reduced-motion` is respected everywhere
- [ ] Skip navigation link is present
- [ ] ARIA landmarks are correct

### Performance Audit

Run Lighthouse and Core Web Vitals:

- [ ] Performance score >= 90
- [ ] First Contentful Paint < 1.5s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Cumulative Layout Shift < 0.1
- [ ] Total Blocking Time < 300ms
- [ ] No unused JavaScript or CSS
- [ ] Images are optimized (WebP/AVIF where appropriate)
- [ ] Fonts are preloaded correctly

### Cross-Browser Testing

- [ ] Chrome (latest) — Windows, macOS, Android
- [ ] Firefox (latest) — Windows, macOS
- [ ] Safari (latest) — macOS, iOS
- [ ] Edge (latest) — Windows
- [ ] Samsung Internet (latest) — Android

### Responsive Testing

Test at these breakpoints:
- [ ] 320px (small mobile)
- [ ] 375px (iPhone SE)
- [ ] 390px (iPhone 14)
- [ ] 768px (iPad)
- [ ] 1024px (iPad Pro / small desktop)
- [ ] 1280px (desktop)
- [ ] 1536px (large desktop)
- [ ] 1920px (full HD)
- [ ] 2560px (4K)

### i18n Audit

- [ ] Locale switching works correctly (pt-BR ↔ en)
- [ ] All copy is present in both locales (no missing keys)
- [ ] No translation artifacts in English copy
- [ ] hreflang tags are correct
- [ ] `<html lang>` attribute updates on locale switch
- [ ] SEO metadata updates on locale switch

### Dark Mode Audit

- [ ] All surfaces use correct dark mode tokens
- [ ] Text contrast ratios meet AA in dark mode
- [ ] Pigment colors are adjusted for dark mode (lighter variants)
- [ ] No white backgrounds bleeding through in dark mode
- [ ] Grain overlay opacity is reduced in dark mode
- [ ] Images/SVGs look correct on dark backgrounds

### Final Checklist

- [ ] No console errors or warnings
- [ ] No TypeScript errors
- [ ] All tests pass (`pnpm test`)
- [ ] Lint passes (`pnpm lint`)
- [ ] Build succeeds (`pnpm build`)
- [ ] Marketing surface deploys to Vercel successfully
- [ ] OG image displays correctly on social media
- [ ] Favicon displays correctly in all browsers
- [ ] Brand name "Cultiv" appears consistently everywhere
- [ ] All copy uses the new brand voice

## Blocked by

- **Issue 03** — pt-BR marketing copy must be finalized for SEO metadata
- **Issue 04** — en marketing copy must be finalized for SEO metadata
- **Issue 05** — Marketing surface components must be updated
- **Issue 10** — Workspace shell must be updated
- **Issue 11** — Workspace screens must be updated
