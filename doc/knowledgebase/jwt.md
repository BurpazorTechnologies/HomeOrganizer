# JWT Token System - Field Analysis & Reusability

## Overview

The JWT token system consists of three models that work together to provide a complete JWT authentication solution:
- **JwtShortToken**: Short-lived access tokens
- **JwtLongToken**: Long-lived refresh tokens  
- **JwtTokenBlacklist**: Revoked/blacklisted tokens

## Field Analysis

### **JwtShortToken** (Short-lived Access Tokens)

| Field | Purpose | Generic? |
|-------|---------|----------|
| `jti` | JWT ID (JWT standard claim) | ✅ Generic |
| `token_hash` | Hashed token for lookup/validation | ✅ Generic |
| `service` | Service/app identifier (e.g., "homeorganizer", "burpazor") | ✅ Generic |
| `context` | Context within service (default: "app") | ✅ Generic |
| `guard` | Laravel guard name | ✅ Generic |
| `subject_type` / `subject_id` | Polymorphic relation to any authenticatable entity | ✅ Generic |
| `subject_connection` | Database connection name for subject | ✅ Generic |
| `subject_snapshot` | Snapshot of subject data at token creation | ✅ Generic |
| `claims` | Full JWT claims payload | ✅ Generic |
| `abilities` | Permissions/scopes array | ✅ Generic |
| `issued_at` | Token issuance timestamp | ✅ Generic |
| `expires_at` | Token expiration timestamp | ✅ Generic |
| `last_used_at` | Last usage tracking | ✅ Generic |
| `revoked_at` | Revocation timestamp | ✅ Generic |
| `revoked_reason` | Reason for revocation | ✅ Generic |
| `meta` | Flexible JSON for additional metadata | ✅ Generic |

### **JwtLongToken** (Long-lived Refresh Tokens)

All fields from `JwtShortToken`, plus:

| Field | Purpose | Generic? |
|-------|---------|----------|
| `linked_short_jti` | Links refresh token to its access token | ✅ Generic |
| `family` | Token family ID for refresh token rotation | ✅ Generic |

### **JwtTokenBlacklist** (Revoked/Blacklisted Tokens)

| Field | Purpose | Generic? |
|-------|---------|----------|
| `token_type` | "short" or "long" | ✅ Generic |
| `jti` | JWT ID being blacklisted | ✅ Generic |
| `token_hash` | Hashed token for lookup | ✅ Generic |
| `service` | Service identifier | ✅ Generic |
| `context` | Context within service | ✅ Generic |
| `guard` | Laravel guard name | ✅ Generic |
| `subject_type` / `subject_id` | Polymorphic relation | ✅ Generic |
| `subject_connection` | Database connection name | ✅ Generic |
| `reason` | Why token was blacklisted | ✅ Generic |
| `blacklisted_at` | Blacklist timestamp | ✅ Generic |
| `expires_at` | Original token expiration | ✅ Generic |
| `meta` | Flexible JSON metadata | ✅ Generic |

## Reusability Assessment

### ✅ **100% Generic - No Project-Specific Fields**

These models are **completely reusable** across multiple JWT-enabled Laravel applications. There are **zero project-specific fields** present.

### Why This Works for Multiple Apps

1. **Polymorphic Subject Relation**: Works with any authenticatable model (User, Admin, etc.)
2. **Service/Context Separation**: `service` field identifies the app; `context` can segment within an app
3. **Flexible Metadata**: `meta` JSON field allows app-specific data without schema changes
4. **Standard JWT Patterns**: Supports refresh token rotation, revocation, and blacklisting

### Reusability Features

- ✅ No hardcoded foreign keys to specific models
- ✅ No project-specific fields (e.g., `project_id`, `home_id`)
- ✅ Uses polymorphic relations for maximum flexibility
- ✅ Service/context pattern allows multi-tenancy or multi-app usage
- ✅ Standard JWT fields and patterns

## Usage Across Projects

You can copy these models and migrations to other Laravel projects and use them as-is. Simply configure the `service` field per application, and everything else works without modification.

### Example Service Values
- `"homeorganizer"` - HomeOrganizer app
- `"burpazor"` - BurpazorApp
- `"codingvibedev"` - CodingVibeDev site

## Database Schema Locations

- **Short Tokens**: `database/migrations/2025_11_22_000700_create_jwt_tokens_short_table.php`
- **Long Tokens**: `database/migrations/2025_11_22_000710_create_jwt_tokens_long_table.php`
- **Blacklist**: `database/migrations/2025_11_22_000720_create_jwt_tokens_blacklist_table.php`

## Model Locations

- `app/Models/Jwt/JwtShortToken.php`
- `app/Models/Jwt/JwtLongToken.php`
- `app/Models/Jwt/JwtTokenBlacklist.php`

