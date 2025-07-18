export interface Todo {
  id: string
  text: string
  completed: boolean
  createdAt: Date
}

export interface TodosByDate {
  [date: string]: Todo[]
}

const TODOS_KEY = 'todos'

export function getTodos(): TodosByDate {
  if (typeof window === 'undefined') return {}
  
  const stored = localStorage.getItem(TODOS_KEY)
  if (!stored) return {}
  
  const parsed = JSON.parse(stored)
  
  // Convert date strings back to Date objects
  Object.keys(parsed).forEach(date => {
    parsed[date] = parsed[date].map((todo: any) => ({
      ...todo,
      createdAt: new Date(todo.createdAt)
    }))
  })
  
  return parsed
}

export function saveTodos(todos: TodosByDate): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(TODOS_KEY, JSON.stringify(todos))
}

export function addTodo(text: string): void {
  const todos = getTodos()
  const today = new Date().toISOString().split('T')[0]
  
  const newTodo: Todo = {
    id: crypto.randomUUID(),
    text,
    completed: false,
    createdAt: new Date()
  }
  
  if (!todos[today]) {
    todos[today] = []
  }
  
  todos[today].push(newTodo)
  saveTodos(todos)
}

export function toggleTodo(date: string, todoId: string): void {
  const todos = getTodos()
  
  if (todos[date]) {
    const todo = todos[date].find(t => t.id === todoId)
    if (todo) {
      todo.completed = !todo.completed
      saveTodos(todos)
    }
  }
}

export function getTodosForDate(date: string): Todo[] {
  const todos = getTodos()
  return todos[date] || []
}

export function getTodoStats(date: string): { completed: number; total: number } {
  const todos = getTodosForDate(date)
  return {
    completed: todos.filter(t => t.completed).length,
    total: todos.length
  }
}

export function formatDate(date: string): string {
  return new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  })
}