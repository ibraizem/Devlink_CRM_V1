# Formula Examples

This document provides practical examples of formulas you can create in the DevLink CRM Formula Engine.

## Basic Field Manipulation

### Combine First and Last Name
```
CONCAT([firstName], " ", [lastName])
```
Result: "John Doe"

### Full Name with Title
```
CONCAT([title], " ", [firstName], " ", [lastName])
```
Result: "Mr. John Doe"

### Uppercase Company Name
```
UPPER([company])
```
Result: "ACME CORPORATION"

### Formatted Email
```
LOWER(TRIM([email]))
```
Result: "john.doe@example.com"

## Calculations

### Total Price with Tax
```
SUM([price], [tax], [shipping])
```

### Average of Multiple Scores
```
AVG([score1], [score2], [score3])
```

### Percentage Calculation
```
ROUND(([completed] / [total]) * 100, 2)
```
Result: 75.50

### Discount Price
```
[price] - ([price] * [discountPercent] / 100)
```

## Conditional Logic

### Lead Status Classification
```
IF([score] >= 80, "Hot", IF([score] >= 50, "Warm", "Cold"))
```

### Eligibility Check
```
IF(AND([age] >= 18, [verified], NOT(ISEMPTY([email]))), "Eligible", "Not Eligible")
```

### Priority Assignment
```
IF(OR([vip], [revenue] > 10000), "High", "Normal")
```

### Contact Preference
```
COALESCE([mobile], [phone], [workPhone], "No phone available")
```

## Data Cleaning

### Clean Phone Number
```
REPLACE(REPLACE(REPLACE([phone], "-", ""), " ", ""), "(", "")
```

### Extract First Name from Full Name
```
LEFT([fullName], LEN([fullName]) - LEN([lastName]) - 1)
```

### Trim and Title Case
```
CONCAT(
  UPPER(LEFT(TRIM([firstName]), 1)),
  LOWER(MID(TRIM([firstName]), 1, LEN([firstName])))
)
```

## Date Calculations

### Days Since Last Contact
```
DATEDIFF([lastContact], NOW(), "days")
```

### Follow-up Date (7 days from now)
```
DATEADD(NOW(), 7, "days")
```

### Year from Date
```
YEAR([createdAt])
```

### Age Calculation
```
YEAR(NOW()) - YEAR([birthDate])
```

## AI Enrichment Examples

### Auto-Detect Company Industry
```
AI_DETECT_COMPANY([company])
```
Result: "Technology", "Finance", "Healthcare", etc.

### Predict Company Size
```
AI_COMPANY_SIZE([company])
```
Result: "Enterprise", "Mid-Market", "Small Business"

### Complete Missing Email
```
IF(
  ISEMPTY([email]),
  AI_COMPLETE_EMAIL([firstName], [lastName], AI_EXTRACT_DOMAIN([company])),
  [email]
)
```

### Smart Phone Completion
```
IF(
  ISEMPTY([phone]),
  AI_COMPLETE_PHONE([firstName], [lastName], [company]),
  AI_CLEAN_PHONE([phone])
)
```

### Lead Quality Score
```
AI_LEAD_SCORE([leadData])
```
Result: 0-100 score

### Format Names Consistently
```
CONCAT(
  AI_FORMAT_NAME([firstName]),
  " ",
  AI_FORMAT_NAME([lastName])
)
```

### Extract Domain from Email
```
AI_EXTRACT_DOMAIN([email])
```
Result: "example.com"

### Industry Prediction from Description
```
AI_PREDICT_INDUSTRY([notes])
```
Result: "Technology", "Services", etc.

### Sentiment Analysis
```
AI_SENTIMENT([lastNote])
```
Result: "positive", "negative", "neutral"

## Advanced Combinations

### Comprehensive Lead Score
```
SUM(
  IF([email], 20, 0),
  IF([phone], 20, 0),
  IF([company], 15, 0),
  IF(NOT(ISEMPTY([title])), 15, 0),
  IF([verified], 30, 0)
)
```
Result: 0-100 score

