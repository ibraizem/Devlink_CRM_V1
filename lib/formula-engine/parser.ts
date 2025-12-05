export type TokenType = 
  | 'NUMBER'
  | 'STRING'
  | 'IDENTIFIER'
  | 'FUNCTION'
  | 'OPERATOR'
  | 'LPAREN'
  | 'RPAREN'
  | 'COMMA'
  | 'FIELD'
  | 'EOF'

export interface Token {
  type: TokenType
  value: string | number
  position: number
}

export interface ASTNode {
  type: 'literal' | 'field' | 'function' | 'binary' | 'unary'
  value?: string | number | boolean
  name?: string
  args?: ASTNode[]
  operator?: string
  left?: ASTNode
  right?: ASTNode
  operand?: ASTNode
}

export class FormulaParser {
  private tokens: Token[] = []
  private current = 0

  parse(formula: string): ASTNode {
    this.tokens = this.tokenize(formula)
    this.current = 0
    return this.parseExpression()
  }

  private tokenize(formula: string): Token[] {
    const tokens: Token[] = []
    let position = 0

    while (position < formula.length) {
      const char = formula[position]

      if (/\s/.test(char)) {
        position++
        continue
      }

      if (char === '(') {
        tokens.push({ type: 'LPAREN', value: '(', position })
        position++
        continue
      }

      if (char === ')') {
        tokens.push({ type: 'RPAREN', value: ')', position })
        position++
        continue
      }

      if (char === ',') {
        tokens.push({ type: 'COMMA', value: ',', position })
        position++
        continue
      }

      if (['+', '-', '*', '/', '>', '<', '=', '!'].includes(char)) {
        let operator = char
        position++
        if (position < formula.length && formula[position] === '=') {
          operator += '='
          position++
        }
        tokens.push({ type: 'OPERATOR', value: operator, position })
        continue
      }

      if (char === '"' || char === "'") {
        const quote = char
        position++
        let str = ''
        while (position < formula.length && formula[position] !== quote) {
          if (formula[position] === '\\' && position + 1 < formula.length) {
            position++
            str += formula[position]
          } else {
            str += formula[position]
          }
          position++
        }
        position++
        tokens.push({ type: 'STRING', value: str, position })
        continue
      }

      if (char === '[') {
        position++
        let fieldName = ''
        while (position < formula.length && formula[position] !== ']') {
          fieldName += formula[position]
          position++
        }
        position++
        tokens.push({ type: 'FIELD', value: fieldName, position })
        continue
      }

      if (/\d/.test(char)) {
        let num = ''
        while (position < formula.length && /[\d.]/.test(formula[position])) {
          num += formula[position]
          position++
        }
        tokens.push({ type: 'NUMBER', value: parseFloat(num), position })
        continue
      }

      if (/[a-zA-Z_]/.test(char)) {
        let ident = ''
        while (position < formula.length && /[a-zA-Z0-9_]/.test(formula[position])) {
          ident += formula[position]
          position++
        }

        while (position < formula.length && /\s/.test(formula[position])) {
          position++
        }

        if (position < formula.length && formula[position] === '(') {
          tokens.push({ type: 'FUNCTION', value: ident, position })
        } else {
          tokens.push({ type: 'IDENTIFIER', value: ident, position })
        }
        continue
      }

      throw new Error(`Unexpected character '${char}' at position ${position}`)
    }

    tokens.push({ type: 'EOF', value: '', position })
    return tokens
  }

  private parseExpression(): ASTNode {
    return this.parseComparison()
  }

  private parseComparison(): ASTNode {
    let left = this.parseAdditive()

    while (this.match('OPERATOR') && ['>', '<', '>=', '<=', '==', '!=', '='].includes(String(this.peek().value))) {
      const operator = String(this.advance().value)
      const right = this.parseAdditive()
      left = {
        type: 'binary',
        operator: operator === '=' ? '==' : operator,
        left,
        right
      }
    }

    return left
  }

  private parseAdditive(): ASTNode {
    let left = this.parseMultiplicative()

    while (this.match('OPERATOR') && ['+', '-'].includes(String(this.peek().value))) {
      const operator = String(this.advance().value)
      const right = this.parseMultiplicative()
      left = {
        type: 'binary',
        operator,
        left,
        right
      }
    }

    return left
  }

  private parseMultiplicative(): ASTNode {
    let left = this.parseUnary()

    while (this.match('OPERATOR') && ['*', '/'].includes(String(this.peek().value))) {
      const operator = String(this.advance().value)
      const right = this.parseUnary()
      left = {
        type: 'binary',
        operator,
        left,
        right
      }
    }

    return left
  }

  private parseUnary(): ASTNode {
    if (this.match('OPERATOR') && ['+', '-', '!'].includes(String(this.peek().value))) {
      const operator = String(this.advance().value)
      const operand = this.parseUnary()
      return {
        type: 'unary',
        operator,
        operand
      }
    }

    return this.parsePrimary()
  }

  private parsePrimary(): ASTNode {
    if (this.match('NUMBER')) {
      return { type: 'literal', value: this.advance().value as number }
    }

    if (this.match('STRING')) {
      return { type: 'literal', value: this.advance().value as string }
    }

    if (this.match('IDENTIFIER')) {
      const value = String(this.advance().value)
      if (value === 'true' || value === 'false') {
        return { type: 'literal', value: value === 'true' }
      }
      return { type: 'literal', value }
    }

    if (this.match('FIELD')) {
      return { type: 'field', name: String(this.advance().value) }
    }

    if (this.match('FUNCTION')) {
      const name = String(this.advance().value)
      this.consume('LPAREN', `Expected '(' after function name '${name}'`)
      
      const args: ASTNode[] = []
      if (!this.match('RPAREN')) {
        do {
          args.push(this.parseExpression())
        } while (this.matchAndConsume('COMMA'))
      }
      
      this.consume('RPAREN', `Expected ')' after function arguments`)
      
      return { type: 'function', name, args }
    }

    if (this.matchAndConsume('LPAREN')) {
      const expr = this.parseExpression()
      this.consume('RPAREN', `Expected ')' after expression`)
      return expr
    }

    throw new Error(`Unexpected token '${this.peek().value}' at position ${this.peek().position}`)
  }

  private match(type: TokenType): boolean {
    return this.peek().type === type
  }

  private matchAndConsume(type: TokenType): boolean {
    if (this.match(type)) {
      this.advance()
      return true
    }
    return false
  }

  private peek(): Token {
    return this.tokens[this.current]
  }

  private advance(): Token {
    const token = this.tokens[this.current]
    if (token.type !== 'EOF') {
      this.current++
    }
    return token
  }

  private consume(type: TokenType, message: string): Token {
    if (this.peek().type === type) {
      return this.advance()
    }
    throw new Error(`${message}. Got '${this.peek().value}' at position ${this.peek().position}`)
  }
}
