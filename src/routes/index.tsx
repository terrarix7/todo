import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { getTodos, addTodo, toggleTodo, getTodosForDate, getTodoStats, formatDate } from '../lib/todos'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const [todos, setTodos] = React.useState(() => getTodos())
  const [currentDate, setCurrentDate] = React.useState(() => new Date().toISOString().split('T')[0])
  const [newTodoText, setNewTodoText] = React.useState('')

  const refreshTodos = () => {
    setTodos(getTodos())
  }

  const handleAddTodo = () => {
    if (newTodoText.trim()) {
      addTodo(newTodoText.trim())
      setNewTodoText('')
      refreshTodos()
    }
  }

  const handleToggleTodo = (todoId: string) => {
    toggleTodo(currentDate, todoId)
    refreshTodos()
  }

  const currentTodos = getTodosForDate(currentDate)
  const dates = Object.keys(todos).sort().reverse()

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ 
        width: '250px', 
        backgroundColor: '#f5f5f5', 
        padding: '20px',
        borderRight: '1px solid #ddd',
        overflowY: 'auto'
      }}>
        <h3 style={{ margin: '0 0 20px 0' }}>Days</h3>
        {dates.map(date => {
          const stats = getTodoStats(date)
          const isToday = date === new Date().toISOString().split('T')[0]
          const isSelected = date === currentDate
          
          return (
            <div
              key={date}
              onClick={() => setCurrentDate(date)}
              style={{
                padding: '10px',
                marginBottom: '5px',
                backgroundColor: isSelected ? '#007bff' : isToday ? '#e3f2fd' : 'white',
                color: isSelected ? 'white' : 'black',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              <div style={{ fontWeight: 'bold' }}>
                {formatDate(date)}
                {isToday && <span style={{ fontSize: '12px', marginLeft: '5px' }}>(Today)</span>}
              </div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>
                {stats.completed}/{stats.total}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ flex: 1, padding: '20px' }}>
        <h2 style={{ marginBottom: '20px' }}>
          {formatDate(currentDate)}
          {currentDate === new Date().toISOString().split('T')[0] && ' (Today)'}
        </h2>
        
        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={newTodoText}
            onChange={(e) => setNewTodoText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddTodo()}
            placeholder="Add a new todo..."
            style={{
              flex: 1,
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
          <button
            onClick={handleAddTodo}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Add Todo
          </button>
        </div>

        <div>
          {currentTodos.length === 0 ? (
            <p style={{ color: '#666', fontStyle: 'italic' }}>No todos for this day</p>
          ) : (
            currentTodos.map(todo => (
              <div
                key={todo.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '10px',
                  marginBottom: '8px',
                  backgroundColor: 'white',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  gap: '10px'
                }}
              >
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => handleToggleTodo(todo.id)}
                  style={{ transform: 'scale(1.2)' }}
                />
                <span
                  style={{
                    flex: 1,
                    textDecoration: todo.completed ? 'line-through' : 'none',
                    color: todo.completed ? '#666' : 'black',
                    fontSize: '14px'
                  }}
                >
                  {todo.text}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