### Smart Contact String
```
CONCAT(
  AI_FORMAT_NAME(CONCAT([firstName], " ", [lastName])),
  IF(NOT(ISEMPTY([title])), CONCAT(" - ", [title]), ""),
  IF(NOT(ISEMPTY([company])), CONCAT(" @ ", [company]), ""),
  IF(NOT(ISEMPTY([email])), CONCAT(" (", [email], ")"), "")
)
```
Result: "John Doe - CEO @ Acme Corp (john@acme.com)"

### Engagement Score
```
SUM(
  COUNT([callsMade]),
  COUNT([emailsSent]) * 0.5,
  IF([lastContact], ROUND(30 - DATEDIFF([lastContact], NOW(), "days"), 0), 0)
)
```

### Data Completeness Percentage
```
ROUND(
  (COUNT([email], [phone], [company], [title], [address]) / 5) * 100,
  0
)
```
Result: 0-100%

### Risk Flag
```
IF(
  OR(
    DATEDIFF([lastContact], NOW(), "days") > 90,
    [score] < 30,
    ISEMPTY([email])
  ),
  "At Risk",
  "Healthy"
)
```

## Industry-Specific Examples

### Real Estate Lead Score
```
SUM(
  IF([propertyBudget] > 500000, 30, 15),
  IF([preApproved], 25, 0),
  IF(DATEDIFF([readyToBuy], NOW(), "days") < 30, 25, 10),
  AI_LEAD_SCORE([leadData]) * 0.2
)
```

### SaaS Trial Status
```
IF(
  DATEDIFF([trialStartDate], NOW(), "days") > 14,
  "Expired",
  IF(
    DATEDIFF([trialStartDate], NOW(), "days") > 10,
    "Expiring Soon",
    "Active"
  )
)
```

### E-commerce Customer Segment
```
IF(
  [totalPurchases] > 10000,
  "VIP",
  IF(
    [totalPurchases] > 1000,
    "Frequent",
    IF(
      [totalPurchases] > 100,
      "Regular",
      "New"
    )
  )
)
```

## Validation Examples

### Email Format Check
```
IF(
  AND(
    NOT(ISEMPTY([email])),
    LEN([email]) > 5,
    [email] = LOWER([email])
  ),
  "Valid",
  "Invalid"
)
```

### Phone Number Validation
```
IF(
  LEN(AI_CLEAN_PHONE([phone])) >= 10,
  "Valid",
  "Invalid"
)
```

### Required Fields Check
```
IF(
  AND(
    NOT(ISEMPTY([firstName])),
    NOT(ISEMPTY([lastName])),
    NOT(ISEMPTY([email])),
    NOT(ISEMPTY([company]))
  ),
  "Complete",
  "Incomplete"
)
```

## Performance Optimization Tips

1. **Use caching for expensive operations**
   - Set appropriate `cache_duration` for AI functions
   - Default: 3600 seconds (1 hour)

2. **Minimize nested function calls**
   - Bad: `UPPER(TRIM(LOWER(CONCAT(...))))`
   - Better: Break into multiple calculated columns

3. **Use specific AI functions**
   - `AI_EXTRACT_DOMAIN` is faster than regex operations
   - `AI_CLEAN_PHONE` is optimized for phone numbers

4. **Leverage early returns**
   ```
   IF(ISEMPTY([email]), "No Email", 
     IF(NOT([verified]), "Unverified",
       "Valid"
     )
   )
   ```

## Testing Formulas

Before deploying formulas in production:

1. Test with sample data in the formula editor
2. Validate syntax using the validation endpoint
3. Check calculated values on a small subset of leads
4. Monitor performance with cache hit rates
5. Review error logs for edge cases

## Common Patterns

### NULL-Safe Concatenation
```
CONCAT(
  COALESCE([firstName], ""),
  IF(NOT(ISEMPTY([firstName])), " ", ""),
  COALESCE([lastName], "")
)
```

### Percentage with Division by Zero Protection
```
IF(
  [total] > 0,
  ROUND(([completed] / [total]) * 100, 2),
  0
)
```

### Multi-Level Scoring
```
ROUND(
  (
    IF([hasEmail], 0.3, 0) +
    IF([hasPhone], 0.2, 0) +
    IF([hasCompany], 0.2, 0) +
    IF([verified], 0.3, 0)
  ) * 100,
  0
)
```
