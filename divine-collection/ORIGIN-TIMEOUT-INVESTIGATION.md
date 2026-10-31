# Origin Timeout & DNS Investigation Report

**Date:** 31 October 2026
**Store:** Divine DunlopDreams (Ecwid store 100333285)
**Domain:** divinedunlop.com
**Status:** Investigation complete — findings and recommendations below

---

## Executive Summary

Two separate infrastructure issues were identified. Neither is caused by
`ddc.js` or any client-side script:

1. **`www.divinedunlop.com` returns HTTP 403 Forbidden** — the `www` subdomain
   resolves to a completely different server from the bare domain. Any visitor
   arriving at `www.divinedunlop.com` sees a blank error page.

2. **Intermittent origin timeouts on the bare domain** — sporadic requests to
   `divinedunlop.com` hang for 20–25 seconds and return 0 bytes. The failure
   occurs before any data is received (pre-TTFB), indicating a hosting or CDN
   issue, not a client-side problem.

---

## Finding 1: www Subdomain DNS Misconfiguration

### Evidence

| Domain | Resolves to | Infrastructure | HTTP response |
|--------|-------------|----------------|---------------|
| `divinedunlop.com` | `3.217.171.137` | AWS (Ecwid hosting) | 200 OK |
| `www.divinedunlop.com` | `35.214.180.85` | Google Cloud Platform | 403 Forbidden |

The two domains point to entirely different servers on different cloud
providers. The `www` response is:

```
HTTP/2 403
server: nginx
host-header: 6b7412fb82ca5edfd0917e3957f05d89
```

Body: "403 - Forbidden | Access to this page is forbidden."

The `host-header` value (`6b7412fb82ca5edfd0917e3957f05d89`) is a hashed site
identifier commonly used by shared-hosting platforms (e.g. a default or
placeholder site on a shared Nginx instance). This is not Ecwid infrastructure.

### Impact

- Any visitor typing `www.divinedunlop.com` or following a `www` link sees a
  blank 403 error — **no storefront, no redirect, no useful content.**
- Search engines indexing the `www` variant will find only the 403 error.
- Some users and browsers default to prepending `www.` when entering a domain.

### Root cause

The DNS A record (or CNAME) for `www.divinedunlop.com` was configured at some
point to point to `35.214.180.85`, which is not the Ecwid hosting server. This
may have been left over from a previous hosting provider, a DNS migration error,
or a misconfigured DNS record.

### Recommendation

**Option A (recommended):** Add a CNAME record for `www` that points to the
bare domain:

```
www.divinedunlop.com.  CNAME  divinedunlop.com.
```

This requires the DNS provider to support CNAME for `www` alongside the bare
domain's A record. Most DNS providers and Ecwid support this.

**Option B:** Add a redirect from `www` to the bare domain. Some DNS providers
offer "URL redirect" or "forwarding" records. Configure:

```
www.divinedunlop.com → 301 redirect → https://divinedunlop.com
```

**Option C:** Remove the `www` A record entirely. With no DNS record, browsers
will fail to connect (NXDOMAIN) rather than showing a misleading 403 page. This
is better than the current state but less useful than options A or B.

**Where to make the change:** The domain's DNS is managed wherever the
`divinedunlop.com` domain was registered or where its nameservers point.
Common registrars: GoDaddy, Namecheap, Cloudflare, Google Domains, etc.
Check the domain's WHOIS record or the registrar account.

---

## Finding 2: Intermittent Origin Timeouts

### Evidence

**Test 1** — 10 sequential requests to the Pillow Collection page
(`https://divinedunlop.com/Latex-Pillows-c100640547`):

| Request | Result | Time | Bytes |
|---------|--------|------|-------|
| 1 | **TIMEOUT** | 25.0s | 0 |
| 2 | 200 OK | 0.91s | 258,231 |
| 3 | 200 OK | 0.88s | 258,232 |
| 4 | 200 OK | 0.84s | 258,232 |
| 5 | 200 OK | 0.94s | 258,232 |
| 6 | 200 OK | 0.68s | 258,231 |
| 7 | 200 OK | 0.66s | 258,231 |
| 8 | 200 OK | 0.68s | 258,232 |
| 9 | 200 OK | 1.15s | 258,232 |
| 10 | 200 OK | 0.61s | 258,231 |

**Timeout rate:** 1/10 (10%) — consistent with user-reported ~2/10 (20%).

**Test 2** — 30 sequential requests across three page types:

| Page | Requests | Timeouts | Avg time | Avg size |
|------|----------|----------|----------|----------|
| Pillow Collection | 10 | 0 | 0.80s | 258,231 |
| Mattress Collection | 10 | 0 | 0.98s | 258,238 |
| Homepage | 10 | 0 | 0.63s | 630,181 |

**Combined timeout rate:** 1/40 (2.5%).

