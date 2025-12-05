/**
 * Formula Engine Test Suite
 * 
 * These tests verify the core functionality of the formula engine.
 * Run these tests to ensure the formula engine is working correctly.
 * 
 * Note: This file is for documentation and manual testing.
 * To use as automated tests, integrate with your testing framework.
 */

import { evaluateFormula, validateFormula } from '../evaluator'

// Test data context
const testContext = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '+1-555-0100',
  company: 'Acme Tech Solutions',
  score: 85,
  price: 100,
  tax: 20,
  age: 30,
  verified: true,
  active: false,
  notes: 'Great potential lead',
  lastContact: '2024-01-01T00:00:00Z',
  score1: 80,
  score2: 90,
  score3: 75
}

// Test Suite
const tests = [
  // Math Functions
  {
    name: 'SUM - Add numbers',
    formula: 'SUM([price], [tax])',
    expected: 120
  },
  {
    name: 'AVG - Average of scores',
    formula: 'AVG([score1], [score2], [score3])',
    expected: 81.67 // approximately
  },
  {
    name: 'COUNT - Count non-empty values',
    formula: 'COUNT([firstName], [lastName], [email])',
    expected: 3
  },
  {
    name: 'ROUND - Round number',
    formula: 'ROUND([price] / 3, 2)',
    expected: 33.33
  },
  {
    name: 'MAX - Maximum value',
    formula: 'MAX([score1], [score2], [score3])',
    expected: 90
  },

  // Text Functions
  {
    name: 'CONCAT - Concatenate strings',
    formula: 'CONCAT([firstName], " ", [lastName])',
    expected: 'John Doe'
  },
  {
    name: 'UPPER - Uppercase',
    formula: 'UPPER([firstName])',
    expected: 'JOHN'
  },
  {
    name: 'LOWER - Lowercase',
    formula: 'LOWER([lastName])',
    expected: 'doe'
  },
  {
    name: 'TRIM - Trim whitespace',
    formula: 'TRIM("  hello  ")',
    expected: 'hello'
  },
  {
    name: 'LEN - String length',
    formula: 'LEN([firstName])',
    expected: 4
  },
  {
    name: 'LEFT - Left substring',
    formula: 'LEFT([firstName], 2)',
    expected: 'Jo'
  },
  {
    name: 'RIGHT - Right substring',
    formula: 'RIGHT([lastName], 2)',
    expected: 'oe'
  },

  // Logic Functions
  {
    name: 'IF - Simple condition',
    formula: 'IF([score] > 80, "Pass", "Fail")',
    expected: 'Pass'
  },
  {
    name: 'IF - Nested conditions',
    formula: 'IF([score] >= 90, "A", IF([score] >= 80, "B", "C"))',
    expected: 'B'
  },
  {
    name: 'AND - Logical AND',
    formula: 'AND([verified], [score] > 80)',
    expected: true
  },
  {
    name: 'OR - Logical OR',
    formula: 'OR([active], [verified])',
    expected: true
  },
  {
    name: 'NOT - Logical NOT',
    formula: 'NOT([active])',
    expected: true
  },
  {
    name: 'ISEMPTY - Check empty',
    formula: 'ISEMPTY([firstName])',
    expected: false
  },
  {
    name: 'ISNUMBER - Check number',
    formula: 'ISNUMBER([age])',
    expected: true
  },
  {
    name: 'COALESCE - First non-null',
    formula: 'COALESCE([missing], [firstName])',
    expected: 'John'
  },

  // Arithmetic Operators
  {
    name: 'Addition',
    formula: '[price] + [tax]',
    expected: 120
  },
  {
    name: 'Subtraction',
    formula: '[price] - [tax]',
    expected: 80
  },
  {
    name: 'Multiplication',
    formula: '[price] * 2',
    expected: 200
  },
  {
    name: 'Division',
    formula: '[price] / 4',
    expected: 25
  },

  // Comparison Operators
  {
    name: 'Greater than',
    formula: '[score] > 80',
    expected: true
  },
  {
    name: 'Less than',
    formula: '[age] < 40',
    expected: true
  },
  {
    name: 'Greater than or equal',
    formula: '[score] >= 85',
    expected: true
  },
  {
    name: 'Less than or equal',
    formula: '[age] <= 30',
    expected: true
  },
  {
    name: 'Equal',
    formula: '[firstName] == "John"',
    expected: true
  },
  {
    name: 'Not equal',
    formula: '[lastName] != "Smith"',
    expected: true
  },

  // Complex Expressions
  {
    name: 'Complex calculation',
    formula: '([price] + [tax]) * 1.1',
    expected: 132
  },
  {
    name: 'Nested functions',
    formula: 'UPPER(CONCAT([firstName], " ", [lastName]))',
    expected: 'JOHN DOE'
  },
  {
    name: 'Complex condition',
    formula: 'IF(AND([verified], [score] > 80), CONCAT("VIP: ", [firstName]), [firstName])',
    expected: 'VIP: John'
  },

  // Edge Cases
  {
    name: 'Empty string',
    formula: 'CONCAT("", [firstName])',
    expected: 'John'
  },
  {
    name: 'Zero division protection',
    formula: 'IF([tax] > 0, [price] / [tax], 0)',
    expected: 5
  },
  {
    name: 'Null handling',
    formula: 'COALESCE([missing], "default")',
    expected: 'default'
  }
]

