'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, X, Sparkles, Calculator, Database } from 'lucide-react'

interface FormulaEditorProps {
  initialFormula?: string
  initialColumnName?: string
  initialFormulaType?: 'calculation' | 'ai_enrichment'
  initialResultType?: 'text' | 'number' | 'boolean'
  onSave: (data: {
    column_name: string
    formula: string
    formula_type: 'calculation' | 'ai_enrichment'
    result_type: 'text' | 'number' | 'boolean'
    cache_duration: number | null
  }) => void
  onCancel: () => void
}

const FUNCTION_CATEGORIES = {
  Math: [
    { name: 'SUM', desc: 'Sum of numbers', example: 'SUM([price], [tax])' },
    { name: 'AVG', desc: 'Average of numbers', example: 'AVG([score1], [score2])' },
    { name: 'COUNT', desc: 'Count non-empty values', example: 'COUNT([field1], [field2])' },
    { name: 'MIN', desc: 'Minimum value', example: 'MIN([price1], [price2])' },
    { name: 'MAX', desc: 'Maximum value', example: 'MAX([price1], [price2])' },
    { name: 'ROUND', desc: 'Round number', example: 'ROUND([price], 2)' },
    { name: 'ABS', desc: 'Absolute value', example: 'ABS([balance])' }
  ],
  Text: [
    { name: 'CONCAT', desc: 'Concatenate strings', example: 'CONCAT([firstName], " ", [lastName])' },
    { name: 'UPPER', desc: 'Convert to uppercase', example: 'UPPER([name])' },
    { name: 'LOWER', desc: 'Convert to lowercase', example: 'LOWER([email])' },
    { name: 'TRIM', desc: 'Remove whitespace', example: 'TRIM([name])' },
    { name: 'LEN', desc: 'String length', example: 'LEN([description])' },
    { name: 'LEFT', desc: 'Left substring', example: 'LEFT([text], 10)' },
    { name: 'RIGHT', desc: 'Right substring', example: 'RIGHT([text], 5)' },
    { name: 'REPLACE', desc: 'Replace text', example: 'REPLACE([text], "old", "new")' }
  ],
  Logic: [
    { name: 'IF', desc: 'Conditional logic', example: 'IF([score] > 80, "Pass", "Fail")' },
    { name: 'AND', desc: 'Logical AND', example: 'AND([active], [verified])' },
    { name: 'OR', desc: 'Logical OR', example: 'OR([email], [phone])' },
    { name: 'NOT', desc: 'Logical NOT', example: 'NOT([deleted])' },
    { name: 'ISEMPTY', desc: 'Check if empty', example: 'ISEMPTY([email])' },
    { name: 'ISNUMBER', desc: 'Check if number', example: 'ISNUMBER([value])' },
    { name: 'COALESCE', desc: 'First non-null value', example: 'COALESCE([email], [backup_email])' }
  ],
  Date: [
    { name: 'NOW', desc: 'Current date/time', example: 'NOW()' },
    { name: 'TODAY', desc: 'Current date', example: 'TODAY()' },
    { name: 'YEAR', desc: 'Extract year', example: 'YEAR([date])' },
    { name: 'MONTH', desc: 'Extract month', example: 'MONTH([date])' },
    { name: 'DAY', desc: 'Extract day', example: 'DAY([date])' },
    { name: 'DATEADD', desc: 'Add to date', example: 'DATEADD([date], 7, "days")' },
    { name: 'DATEDIFF', desc: 'Date difference', example: 'DATEDIFF([start], [end], "days")' }
  ],
  AI: [
    { name: 'AI_DETECT_COMPANY', desc: 'Detect company industry', example: 'AI_DETECT_COMPANY([company])' },
    { name: 'AI_COMPANY_SIZE', desc: 'Detect company size', example: 'AI_COMPANY_SIZE([company])' },
    { name: 'AI_COMPLETE_EMAIL', desc: 'Complete email address', example: 'AI_COMPLETE_EMAIL([firstName], [lastName], [domain])' },
    { name: 'AI_COMPLETE_PHONE', desc: 'Complete phone number', example: 'AI_COMPLETE_PHONE([firstName], [lastName], [company])' },
    { name: 'AI_LEAD_SCORE', desc: 'Score lead quality', example: 'AI_LEAD_SCORE([leadData])' },
    { name: 'AI_EXTRACT_DOMAIN', desc: 'Extract domain from email', example: 'AI_EXTRACT_DOMAIN([email])' },
    { name: 'AI_CLEAN_PHONE', desc: 'Clean phone number', example: 'AI_CLEAN_PHONE([phone])' },
    { name: 'AI_FORMAT_NAME', desc: 'Format name properly', example: 'AI_FORMAT_NAME([name])' },
    { name: 'AI_PREDICT_INDUSTRY', desc: 'Predict industry', example: 'AI_PREDICT_INDUSTRY([description])' },
    { name: 'AI_SENTIMENT', desc: 'Analyze sentiment', example: 'AI_SENTIMENT([note])' }
  ]
}

