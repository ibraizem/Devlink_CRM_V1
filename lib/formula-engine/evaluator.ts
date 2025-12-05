import { ASTNode, FormulaParser } from './parser'
import { BUILTIN_FUNCTIONS } from './functions'
import { AI_FUNCTIONS } from './ai-functions'

const ALL_FUNCTIONS = {
  ...BUILTIN_FUNCTIONS,
  ...AI_FUNCTIONS
}

export class FormulaEvaluator {
  private parser: FormulaParser
  private context: Record<string, any>

  constructor(context: Record<string, any> = {}) {
    this.parser = new FormulaParser()
    this.context = context
  }

  async evaluate(formula: string): Promise<any> {
    const ast = this.parser.parse(formula)
    return this.evaluateNode(ast)
  }

  private async evaluateNode(node: ASTNode): Promise<any> {
    switch (node.type) {
      case 'literal':
        return node.value

      case 'field':
        if (!node.name) throw new Error('Field name is missing')
        return this.context[node.name] ?? null

      case 'function':
        return this.evaluateFunction(node)

      case 'binary':
        return this.evaluateBinary(node)

      case 'unary':
        return this.evaluateUnary(node)

      default:
        throw new Error(`Unknown node type: ${node.type}`)
    }
  }

  private async evaluateFunction(node: ASTNode): Promise<any> {
    if (!node.name) throw new Error('Function name is missing')
    if (!node.args) throw new Error('Function args are missing')

    const funcName = node.name.toUpperCase()
    const func = ALL_FUNCTIONS[funcName]

    if (!func) {
      throw new Error(`Unknown function: ${node.name}`)
    }

    const args = await Promise.all(node.args.map(arg => this.evaluateNode(arg)))
    return func(args, this.context)
  }

  private async evaluateBinary(node: ASTNode): Promise<any> {
    if (!node.left || !node.right || !node.operator) {
      throw new Error('Invalid binary operation')
    }

    const left = await this.evaluateNode(node.left)
    const right = await this.evaluateNode(node.right)

    switch (node.operator) {
      case '+':
        return Number(left) + Number(right)
      case '-':
        return Number(left) - Number(right)
      case '*':
        return Number(left) * Number(right)
      case '/':
        if (Number(right) === 0) throw new Error('Division by zero')
        return Number(left) / Number(right)
      case '>':
        return left > right
      case '<':
        return left < right
      case '>=':
        return left >= right
      case '<=':
        return left <= right
      case '==':
        return left == right
      case '!=':
        return left != right
      default:
        throw new Error(`Unknown operator: ${node.operator}`)
    }
  }

  private async evaluateUnary(node: ASTNode): Promise<any> {
    if (!node.operand || !node.operator) {
      throw new Error('Invalid unary operation')
    }

    const operand = await this.evaluateNode(node.operand)

    switch (node.operator) {
      case '+':
        return +operand
      case '-':
        return -Number(operand)
      case '!':
        return !operand
      default:
        throw new Error(`Unknown unary operator: ${node.operator}`)
    }
  }
}

export async function evaluateFormula(
  formula: string,
  context: Record<string, any> = {}
): Promise<any> {
  const evaluator = new FormulaEvaluator(context)
  return evaluator.evaluate(formula)
}

export function validateFormula(formula: string): { valid: boolean; error?: string } {
  try {
    const parser = new FormulaParser()
    parser.parse(formula)
    return { valid: true }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
