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
  const [isOnline, setIsOnline] = React.useState(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
      if (window.innerWidth > 768) {
        setIsMobileMenuOpen(false)
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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
  const today = new Date().toISOString().split('T')[0]

  return (
    <div style={{ 
      display: 'flex', 
      height: '100vh', 
      backgroundColor: '#fafafa'
    }}>
      {/* Mobile Overlay */}
      {isMobile && (
        <div 
          className={`mobile-overlay ${isMobileMenuOpen ? 'open' : ''}`}
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div 
        className={isMobile ? `mobile-sidebar ${isMobileMenuOpen ? 'open' : ''}` : ''}
        style={{ 
          width: '280px', 
          backgroundColor: '#fbfbfa', 
          borderRight: '1px solid #e9e9e7',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Date Navigation */}
        <div style={{ 
          flex: 1,
          padding: '24px',
          overflowY: 'auto'
        }}>
          <div style={{ 
            fontSize: '11px',
            fontWeight: '600',
            color: '#9b9a97',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            Recent Days
            <div style={{
              fontSize: '11px',
              color: '#9b9a97',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <div style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                backgroundColor: isOnline ? '#0f7b0f' : '#eb5757'
              }} />
              {isOnline ? 'Online' : 'Offline'}
            </div>
          </div>
          
          {dates.map(date => {
            const stats = getTodoStats(date)
            const isToday = date === today
            const isSelected = date === currentDate
            
            return (
              <div
                key={date}
                onClick={() => setCurrentDate(date)}
                style={{
                  padding: '8px 12px',
                  marginBottom: '2px',
                  backgroundColor: isSelected ? '#2383e2' : 'transparent',
                  color: isSelected ? 'white' : '#37352f',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = '#f1f1ef'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }
                }}
              >
                <div>
                  <div style={{ fontWeight: isToday ? '600' : '400' }}>
                    {formatDate(date)}
                    {isToday && (
                      <span style={{ 
                        fontSize: '10px', 
                        marginLeft: '6px',
                        opacity: 0.8,
                        fontWeight: '400'
                      }}>
                        Today
                      </span>
                    )}
                  </div>
                </div>
                {stats.total > 0 && (
                  <div style={{ 
                    fontSize: '11px', 
                    opacity: isSelected ? 0.9 : 0.6,
                    fontWeight: '500'
                  }}>
                    {stats.completed}/{stats.total}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Main Content */}
      <div 
        className={isMobile ? 'mobile-main' : ''}
        style={{ 
          flex: 1, 
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff'
        }}
      >
        {/* Mobile Header */}
        {isMobile && (
          <div 
            className="mobile-header"
            style={{ 
              padding: '16px 20px',
              borderBottom: '1px solid #e9e9e7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end'
            }}
          >
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              style={{
                background: 'none',
                border: '1px solid #e9e9e7',
                borderRadius: '8px',
                padding: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#37352f'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
          </div>
        )}

        {/* Add Todo Section */}
        <div 
          className={isMobile ? 'mobile-content' : ''}
          style={{ 
            padding: '24px 40px'
          }}
        >
          <div style={{ 
            display: 'flex', 
            gap: '12px',
            alignItems: 'center'
          }}>
            <input
              type="text"
              value={newTodoText}
              onChange={(e) => setNewTodoText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTodo()}
              placeholder="Add a task..."
              style={{
                flex: 1,
                padding: '12px 16px',
                border: '1px solid #e9e9e7',
                borderRadius: '8px',
                fontSize: '15px',
                backgroundColor: '#ffffff',
                outline: 'none',
                transition: 'border-color 0.15s ease',
                fontFamily: 'inherit'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#2383e2'
                e.target.style.boxShadow = '0 0 0 3px rgba(35, 131, 226, 0.1)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e9e9e7'
                e.target.style.boxShadow = 'none'
              }}
            />
            <button
              onClick={handleAddTodo}
              disabled={!newTodoText.trim()}
              style={{
                padding: '12px 20px',
                backgroundColor: newTodoText.trim() ? '#2383e2' : '#e9e9e7',
                color: newTodoText.trim() ? 'white' : '#9b9a97',
                border: 'none',
                borderRadius: '8px',
                cursor: newTodoText.trim() ? 'pointer' : 'not-allowed',
                fontSize: '15px',
                fontWeight: '500',
                transition: 'all 0.15s ease',
                fontFamily: 'inherit'
              }}
              onMouseEnter={(e) => {
                if (newTodoText.trim()) {
                  e.currentTarget.style.backgroundColor = '#1a73d0'
                }
              }}
              onMouseLeave={(e) => {
                if (newTodoText.trim()) {
                  e.currentTarget.style.backgroundColor = '#2383e2'
                }
              }}
            >
              Add
            </button>
          </div>
        </div>

        {/* Todos List */}
        <div 
          className={isMobile ? 'mobile-content' : ''}
          style={{ 
            flex: 1,
            padding: '24px 40px',
            overflowY: 'auto'
          }}
        >
          {currentTodos.length === 0 ? (
            <div style={{ 
              textAlign: 'center',
              padding: '60px 20px',
              color: '#9b9a97'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
              <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>
                No tasks yet
              </div>
              <div style={{ fontSize: '14px' }}>
                Add your first task to get started!
              </div>
            </div>
          ) : (
            <div style={{ maxWidth: '700px' }}>
              {currentTodos.map((todo, index) => (
                <div
                  key={todo.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 16px',
                    marginBottom: '8px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e9e9e7',
                    borderRadius: '8px',
                    gap: '12px',
                    transition: 'all 0.15s ease',
                    opacity: todo.completed ? 0.7 : 1
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'
                    e.currentTarget.style.borderColor = '#d3d3d1'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none'
                    e.currentTarget.style.borderColor = '#e9e9e7'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => handleToggleTodo(todo.id)}
                    style={{ 
                      width: '18px',
                      height: '18px',
                      accentColor: '#2383e2',
                      cursor: 'pointer'
                    }}
                  />
                  <span
                    style={{
                      flex: 1,
                      textDecoration: todo.completed ? 'line-through' : 'none',
                      color: todo.completed ? '#9b9a97' : '#37352f',
                      fontSize: '15px',
                      lineHeight: '1.4'
                    }}
                  >
                    {todo.text}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
