# Formula Engine

A powerful formula engine for DevLink CRM with built-in calculation functions and AI enrichment capabilities.

## Features

- **Excel-like Functions**: SUM, AVG, COUNT, CONCAT, IF/ELSE, and more
- **AI Enrichment**: Company detection, data completion, lead scoring
- **Field References**: Use `[fieldName]` syntax to reference lead fields
- **Operators**: Math (+, -, *, /), comparison (>, <, >=, <=, ==, !=), logical (AND, OR, NOT)
- **Persistent Results**: Cached results with configurable expiration
- **Server-Side Execution**: API endpoints for secure formula evaluation

## Formula Syntax

### Field References
```
[firstName]
[lastName]
[company]
```

### String Literals
```
"Hello World"
'John Doe'
```

### Number Literals
```
42
3.14
```

### Function Calls
```
SUM([price], [tax])
CONCAT([firstName], " ", [lastName])
IF([score] > 80, "Pass", "Fail")
```

## Built-in Functions

### Math Functions
- `SUM(...values)` - Sum of numbers
- `AVG(...values)` - Average of numbers
- `COUNT(...values)` - Count non-empty values
- `MIN(...values)` - Minimum value
- `MAX(...values)` - Maximum value
- `ROUND(number, decimals)` - Round number
- `ABS(number)` - Absolute value

### Text Functions
- `CONCAT(...strings)` - Concatenate strings
- `UPPER(text)` - Convert to uppercase
- `LOWER(text)` - Convert to lowercase
- `TRIM(text)` - Remove whitespace
- `LEN(text)` - String length
- `LEFT(text, length)` - Left substring
- `RIGHT(text, length)` - Right substring
- `MID(text, start, length)` - Middle substring
- `REPLACE(text, search, replacement)` - Replace text

### Logic Functions
- `IF(condition, trueValue, falseValue)` - Conditional logic
- `AND(...conditions)` - Logical AND
- `OR(...conditions)` - Logical OR
- `NOT(condition)` - Logical NOT
- `ISEMPTY(value)` - Check if empty
- `ISNUMBER(value)` - Check if number
- `COALESCE(...values)` - First non-null value

### Date Functions
- `NOW()` - Current date/time
- `TODAY()` - Current date
- `YEAR(date)` - Extract year
- `MONTH(date)` - Extract month
- `DAY(date)` - Extract day
- `DATEADD(date, amount, unit)` - Add to date
- `DATEDIFF(date1, date2, unit)` - Date difference

### AI Functions
- `AI_DETECT_COMPANY(companyName)` - Detect company industry
- `AI_COMPANY_SIZE(companyName)` - Detect company size
- `AI_COMPLETE_EMAIL(firstName, lastName, domain)` - Complete email address
- `AI_COMPLETE_PHONE(firstName, lastName, company)` - Complete phone number
- `AI_LEAD_SCORE(leadData)` - Score lead quality (0-100)
- `AI_EXTRACT_DOMAIN(email)` - Extract domain from email
- `AI_CLEAN_PHONE(phone)` - Clean phone number
- `AI_FORMAT_NAME(name)` - Format name properly
- `AI_PREDICT_INDUSTRY(description)` - Predict industry from description
- `AI_SENTIMENT(text)` - Analyze sentiment (positive/negative/neutral)

## Example Formulas

### Basic Calculations
```javascript
// Full name
CONCAT([firstName], " ", [lastName])

// Total with tax
SUM([price], [tax])

// Average score
AVG([score1], [score2], [score3])
```

### Conditional Logic
```javascript
// Grade based on score
IF([score] >= 90, "A", IF([score] >= 80, "B", IF([score] >= 70, "C", "F")))

// Active status
IF(AND([verified], [email]), "Active", "Inactive")

// First available contact
COALESCE([mobile], [phone], [workPhone], "No phone")
```

### AI Enrichment
```javascript
// Detect company industry
AI_DETECT_COMPANY([company])

// Complete missing email
IF(ISEMPTY([email]), AI_COMPLETE_EMAIL([firstName], [lastName], AI_EXTRACT_DOMAIN([company])), [email])

// Lead quality score
AI_LEAD_SCORE([leadData])

// Clean and format phone
AI_CLEAN_PHONE([phone])
```

## API Usage

### Validate Formula
```typescript
POST /api/formulas/validate
{
  "formula": "SUM([price], [tax])"
}
```

### Evaluate Formula
```typescript
POST /api/formulas/evaluate
{
  "formula": "CONCAT([firstName], ' ', [lastName])",
  "context": {
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

### Create Calculated Column
```typescript
POST /api/calculated-columns
{
  "column_name": "Full Name",
  "formula": "CONCAT([firstName], ' ', [lastName])",
  "formula_type": "calculation",
  "result_type": "text",
  "cache_duration": 3600
}
```

### Evaluate Column for Lead
```typescript
POST /api/calculated-columns/{columnId}/evaluate
{
  "leadId": "uuid",
  "leadData": {
    "firstName": "John",
    "lastName": "Doe"
  },
  "forceRefresh": false
}
```

## Programmatic Usage

```typescript
import { evaluateFormula, validateFormula } from '@/lib/formula-engine'

// Validate
const validation = validateFormula('SUM([a], [b])')
console.log(validation) // { valid: true }

// Evaluate
const result = await evaluateFormula(
  'CONCAT([firstName], " ", [lastName])',
  { firstName: 'John', lastName: 'Doe' }
)
console.log(result) // "John Doe"
```

## Caching

Results are automatically cached based on the `cache_duration` setting:
- Set to `null` for no caching
- Set to seconds for cache duration (e.g., 3600 for 1 hour)
- Cached results are stored in the `calculated_results` table
- AI enrichment responses are cached separately in `ai_enrichment_cache`

## Database Schema

See `DATABASE_SCHEMA.md` for the complete schema including:
- `calculated_columns` - Formula definitions
- `calculated_results` - Cached formula results
- `ai_enrichment_cache` - AI enrichment cache