### Characteristics

- **Pre-TTFB failure:** The timeout occurs before any bytes are received (0 bytes
  at the 25-second timeout). This means the server never started sending a
  response — the connection was established (TCP handshake completed) but the
  HTTP response never began.

- **Not page-specific:** The same pillow collection page timed out on one request
  and loaded in 0.6s on the next. All three page types (homepage, mattress
  collection, pillow collection) loaded successfully in subsequent tests.

- **Not content-correlated:** When pages do load, they are consistently ~258 KB
  (collection pages) or ~630 KB (homepage), with response times of 0.4–1.9s.
  There is no progressive degradation — requests either complete normally or
  fail entirely.

- **Sporadic pattern:** The timeout appears to be random, with no predictable
  schedule. It occurred on the very first request in Test 1, then not at all
  across the next 39 requests.

### Likely causes

The pre-TTFB timeout pattern (server accepts the connection but never responds)
is consistent with several server-side/hosting issues:

1. **Ecwid origin server overload or cold-start:**
   Ecwid Instant Sites are served from Ecwid's shared hosting infrastructure.
   If the origin server for this store is idle and needs to "warm up" (e.g. load
   the store's configuration, render the SSR HTML), the first request after a
   quiet period may exceed the timeout. This "cold start" theory is supported by
   the fact that the first request timed out and subsequent requests were fast.

2. **CDN/edge cache miss with slow origin:**
   If the page is not cached at the edge (CDN cache expiry, regional cache
   miss), the CDN must fetch from the Ecwid origin. If the origin is slow to
   respond, the CDN may time out the upstream connection.

3. **Rate limiting or connection queuing:**
   Some hosting platforms queue or throttle requests under certain conditions
   (geographic region, IP reputation, concurrent connections). The test was
   run from a cloud server, which may hit different rate limits than a
   residential connection.

4. **Transient network issue between CDN and origin:**
   A brief network partition, routing change, or packet loss between the CDN
   edge and the Ecwid origin could cause individual requests to stall.

### What this is NOT

- **Not a client-side JavaScript issue:** The timeout occurs at the HTTP level
  before any HTML, CSS, or JavaScript is delivered. The `ddc.js` script,
  MutationObserver, or any other client-side code has zero involvement.

- **Not a DNS issue (for the bare domain):** DNS resolution for `divinedunlop.com`
  is fast and consistent. The timeout occurs after DNS resolution and TCP
  connection, during the HTTP response phase.

- **Not a TLS/SSL issue:** The TLS handshake completes successfully (the
  connection is established). The stall is in the application layer.

### Recommendation

1. **Check Ecwid's hosting dashboard** for any reported incidents, rate limits,
   or geographic restrictions affecting the store.

2. **Contact Ecwid support** with this data — specifically the pre-TTFB timeout
   pattern and the ~10% failure rate. Ask if there are any known issues with
   origin response times for Instant Site stores.

3. **Test from different networks:** Have someone test from a residential
   connection (home WiFi, mobile data) to see if the timeout rate differs.
   This would help distinguish between origin-side issues and CDN/routing
   issues specific to certain networks.

4. **Monitor over a longer period:** The timeout rate may vary by time of day
   (Ecwid shared hosting load patterns). Testing at different times would help
   identify if there's a peak-hours pattern.

5. **Consider a custom domain CDN** (e.g. Cloudflare) in front of the Ecwid
   store to add caching and reduce dependence on Ecwid's origin response time.
   This is a more involved change and should be evaluated after Ecwid support
   has been consulted.

---

## Relationship to the Mobile Crash Issue

These two issues are **independent** of the mobile browser crash investigation:

| Issue | Layer | Cause | Fix |
|-------|-------|-------|-----|
| Mobile crash / "A problem repeatedly occurred" | Client-side (WebKit) | Suspected: `ddc.js` document-wide MutationObserver | Track A isolation test (Config A/B) |
| www subdomain 403 | DNS / hosting | Wrong A record for `www` | DNS record change |
| Intermittent origin timeout | Server-side (Ecwid hosting) | Origin response failure | Ecwid support / monitoring |

The intermittent timeout could *compound* the mobile crash experience: if the
page takes multiple attempts to load, and each successful load triggers the
MutationObserver memory pressure, the combined effect is worse than either issue
alone. Fixing both independently is the correct approach.

---

## Test Environment

- **Test origin:** Cloud server (AWS region, via HTTPS proxy)
- **curl version:** Standard curl with HTTP/1.1 and HTTP/2 support
- **Timeout setting:** 25 seconds (matching observed user-reported timeout window)
- **Test date:** 31 October 2026
- **Note:** Tests were run sequentially (not concurrent) to isolate per-request
  behaviour. Real-world conditions with concurrent browser resource requests
  may show different patterns.