export default function FormulaEditor({
  initialFormula = '',
  initialColumnName = '',
  initialFormulaType = 'calculation',
  initialResultType = 'text',
  onSave,
  onCancel
}: FormulaEditorProps) {
  const [columnName, setColumnName] = useState(initialColumnName)
  const [formula, setFormula] = useState(initialFormula)
  const [formulaType, setFormulaType] = useState(initialFormulaType)
  const [resultType, setResultType] = useState(initialResultType)
  const [cacheDuration, setCacheDuration] = useState<number | null>(3600)
  const [validation, setValidation] = useState<{ valid: boolean; error?: string } | null>(null)
  const [isValidating, setIsValidating] = useState(false)

  useEffect(() => {
    if (formula) {
      validateFormula()
    }
  }, [formula])

  const validateFormula = async () => {
    if (!formula.trim()) {
      setValidation(null)
      return
    }

    setIsValidating(true)
    try {
      const response = await fetch('/api/formulas/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formula })
      })

      const result = await response.json()
      setValidation(result)
    } catch (error) {
      setValidation({ valid: false, error: 'Validation failed' })
    } finally {
      setIsValidating(false)
    }
  }

  const insertFunction = (funcName: string) => {
    setFormula(prev => prev + funcName + '()')
  }

  const insertField = (fieldName: string) => {
    setFormula(prev => prev + `[${fieldName}]`)
  }

  const handleSave = () => {
    if (!columnName.trim() || !formula.trim()) {
      return
    }

    onSave({
      column_name: columnName,
      formula,
      formula_type: formulaType,
      result_type: resultType,
      cache_duration: cacheDuration
    })
  }

  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-2 gap-4'>
        <div className='space-y-2'>
          <Label htmlFor='columnName'>Column Name</Label>
          <Input
            id='columnName'
            value={columnName}
            onChange={(e) => setColumnName(e.target.value)}
            placeholder='e.g., Full Name, Lead Score'
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='formulaType'>Formula Type</Label>
          <Select value={formulaType} onValueChange={(v) => setFormulaType(v as any)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='calculation'>
                <div className='flex items-center gap-2'>
                  <Calculator className='h-4 w-4' />
                  Calculation
                </div>
              </SelectItem>
              <SelectItem value='ai_enrichment'>
                <div className='flex items-center gap-2'>
                  <Sparkles className='h-4 w-4' />
                  AI Enrichment
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='resultType'>Result Type</Label>
          <Select value={resultType} onValueChange={(v) => setResultType(v as any)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='text'>Text</SelectItem>
              <SelectItem value='number'>Number</SelectItem>
              <SelectItem value='boolean'>Boolean</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='cacheDuration'>Cache Duration (seconds)</Label>
          <Input
            id='cacheDuration'
            type='number'
            value={cacheDuration ?? ''}
            onChange={(e) => setCacheDuration(e.target.value ? parseInt(e.target.value) : null)}
            placeholder='3600'
          />
        </div>
      </div>

      <div className='space-y-2'>
        <div className='flex items-center justify-between'>
          <Label htmlFor='formula'>Formula</Label>
          {validation && (
            <Badge variant={validation.valid ? 'default' : 'destructive'} className='ml-2'>
              {validation.valid ? (
                <><Check className='h-3 w-3 mr-1' /> Valid</>
              ) : (
                <><X className='h-3 w-3 mr-1' /> Invalid</>
              )}
            </Badge>
          )}
        </div>
        <Textarea
          id='formula'
          value={formula}
          onChange={(e) => setFormula(e.target.value)}
          placeholder='e.g., CONCAT([firstName], " ", [lastName])'
          className='font-mono text-sm h-32'
        />
        {validation && !validation.valid && validation.error && (
          <p className='text-sm text-red-500'>{validation.error}</p>
        )}
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {Object.entries(FUNCTION_CATEGORIES).map(([category, functions]) => (
          <Card key={category}>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm font-medium flex items-center gap-2'>
                {category === 'AI' ? <Sparkles className='h-4 w-4' /> : <Database className='h-4 w-4' />}
                {category} Functions
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-2'>
              {functions.map((func) => (
                <div
                  key={func.name}
                  className='flex items-start gap-2 p-2 rounded hover:bg-accent cursor-pointer transition-colors'
                  onClick={() => insertFunction(func.name)}
                >
                  <div className='flex-1'>
                    <div className='font-mono text-sm font-medium'>{func.name}</div>
                    <div className='text-xs text-muted-foreground'>{func.desc}</div>
                    <div className='text-xs text-muted-foreground font-mono mt-1'>{func.example}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className='flex justify-end gap-2'>
        <Button variant='outline' onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={!columnName.trim() || !formula.trim() || (validation && !validation.valid)}
        >
          Save Column
        </Button>
      </div>
    </div>
  )
}
