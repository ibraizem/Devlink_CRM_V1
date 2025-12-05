import { ASTNode } from './parser'

export type FormulaFunction = (args: any[], context: Record<string, any>) => Promise<any>

export const BUILTIN_FUNCTIONS: Record<string, FormulaFunction> = {
  SUM: async (args: any[]) => {
    const numbers = args.flat().filter(v => typeof v === 'number')
    return numbers.reduce((sum, n) => sum + n, 0)
  },

  AVG: async (args: any[]) => {
    const numbers = args.flat().filter(v => typeof v === 'number')
    if (numbers.length === 0) return 0
    return numbers.reduce((sum, n) => sum + n, 0) / numbers.length
  },

  COUNT: async (args: any[]) => {
    return args.flat().filter(v => v != null && v !== '').length
  },

  MIN: async (args: any[]) => {
    const numbers = args.flat().filter(v => typeof v === 'number')
    if (numbers.length === 0) return null
    return Math.min(...numbers)
  },

  MAX: async (args: any[]) => {
    const numbers = args.flat().filter(v => typeof v === 'number')
    if (numbers.length === 0) return null
    return Math.max(...numbers)
  },

  CONCAT: async (args: any[]) => {
    return args.flat().map(v => String(v ?? '')).join('')
  },

  UPPER: async (args: any[]) => {
    return String(args[0] ?? '').toUpperCase()
  },

  LOWER: async (args: any[]) => {
    return String(args[0] ?? '').toLowerCase()
  },

  TRIM: async (args: any[]) => {
    return String(args[0] ?? '').trim()
  },

  LEN: async (args: any[]) => {
    return String(args[0] ?? '').length
  },

  LEFT: async (args: any[]) => {
    const str = String(args[0] ?? '')
    const len = Number(args[1] ?? 0)
    return str.substring(0, len)
  },

  RIGHT: async (args: any[]) => {
    const str = String(args[0] ?? '')
    const len = Number(args[1] ?? 0)
    return str.substring(str.length - len)
  },

  MID: async (args: any[]) => {
    const str = String(args[0] ?? '')
    const start = Number(args[1] ?? 0)
    const len = Number(args[2] ?? str.length)
    return str.substring(start, start + len)
  },

  REPLACE: async (args: any[]) => {
    const str = String(args[0] ?? '')
    const search = String(args[1] ?? '')
    const replacement = String(args[2] ?? '')
    return str.replace(new RegExp(search, 'g'), replacement)
  },

  IF: async (args: any[]) => {
    const condition = Boolean(args[0])
    return condition ? args[1] : args[2]
  },

  AND: async (args: any[]) => {
    return args.every(v => Boolean(v))
  },

  OR: async (args: any[]) => {
    return args.some(v => Boolean(v))
  },

  NOT: async (args: any[]) => {
    return !Boolean(args[0])
  },

  ISEMPTY: async (args: any[]) => {
    const val = args[0]
    return val == null || val === ''
  },

  ISNUMBER: async (args: any[]) => {
    return typeof args[0] === 'number' && !isNaN(args[0])
  },

  ROUND: async (args: any[]) => {
    const num = Number(args[0] ?? 0)
    const decimals = Number(args[1] ?? 0)
    return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals)
  },

  ABS: async (args: any[]) => {
    return Math.abs(Number(args[0] ?? 0))
  },

  COALESCE: async (args: any[]) => {
    for (const arg of args) {
      if (arg != null && arg !== '') {
        return arg
      }
    }
    return null
  },

  NOW: async () => {
    return new Date().toISOString()
  },

  TODAY: async () => {
    return new Date().toISOString().split('T')[0]
  },

  YEAR: async (args: any[]) => {
    const date = new Date(args[0])
    return date.getFullYear()
  },

  MONTH: async (args: any[]) => {
    const date = new Date(args[0])
    return date.getMonth() + 1
  },

  DAY: async (args: any[]) => {
    const date = new Date(args[0])
    return date.getDate()
  },

  DATEADD: async (args: any[]) => {
    const date = new Date(args[0])
    const amount = Number(args[1] ?? 0)
    const unit = String(args[2] ?? 'days').toLowerCase()
    
    switch (unit) {
      case 'days':
        date.setDate(date.getDate() + amount)
        break
      case 'months':
        date.setMonth(date.getMonth() + amount)
        break
      case 'years':
        date.setFullYear(date.getFullYear() + amount)
        break
    }
    
    return date.toISOString()
  },

  DATEDIFF: async (args: any[]) => {
    const date1 = new Date(args[0])
    const date2 = new Date(args[1])
    const unit = String(args[2] ?? 'days').toLowerCase()
    
    const diff = date2.getTime() - date1.getTime()
    
    switch (unit) {
      case 'days':
        return Math.floor(diff / (1000 * 60 * 60 * 24))
      case 'hours':
        return Math.floor(diff / (1000 * 60 * 60))
      case 'minutes':
        return Math.floor(diff / (1000 * 60))
      default:
        return diff
    }
  }
}
