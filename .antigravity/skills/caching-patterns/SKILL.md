---
name: caching-patterns
description: Guide for implementing and modifying caching in CheckoutService using the GlobalE DataManager SDK. Covers multi-layer caching (InMemory, Redis, GlobaleCache), entity integration, feature flags, fallback patterns, and configuration. Use when adding new cached entities, debugging cache issues, or modifying caching behavior.
version: 1.0.0
last_updated: 2026-02-25
---

# CheckoutService Caching Patterns

## When to Use

- Adding a new entity to the GlobaleCache
- Debugging cache misses or stale data
- Modifying cache configuration (TTL, MaxSize, Redis)
- Understanding the cache → Core monolith fallback pattern
- Investigating performance issues related to caching

## Architecture Overview

```
┌─────────────────┐    ┌──────────────────────┐    ┌─────────────────┐
│ CheckoutService │───▶│ GlobaleCacheIntegration│───▶│ DataManager SDK │
│                 │    │                      │    │ (InMemory/Redis) │
└─────────────────┘    └──────────────────────┘    └─────────────────┘
                                │ Fallback                  │
                                ▼                           ▼
                       ┌──────────────────────┐    ┌─────────────────┐
                       │ CoreIntegration      │───▶│ CORE Monolith   │
                       │ (ExposeController)   │    │ (/expose API)   │
                       └──────────────────────┘    └─────────────────┘
```

**Three caching layers coexist:**
1. **GlobaleCache SDK** (InMemory + optional Redis) — Entity-level, RabbitMQ invalidation
2. **LazyCache** — Service-level method result caching
3. **Output Caching** — ASP.NET Core response caching (5-10 min policies)

## Currently Cached Entities (11)

AppSetting, Country, CountryToCountryDutyTaxThreshold, CountryToCountrySetting, Culture, Currency, Merchant, MerchantAppSetting, MerchantCountry, MerchantCountryToCountrySetting, ShippingMethod

**Planned:** MerchantCountryParameter, FormalClearanceThreshold, TextResource

## Step-by-Step: Adding a New Cached Entity

### Step 1: Create Entity Model

In `GlobalE.Model` project (must match CORE namespace for RabbitMQ invalidation):

```csharp
namespace GlobalE.Model.Entities
{
    public class MyEntity { /* properties matching CORE model */ }
}
```

### Step 2: Create Index Data

```csharp
public static class MyEntityIndexData
{
    public static Expression<Func<MyEntity, object>> PrimaryKeyExpression =
        entity => entity.MyEntityId;
    public static List<Expression<Func<MyEntity, object>>> Indexes = new() { /* secondary indexes */ };
}
```

### Step 3: Register in Cache Middleware

In `GlobalECacheMiddlewareExtensions.cs`:
```csharp
_ = compositor.SetupGlobaleCacheForEntity<MyEntity>(
    globaleCacheConfiguration, "MyEntity",
    MyEntityIndexData.PrimaryKeyExpression, MyEntityIndexData.Indexes);
```

### Step 4: Create GlobaleCache Integration

```csharp
public class MyEntityGlobaleCacheIntegration : EntityGlobaleCacheIntegrationWithCoreFallback<MyEntity>
{
    // Inherits: Try cache → fallback to CoreIntegration
}
```

### Step 5: Register in DI

In `DependencyInjection.cs`:
```csharp
// Core Integration (standard)
services.AddKeyedSingleton<IMyEntityIntegration, MyEntityCoreIntegration>(DataSourceType.CoreIntegration, ...);
// Core Integration (no response caching - used when GlobaleCache is primary)
services.AddKeyedSingleton<IMyEntityIntegration, MyEntityCoreIntegration>(DataSourceType.NonResponseCachingCoreIntegration, ...);
// GlobaleCache Integration
services.AddKeyedSingleton<IMyEntityIntegration, MyEntityGlobaleCacheIntegration>(DataSourceType.GlobaleCache, ...);
```

### Step 6: Configure

In `appsettings.json`:
```json
"GlobaleCacheConfiguration": {
    "Entities": {
        "MyEntity": {
            "MaxSize": 500,
            "TtlInMinutes": 10,
            "UseRedis": false
        }
    }
}
```

## Feature Flag

**LaunchDarkly flag:** `CORE-108032-CheckoutService-use-GlobalEDataAccessCacheSDK`

- **OFF (default):** CoreIntegration + HTTP response caching
- **ON:** GlobaleCache → CoreIntegration fallback (no response caching on fallback)
- Runtime toggle, no redeployment needed
- **EntityIntegrationFactory** selects implementation based on flag

## Configuration Reference

| Parameter | Default | Purpose |
|-----------|---------|---------|
| `DefaultTtlInMinutes` | 10 | InMemory TTL |
| `DefaultMaxSize` | 1000 | Max items in memory |
| `DefaultUseRedis` | false | Enable Redis layer |
| `DefaultDisablePublisher` | **true** | MUST be true — CheckoutService is read-only |
| `ExpirationScanFrequencyForEvictionInMilliseconds` | 1000 | Eviction check interval |

**CRITICAL:** `DisablePublisher` must be `true` because CheckoutService only reads entities. Setting to `false` would send false invalidation messages.

## Known Challenges

1. **Non-clean DB entries:** CORE's BL/DAL modifies data before returning. Currently using InMemory only with ExposeController as source.
2. **In-Memory MaxSize limits:** Collection operations use CoreIntegration. Single-item methods use GlobaleCache.
3. **Namespace matching:** Entity namespaces must exactly match CORE for RabbitMQ messages.
4. **Fallback entities:** Some entities (e.g., CountryToCountryDutyTaxThreshold) return fallback records with modified keys.

## Troubleshooting

| Issue | Check |
|-------|-------|
| High memory | Entity MaxSize config, monitor InMemory cache growth |
| Stale data | RabbitMQ connection, entity namespace match, TTL settings |
| Performance degradation | Cache hit rates, fallback overuse, feature flag status |
| Feature flag issues | LaunchDarkly connectivity, `CORE-108032-*` flag state |

## NuGet Packages

- `GlobalE.Foundation.DataAccess.Cache.SDK` (v1.0.7)
- `GlobalE.Foundation.DataAccess.Cache.InMemory` (v1.0.7)
- `GlobalE.Foundation.DataAccess.Cache.Redis` (v1.0.7)
