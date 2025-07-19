export interface Todo {
  id: string
  text: string
  completed: boolean
  createdAt: Date
}

export interface JournalEntry {
  id: string
  text: string
  createdAt: Date
}

export interface TodosByDate {
  [date: string]: Todo[]
}

export interface JournalByDate {
  [date: string]: JournalEntry[]
}

const TODOS_KEY = 'todos'
const JOURNAL_KEY = 'journal'

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

// Journal functions
export function getJournal(): JournalByDate {
  if (typeof window === 'undefined') return {}
  
  const stored = localStorage.getItem(JOURNAL_KEY)
  if (!stored) return {}
  
  const parsed = JSON.parse(stored)
  
  // Convert date strings back to Date objects
  Object.keys(parsed).forEach(date => {
    parsed[date] = parsed[date].map((entry: any) => ({
      ...entry,
      createdAt: new Date(entry.createdAt)
    }))
  })
  
  return parsed
}

export function saveJournal(journal: JournalByDate): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(JOURNAL_KEY, JSON.stringify(journal))
}

export function addJournalEntry(text: string): void {
  const journal = getJournal()
  const today = new Date().toISOString().split('T')[0]
  
  const newEntry: JournalEntry = {
    id: crypto.randomUUID(),
    text,
    createdAt: new Date()
  }
  
  if (!journal[today]) {
    journal[today] = []
  }
  
  journal[today].push(newEntry)
  saveJournal(journal)
}

export function getJournalForDate(date: string): JournalEntry[] {
  const journal = getJournal()
  return journal[date] || []
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

// Date utility functions that respect user timezone
export function getTodayDateString(): string {
  const now = new Date()
  return now.getFullYear() + '-' + 
         String(now.getMonth() + 1).padStart(2, '0') + '-' + 
         String(now.getDate()).padStart(2, '0')
}

export function getTomorrowDateString(): string {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow.getFullYear() + '-' + 
         String(tomorrow.getMonth() + 1).padStart(2, '0') + '-' + 
         String(tomorrow.getDate()).padStart(2, '0')
}

export function getDayAfterTomorrowDateString(): string {
  const dayAfter = new Date()
  dayAfter.setDate(dayAfter.getDate() + 2)
  return dayAfter.getFullYear() + '-' + 
         String(dayAfter.getMonth() + 1).padStart(2, '0') + '-' + 
         String(dayAfter.getDate()).padStart(2, '0')
}

export function getFutureDates(): string[] {
  return [getTodayDateString(), getTomorrowDateString(), getDayAfterTomorrowDateString()]
}

export function isDateInPast(dateString: string): boolean {
  const date = new Date(dateString + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date < today
}

export function isDaysTooOld(dateString: string, days: number): boolean {
  const date = new Date(dateString + 'T00:00:00')
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  cutoff.setHours(0, 0, 0, 0)
  return date < cutoff
}

export function canAddContentToDate(dateString: string): boolean {
  return !isDateInPast(dateString)
}

export function canToggleTodoOnDate(dateString: string): boolean {
  return !isDaysTooOld(dateString, 2) // Allow toggling for 2 days after the date
}

// Export/Import functions
export interface ExportData {
  version: string
  exportDate: string
  todos: TodosByDate
  journal: JournalByDate
}

export function exportAllData(): ExportData {
  return {
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    todos: getTodos(),
    journal: getJournal()
  }
}

export function validateImportData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Check if data exists
  if (!data) {
    errors.push('No data provided')
    return { isValid: false, errors }
  }
  
  // Check required fields
  if (!data.version) {
    errors.push('Missing version field')
  }
  
  if (!data.exportDate) {
    errors.push('Missing export date')
  }
  
  // Validate todos structure
  if (data.todos && typeof data.todos === 'object') {
    for (const [date, todos] of Object.entries(data.todos)) {
      if (!Array.isArray(todos)) {
        errors.push(`Invalid todos structure for date ${date}`)
        continue
      }
      
      for (const todo of todos as any[]) {
        if (!todo.id || !todo.text || typeof todo.completed !== 'boolean') {
          errors.push(`Invalid todo structure in date ${date}`)
        }
      }
    }
  }
  
  // Validate journal structure
  if (data.journal && typeof data.journal === 'object') {
    for (const [date, entries] of Object.entries(data.journal)) {
      if (!Array.isArray(entries)) {
        errors.push(`Invalid journal structure for date ${date}`)
        continue
      }
      
      for (const entry of entries as any[]) {
        if (!entry.id || !entry.text || !entry.createdAt) {
          errors.push(`Invalid journal entry structure in date ${date}`)
        }
      }
    }
  }
  
  return { isValid: errors.length === 0, errors }
}

export function mergeTodos(existingTodos: TodosByDate, newTodos: TodosByDate): TodosByDate {
  const merged = { ...existingTodos }
  
  for (const [date, todos] of Object.entries(newTodos)) {
    if (!merged[date]) {
      merged[date] = []
    }
    
    // Get existing todo IDs for this date to avoid duplicates
    const existingIds = new Set(merged[date].map(todo => todo.id))
    
    // Add new todos that don't already exist
    for (const todo of todos) {
      if (!existingIds.has(todo.id)) {
        merged[date].push({
          ...todo,
          createdAt: new Date(todo.createdAt)
        })
      }
    }
    
    // Sort by creation date
    merged[date].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
  }
  
  return merged
}

export function mergeJournal(existingJournal: JournalByDate, newJournal: JournalByDate): JournalByDate {
  const merged = { ...existingJournal }
  
  for (const [date, entries] of Object.entries(newJournal)) {
    if (!merged[date]) {
      merged[date] = []
    }
    
    // Get existing entry IDs for this date to avoid duplicates
    const existingIds = new Set(merged[date].map(entry => entry.id))
    
    // Add new entries that don't already exist
    for (const entry of entries) {
      if (!existingIds.has(entry.id)) {
        merged[date].push({
          ...entry,
          createdAt: new Date(entry.createdAt)
        })
      }
    }
    
    // Sort by creation date
    merged[date].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
  }
  
  return merged
}

export function importAndMergeData(importData: ExportData): { success: boolean; message: string; stats: { todosAdded: number; journalEntriesAdded: number } } {
  try {
    // Validate the import data
    const validation = validateImportData(importData)
    if (!validation.isValid) {
      return {
        success: false,
        message: `Invalid data format: ${validation.errors.join(', ')}`,
        stats: { todosAdded: 0, journalEntriesAdded: 0 }
      }
    }
    
    // Get current data
    const currentTodos = getTodos()
    const currentJournal = getJournal()
    
    // Count items before merge
    const currentTodoCount = Object.values(currentTodos).flat().length
    const currentJournalCount = Object.values(currentJournal).flat().length
    
    // Merge data
    const mergedTodos = mergeTodos(currentTodos, importData.todos || {})
    const mergedJournal = mergeJournal(currentJournal, importData.journal || {})
    
    // Save merged data
    saveTodos(mergedTodos)
    saveJournal(mergedJournal)
    
    // Calculate stats
    const newTodoCount = Object.values(mergedTodos).flat().length
    const newJournalCount = Object.values(mergedJournal).flat().length
    
    const todosAdded = newTodoCount - currentTodoCount
    const journalEntriesAdded = newJournalCount - currentJournalCount
    
    return {
      success: true,
      message: `Successfully imported ${todosAdded} todos and ${journalEntriesAdded} journal entries`,
      stats: { todosAdded, journalEntriesAdded }
    }
  } catch (error) {
    return {
      success: false,
      message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      stats: { todosAdded: 0, journalEntriesAdded: 0 }
    }
  }
}