// Validation Tests
const validationTests = [
  {
    name: 'Valid formula - simple',
    formula: 'CONCAT([firstName], " ", [lastName])',
    shouldBeValid: true
  },
  {
    name: 'Valid formula - complex',
    formula: 'IF(SUM([a], [b]) > 100, "High", "Low")',
    shouldBeValid: true
  },
  {
    name: 'Invalid formula - syntax error',
    formula: 'CONCAT([firstName, [lastName])',
    shouldBeValid: false
  },
  {
    name: 'Invalid formula - unknown function',
    formula: 'INVALID_FUNCTION([field])',
    shouldBeValid: false
  },
  {
    name: 'Invalid formula - unmatched parenthesis',
    formula: 'SUM([a], [b]',
    shouldBeValid: false
  }
]

// Run Tests
export async function runFormulaTests() {
  console.log('🧪 Running Formula Engine Tests...\n')

  let passed = 0
  let failed = 0

  // Evaluation Tests
  console.log('📊 EVALUATION TESTS\n')
  for (const test of tests) {
    try {
      const result = await evaluateFormula(test.formula, testContext)
      const isApproximate = typeof test.expected === 'number' && typeof result === 'number'
      const success = isApproximate
        ? Math.abs(result - test.expected) < 0.01
        : result === test.expected

      if (success) {
        console.log(`✅ ${test.name}`)
        console.log(`   Formula: ${test.formula}`)
        console.log(`   Result: ${result}\n`)
        passed++
      } else {
        console.log(`❌ ${test.name}`)
        console.log(`   Formula: ${test.formula}`)
        console.log(`   Expected: ${test.expected}`)
        console.log(`   Got: ${result}\n`)
        failed++
      }
    } catch (error) {
      console.log(`❌ ${test.name}`)
      console.log(`   Formula: ${test.formula}`)
      console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`)
      failed++
    }
  }

  // Validation Tests
  console.log('\n✅ VALIDATION TESTS\n')
  for (const test of validationTests) {
    try {
      const validation = validateFormula(test.formula)
      const success = validation.valid === test.shouldBeValid

      if (success) {
        console.log(`✅ ${test.name}`)
        console.log(`   Formula: ${test.formula}`)
        console.log(`   Valid: ${validation.valid}\n`)
        passed++
      } else {
        console.log(`❌ ${test.name}`)
        console.log(`   Formula: ${test.formula}`)
        console.log(`   Expected valid: ${test.shouldBeValid}`)
        console.log(`   Got valid: ${validation.valid}`)
        if (validation.error) {
          console.log(`   Error: ${validation.error}`)
        }
        console.log()
        failed++
      }
    } catch (error) {
      console.log(`❌ ${test.name}`)
      console.log(`   Formula: ${test.formula}`)
      console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`)
      failed++
    }
  }

  // Summary
  console.log('\n📈 TEST SUMMARY\n')
  console.log(`Total Tests: ${passed + failed}`)
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`)

  return { passed, failed }
}

// Export for manual testing
export { tests, validationTests, testContext }
