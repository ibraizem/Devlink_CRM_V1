# Formula Engine - Quick Setup Guide

Follow these steps to set up the Formula Engine in your DevLink CRM.

## Prerequisites

- Running DevLink CRM instance
- Access to Supabase dashboard
- Database access for running migrations

## Step 1: Database Migration

### Option A: Supabase Dashboard

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste the contents of `migrations/formula_engine_setup.sql`
5. Click **Run** to execute the migration

### Option B: Command Line

If you have direct database access:

```bash
psql -h your-db-host -U postgres -d your-database -f migrations/formula_engine_setup.sql
```

### Verify Migration

Run this query to verify tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('calculated_columns', 'calculated_results', 'ai_enrichment_cache');
```

You should see all three tables listed.

## Step 2: Verify Installation

### Check Files

Ensure these files exist in your project:

```
lib/
  formula-engine/
    ├── parser.ts
    ├── evaluator.ts
    ├── functions.ts
    ├── ai-functions.ts
    ├── index.ts
    └── README.md
  services/
    └── calculatedColumnService.ts
  hooks/
    └── useCalculatedColumns.ts

components/
  formula-editor/
    ├── FormulaEditor.tsx
    ├── CalculatedColumnManager.tsx
    └── ...
  leads/
    └── LeadsTableWithCalculated.tsx

app/
  api/
    formulas/
      ├── evaluate/route.ts
      └── validate/route.ts
    calculated-columns/
      ├── route.ts
      └── [id]/
          ├── route.ts
          ├── evaluate/route.ts
          └── cache/route.ts
    ai/
      ├── detect-company/route.ts
      ├── complete-data/route.ts
      └── score-lead/route.ts
  formulas/
    └── page.tsx
```

### Install Dependencies

No additional npm packages are required - the formula engine uses only built-in TypeScript and existing project dependencies.

## Step 3: Test the System

### 1. Access Formula Manager

Navigate to: `http://localhost:3000/formulas`

You should see the Calculated Column Manager interface.

### 2. Create Test Column

Click **"New Column"** and create a simple test column:

- **Column Name**: `Test Full Name`
- **Formula**: `CONCAT([firstName], " ", [lastName])`
- **Formula Type**: `Calculation`
- **Result Type**: `Text`
- **Cache Duration**: `3600`

Click **"Save Column"**

### 3. Test Formula Validation

Try entering an invalid formula like `INVALID_FUNC()` and verify you see a validation error.

### 4. Test on Lead Data

Navigate to your leads page and verify the calculated column appears with computed values.

## Step 4: Configure (Optional)

### Adjust Cache Durations

Edit default cache settings in your columns based on your needs:

- **Static data** (company industry): 86400 seconds (24 hours)
- **Dynamic data** (lead score): 3600 seconds (1 hour)
- **Real-time data**: null (no cache)

### Customize AI Functions

If you want to integrate with real AI APIs (instead of pattern matching), update:

- `app/api/ai/detect-company/route.ts`
- `app/api/ai/complete-data/route.ts`
- `app/api/ai/score-lead/route.ts`

### Set Up Cache Cleanup

Create a scheduled job (cron or similar) to clean expired cache:

```sql
-- Run this periodically (e.g., daily)
SELECT cleanup_expired_cache();
```

In your environment, you might use:
- Supabase Edge Functions with cron
- External cron job
- Background worker

## Step 5: Create Your First Production Columns

### Example 1: Lead Quality Score

```typescript
Column Name: Lead Quality Score
Formula: AI_LEAD_SCORE([leadData])
Type: AI Enrichment
Result Type: Number
Cache: 3600 seconds
```

### Example 2: Full Contact Info

```typescript
Column Name: Full Contact
Formula: CONCAT(
  [firstName], " ", [lastName],
  IF(NOT(ISEMPTY([email])), CONCAT(" - ", [email]), ""),
  IF(NOT(ISEMPTY([phone])), CONCAT(" - ", [phone]), "")
)
Type: Calculation
Result Type: Text
Cache: 3600 seconds
```

### Example 3: Company Industry

```typescript
Column Name: Industry
Formula: AI_DETECT_COMPANY([company])
Type: AI Enrichment
Result Type: Text
Cache: 86400 seconds
```

### Example 4: Days Since Last Contact

```typescript
Column Name: Days Since Contact
Formula: DATEDIFF([lastContact], NOW(), "days")
Type: Calculation
Result Type: Number
Cache: 300 seconds
```

## Common Issues & Solutions

### Issue: "Cannot read property 'id' of undefined"

**Solution**: Make sure the lead data includes an `id` field. Check your lead object structure.

### Issue: Formula validation fails with "Unexpected token"

**Solution**: Check your formula syntax:
- Field references use square brackets: `[fieldName]`
- String literals use quotes: `"text"` or `'text'`
- Function names are case-insensitive but typically UPPERCASE

### Issue: AI functions return "Unknown"

**Solution**: This is expected behavior for the pattern-based implementation. The AI functions use keyword matching. For real AI integration, update the API routes to call actual AI services.

### Issue: Cached results not updating

**Solution**: 
- Clear the cache manually: DELETE `/api/calculated-columns/{id}/cache`
- Or set `forceRefresh: true` when evaluating
- Or adjust cache duration settings

### Issue: Performance is slow

**Solution**:
- Increase cache durations
- Simplify complex formulas
- Use batch evaluation for multiple leads
- Add database indexes if needed

## Next Steps

1. **Read the Documentation**
   - `FORMULA_ENGINE_GUIDE.md` - Complete guide
   - `FORMULA_EXAMPLES.md` - Formula examples
   - `lib/formula-engine/README.md` - Technical details

2. **Create More Columns**
   - Start with simple calculations
   - Progress to complex logic
   - Add AI enrichment gradually

3. **Monitor Performance**
   - Check cache hit rates
   - Monitor query performance
   - Adjust cache settings

4. **Integrate with Your Workflow**
   - Add calculated columns to exports
   - Use in reports and dashboards
   - Create automation rules based on calculated values

## Support Resources

- **Formula Examples**: See `FORMULA_EXAMPLES.md`
- **Complete Guide**: See `FORMULA_ENGINE_GUIDE.md`
- **API Reference**: Check individual route files in `app/api/`
- **Database Schema**: See `DATABASE_SCHEMA.md`

## Production Checklist

Before deploying to production:

- [ ] Database migration completed successfully
- [ ] All API endpoints tested
- [ ] Formula validation working
- [ ] Cache system functioning
- [ ] Performance acceptable
- [ ] Error handling tested
- [ ] Documentation reviewed
- [ ] Team trained on usage
- [ ] Monitoring set up
- [ ] Backup strategy in place

## Rollback Procedure

If you need to rollback:

```sql
-- Drop tables in reverse order (due to foreign keys)
DROP TABLE IF EXISTS calculated_results CASCADE;
DROP TABLE IF EXISTS ai_enrichment_cache CASCADE;
DROP TABLE IF EXISTS calculated_columns CASCADE;
DROP VIEW IF EXISTS calculated_column_stats CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_cache();
DROP FUNCTION IF EXISTS update_updated_at_column();
```

**Warning**: This will delete all formulas and cached results.

## Getting Help

If you encounter issues:

1. Check error messages in browser console
2. Review API response errors
3. Verify database connections
4. Check Supabase logs
5. Review formula syntax
6. Test with simple examples first

The formula engine is designed to be robust and self-contained. Most issues can be resolved by checking syntax, cache settings, or data structure.
