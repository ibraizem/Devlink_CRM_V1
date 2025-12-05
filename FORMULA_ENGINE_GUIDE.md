# Formula Engine - Complete Guide

The DevLink CRM Formula Engine is a powerful system that allows you to create calculated columns using Excel-like formulas with built-in AI enrichment capabilities.

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Architecture](#architecture)
4. [Formula Syntax](#formula-syntax)
5. [Available Functions](#available-functions)
6. [AI Enrichment](#ai-enrichment)
7. [API Reference](#api-reference)
8. [Database Schema](#database-schema)
9. [Performance & Caching](#performance--caching)
10. [Best Practices](#best-practices)

## Overview

### Key Features

- **Excel-like Formula Language**: Familiar syntax for business users
- **50+ Built-in Functions**: Math, text, logic, date operations
- **AI Enrichment**: Company detection, data completion, lead scoring
- **Persistent Results**: Calculated values are cached with configurable expiration
- **Server-Side Execution**: Secure formula evaluation with result caching
- **Real-time Validation**: Syntax checking before saving formulas
- **Type Safety**: Results can be text, number, or boolean

### Use Cases

1. **Data Enrichment**: Auto-complete missing fields using AI
2. **Lead Scoring**: Calculate quality scores based on multiple criteria
3. **Data Cleaning**: Standardize formats, clean phone numbers, format names
4. **Business Logic**: Apply conditional rules to classify leads
5. **Calculations**: Sum totals, calculate percentages, date differences
6. **Derived Fields**: Combine multiple fields into new insights

## Quick Start

### 1. Database Setup

Run the migration SQL to create required tables:

```sql
-- Run migrations/formula_engine_setup.sql in your Supabase SQL editor
```

This creates:
- `calculated_columns` - Formula definitions
- `calculated_results` - Cached results
- `ai_enrichment_cache` - AI response cache

### 2. Access the Formula Manager

Navigate to `/formulas` in your CRM application to access the Calculated Column Manager.

### 3. Create Your First Column

**Example: Full Name**

1. Click "New Column"
2. Set Column Name: `Full Name`
3. Enter Formula: `CONCAT([firstName], " ", [lastName])`
4. Select Result Type: `text`
5. Set Cache Duration: `3600` (1 hour)
6. Click "Save Column"

### 4. View Results

Calculated columns automatically appear in your leads table with their computed values.

## Architecture

### Components

```
┌─────────────────────────────────────────┐
│         User Interface Layer            │
│  - FormulaEditor.tsx                    │
│  - CalculatedColumnManager.tsx          │
│  - LeadsTableWithCalculated.tsx         │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│          API Layer (Next.js)            │
│  - /api/formulas/*                      │
│  - /api/calculated-columns/*            │
│  - /api/ai/*                            │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│         Business Logic Layer            │
│  - calculatedColumnService.ts           │
│  - Formula Engine (Parser, Evaluator)   │
│  - AI Functions                         │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│          Data Layer                     │
│  - Supabase (PostgreSQL)                │
│  - calculated_columns table             │
│  - calculated_results table             │
│  - ai_enrichment_cache table            │
└─────────────────────────────────────────┘
```

### Formula Execution Flow

1. User creates formula in UI
2. Formula validated via `/api/formulas/validate`
3. Saved to `calculated_columns` table
4. When lead data displayed:
   - Check `calculated_results` for cached result
   - If cache miss or expired, evaluate formula
   - Parse formula → Build AST → Evaluate nodes
   - Execute functions (built-in or AI)
   - Cache result with expiration
   - Return computed value

## Formula Syntax

### Field References

Access lead data fields using square brackets:

```
[firstName]
[lastName]
[email]
[company]
```

### Literals

```javascript
// Strings (single or double quotes)
"Hello World"
'John Doe'

// Numbers
42
3.14
-10.5

// Booleans
true
false
```

### Operators

```javascript
// Arithmetic
[price] + [tax]
[total] - [discount]
[quantity] * [price]
[total] / [count]

// Comparison
[score] > 80
[age] < 18
[value] >= 100
[value] <= 50
[status] == "active"
[type] != "deleted"

// Logical (use functions)
AND([condition1], [condition2])
OR([condition1], [condition2])
NOT([condition])
```

### Function Calls

```
FUNCTION_NAME(argument1, argument2, ...)
```

Example:
```
CONCAT([firstName], " ", [lastName])
IF([score] >= 80, "Pass", "Fail")
```

### Nested Functions

```
UPPER(CONCAT([firstName], " ", [lastName]))
IF(ISEMPTY([email]), "No Email", LOWER([email]))
```

## Available Functions

### Math Functions

| Function | Description | Example |
|----------|-------------|---------|
| `SUM(...values)` | Sum of numbers | `SUM([price], [tax], [shipping])` |
| `AVG(...values)` | Average | `AVG([score1], [score2], [score3])` |
| `COUNT(...values)` | Count non-empty | `COUNT([email], [phone], [address])` |
| `MIN(...values)` | Minimum value | `MIN([price1], [price2])` |
| `MAX(...values)` | Maximum value | `MAX([price1], [price2])` |
| `ROUND(number, decimals)` | Round number | `ROUND([price], 2)` |
| `ABS(number)` | Absolute value | `ABS([balance])` |

### Text Functions

| Function | Description | Example |
|----------|-------------|---------|
| `CONCAT(...strings)` | Join strings | `CONCAT([first], " ", [last])` |
| `UPPER(text)` | Uppercase | `UPPER([company])` |
| `LOWER(text)` | Lowercase | `LOWER([email])` |
| `TRIM(text)` | Remove spaces | `TRIM([name])` |
| `LEN(text)` | String length | `LEN([description])` |
| `LEFT(text, length)` | Left substring | `LEFT([text], 10)` |
| `RIGHT(text, length)` | Right substring | `RIGHT([text], 5)` |
| `MID(text, start, length)` | Middle substring | `MID([text], 5, 10)` |
| `REPLACE(text, search, replacement)` | Replace text | `REPLACE([phone], "-", "")` |

### Logic Functions

| Function | Description | Example |
|----------|-------------|---------|
| `IF(condition, trueVal, falseVal)` | Conditional | `IF([score] > 80, "Pass", "Fail")` |
| `AND(...conditions)` | Logical AND | `AND([verified], [active])` |
| `OR(...conditions)` | Logical OR | `OR([email], [phone])` |
| `NOT(condition)` | Logical NOT | `NOT([deleted])` |
| `ISEMPTY(value)` | Check if empty | `ISEMPTY([email])` |
| `ISNUMBER(value)` | Check if number | `ISNUMBER([age])` |
| `COALESCE(...values)` | First non-null | `COALESCE([mobile], [phone])` |

### Date Functions

| Function | Description | Example |
|----------|-------------|---------|
| `NOW()` | Current date/time | `NOW()` |
| `TODAY()` | Current date | `TODAY()` |
| `YEAR(date)` | Extract year | `YEAR([birthDate])` |
| `MONTH(date)` | Extract month | `MONTH([createdAt])` |
| `DAY(date)` | Extract day | `DAY([date])` |
| `DATEADD(date, amount, unit)` | Add to date | `DATEADD(NOW(), 7, "days")` |
| `DATEDIFF(date1, date2, unit)` | Date difference | `DATEDIFF([start], [end], "days")` |

Units for DATEADD/DATEDIFF: "days", "hours", "minutes", "months", "years"

## AI Enrichment

### AI Functions

| Function | Description | Returns | Cache |
|----------|-------------|---------|-------|
| `AI_DETECT_COMPANY(company)` | Detect industry | Industry name | 24h |
| `AI_COMPANY_SIZE(company)` | Detect company size | Enterprise/Mid/Small | 24h |
| `AI_COMPLETE_EMAIL(first, last, domain)` | Generate email | Email address | 24h |
| `AI_COMPLETE_PHONE(first, last, company)` | Generate phone | Phone number | 24h |
| `AI_LEAD_SCORE(leadData)` | Quality score | Number (0-100) | 1h |
| `AI_EXTRACT_DOMAIN(email)` | Extract domain | Domain string | Instant |
| `AI_CLEAN_PHONE(phone)` | Clean phone | Cleaned phone | Instant |
| `AI_FORMAT_NAME(name)` | Format name | Formatted name | Instant |
| `AI_PREDICT_INDUSTRY(desc)` | Predict industry | Industry name | 24h |
| `AI_SENTIMENT(text)` | Sentiment analysis | positive/negative/neutral | 1h |

### How AI Enrichment Works

1. **Pattern Matching**: Fast, rule-based enrichment (e.g., domain extraction)
2. **Keyword Analysis**: Industry detection based on company name keywords
3. **Data Completion**: Smart generation of missing fields
4. **Scoring Algorithms**: Multi-factor lead quality scoring

### AI Enrichment Cache

All AI enrichment results are automatically cached:
- Stored in `ai_enrichment_cache` table
- Shared across all users (anonymized)
- Configurable expiration per function type
- Reduces API calls and improves performance

## API Reference

### Validate Formula

```typescript
POST /api/formulas/validate
Content-Type: application/json

{
  "formula": "CONCAT([firstName], ' ', [lastName])"
}

Response:
{
  "valid": true
}
// or
{
  "valid": false,
  "error": "Unexpected token..."
}
```

### Evaluate Formula

```typescript
POST /api/formulas/evaluate
Content-Type: application/json

{
  "formula": "SUM([price], [tax])",
  "context": {
    "price": 100,
    "tax": 20
  }
}

Response:
{
  "success": true,
  "result": 120
}
```

### List Calculated Columns

```typescript
GET /api/calculated-columns?active=true

Response:
{
  "data": [
    {
      "id": "uuid",
      "column_name": "Full Name",
      "formula": "CONCAT([firstName], ' ', [lastName])",
      "formula_type": "calculation",
      "result_type": "text",
      "is_active": true,
      "cache_duration": 3600,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Create Calculated Column

```typescript
POST /api/calculated-columns
Content-Type: application/json

{
  "column_name": "Lead Score",
  "formula": "AI_LEAD_SCORE([leadData])",
  "formula_type": "ai_enrichment",
  "result_type": "number",
  "cache_duration": 3600
}

Response:
{
  "data": { ... }
}
```

### Evaluate Column for Lead

```typescript
POST /api/calculated-columns/{columnId}/evaluate
Content-Type: application/json

{
  "leadId": "lead-uuid",
  "leadData": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com"
  },
  "forceRefresh": false
}

Response:
{
  "success": true,
  "result": "John Doe",
  "fromCache": true
}
```

### Clear Column Cache

```typescript
DELETE /api/calculated-columns/{columnId}/cache

Response:
{
  "success": true
}
```

## Database Schema

### calculated_columns

Stores formula definitions:

- `id` - UUID primary key
- `user_id` - Owner reference
- `column_name` - Display name (unique per user)
- `formula` - Formula expression
- `formula_type` - 'calculation' or 'ai_enrichment'
- `result_type` - 'text', 'number', or 'boolean'
- `is_active` - Enable/disable column
- `cache_duration` - Seconds (null = no cache)
- `created_at`, `updated_at` - Timestamps

### calculated_results

Caches computed results:

- `id` - UUID primary key
- `column_id` - References calculated_columns
- `lead_id` - References fichier_donnees
- `result_value` - JSONB result
- `computed_at` - Computation timestamp
- `expires_at` - Cache expiration

Unique constraint on (column_id, lead_id)

### ai_enrichment_cache

Global AI response cache:

- `id` - UUID primary key
- `cache_key` - Hash of request
- `enrichment_type` - Type of enrichment
- `input_data` - Request parameters
- `result_data` - Response data
- `expires_at` - Cache expiration

## Performance & Caching

### Caching Strategy

**Three-Level Cache:**

1. **Result Cache** (`calculated_results`)
   - Per-column, per-lead results
   - Configurable expiration
   - Automatically refreshed on formula update

2. **AI Enrichment Cache** (`ai_enrichment_cache`)
   - Global cache for AI responses
   - Shared across all users
   - Long expiration (24 hours default)

3. **Client-Side Cache** (React Query)
   - UI-level caching
   - Instant updates
   - Background refresh

### Cache Configuration

```typescript
// No caching (always compute fresh)
cache_duration: null

// Short cache (5 minutes)
cache_duration: 300

// Medium cache (1 hour)
cache_duration: 3600

// Long cache (24 hours)
cache_duration: 86400
```

### Performance Tips

1. **Use appropriate cache durations**
   - Static data: Long cache (24h)
   - Dynamic data: Short cache (5-30 min)
   - Real-time data: No cache

2. **Optimize formula complexity**
   - Avoid deeply nested functions
   - Break complex formulas into multiple columns
   - Use AI functions sparingly

3. **Batch evaluations**
   - Evaluate multiple leads at once
   - Use the batch API endpoint
   - Leverage parallel processing

4. **Monitor cache hit rates**
   - Check `calculated_column_stats` view
   - Adjust cache durations based on usage
   - Clean expired cache regularly

### Cache Cleanup

Run periodically (cron job or scheduled task):

```sql
SELECT cleanup_expired_cache();
```

This removes all expired entries from both cache tables.

## Best Practices

### Formula Design

1. **Keep formulas simple and readable**
   ```
   ✅ CONCAT([firstName], " ", [lastName])
   ❌ UPPER(LEFT(TRIM(CONCAT(COALESCE([firstName], ""), " ", COALESCE([lastName], ""))), 50))
   ```

2. **Use descriptive column names**
   ```
   ✅ "Full Name", "Lead Quality Score", "Days Since Contact"
   ❌ "calc1", "temp", "x"
   ```

3. **Handle null values**
   ```
   ✅ COALESCE([email], "No email")
   ✅ IF(ISEMPTY([phone]), "Missing", [phone])
   ❌ [email]  // May return null
   ```

4. **Validate inputs**
   ```
   ✅ IF(ISNUMBER([age]), [age], 0)
   ✅ IF(LEN([phone]) >= 10, [phone], "Invalid")
   ```

### Performance Optimization

1. **Minimize AI function calls**
   - Cache AI results aggressively
   - Use AI functions only when needed
   - Batch AI operations when possible

2. **Optimize calculation order**
   - Cheap operations first
   - Use early returns in IF statements
   - Avoid redundant calculations

3. **Use appropriate result types**
   - 'number' for numeric calculations
   - 'boolean' for yes/no values
   - 'text' for everything else

### Security

1. **Never expose sensitive data in formulas**
2. **Validate all user inputs**
3. **Use RLS policies**
4. **Sanitize outputs**

### Testing

1. **Test with sample data first**
2. **Validate syntax before saving**
3. **Check edge cases (null, empty, invalid)**
4. **Monitor performance in production**

### Maintenance

1. **Document complex formulas**
2. **Version control formula changes**
3. **Monitor cache performance**
4. **Clean up unused columns**
5. **Review and update regularly**

## Examples

See `FORMULA_EXAMPLES.md` for comprehensive examples of:
- Basic field manipulation
- Calculations and math
- Conditional logic
- Data cleaning
- Date calculations
- AI enrichment
- Advanced combinations
- Industry-specific use cases

## Support

For issues or questions:
1. Check formula syntax in the validator
2. Review error messages
3. Check the examples documentation
4. Test with simple formulas first
5. Monitor cache and performance metrics
