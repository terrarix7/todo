import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { getTodos, addTodo, toggleTodo, getTodosForDate, getTodoStats, formatDate, getJournal, addJournalEntry, getJournalForDate, formatTime, exportAllData, importAndMergeData } from '../lib/todos'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const [todos, setTodos] = React.useState(() => getTodos())
  const [journal, setJournal] = React.useState(() => getJournal())
  const [currentDate, setCurrentDate] = React.useState(() => new Date().toISOString().split('T')[0])
  const [newTodoText, setNewTodoText] = React.useState('')
  const [newJournalText, setNewJournalText] = React.useState('')
  const [isOnline, setIsOnline] = React.useState(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const [isMobile, setIsMobile] = React.useState(false)
  const [isDesktop, setIsDesktop] = React.useState(false)
  const [showExportPanel, setShowExportPanel] = React.useState(false)
  const [importText, setImportText] = React.useState('')
  const [importStatus, setImportStatus] = React.useState<{ type: 'success' | 'error' | 'info' | null; message: string }>({ type: null, message: '' })

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
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768)
      setIsDesktop(window.innerWidth >= 1200)
      if (window.innerWidth > 768) {
        setIsMobileMenuOpen(false)
      }
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  const refreshTodos = () => {
    setTodos(getTodos())
  }

  const refreshJournal = () => {
    setJournal(getJournal())
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

  const handleAddJournalEntry = () => {
    if (newJournalText.trim()) {
      addJournalEntry(newJournalText.trim())
      setNewJournalText('')
      refreshJournal()
    }
  }

  const handleExportData = async () => {
    try {
      const exportData = exportAllData()
      const exportString = JSON.stringify(exportData, null, 2)
      
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(exportString)
        setImportStatus({ type: 'success', message: 'Data copied to clipboard!' })
      } else {
        // Fallback for browsers without clipboard API
        const textArea = document.createElement('textarea')
        textArea.value = exportString
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        setImportStatus({ type: 'success', message: 'Data copied to clipboard!' })
      }
      
      // Clear status after 3 seconds
      setTimeout(() => setImportStatus({ type: null, message: '' }), 3000)
    } catch (error) {
      setImportStatus({ type: 'error', message: 'Failed to copy data to clipboard' })
      setTimeout(() => setImportStatus({ type: null, message: '' }), 3000)
    }
  }

  const handleImportData = () => {
    if (!importText.trim()) {
      setImportStatus({ type: 'error', message: 'Please paste data to import' })
      setTimeout(() => setImportStatus({ type: null, message: '' }), 3000)
      return
    }

    try {
      const importData = JSON.parse(importText.trim())
      const result = importAndMergeData(importData)
      
      if (result.success) {
        setImportStatus({ type: 'success', message: result.message })
        setImportText('')
        refreshTodos()
        refreshJournal()
      } else {
        setImportStatus({ type: 'error', message: result.message })
      }
      
      // Clear status after 5 seconds
      setTimeout(() => setImportStatus({ type: null, message: '' }), 5000)
    } catch (error) {
      setImportStatus({ type: 'error', message: 'Invalid JSON format. Please check your data.' })
      setTimeout(() => setImportStatus({ type: null, message: '' }), 3000)
    }
  }

  const currentTodos = getTodosForDate(currentDate)
  const currentJournalEntries = getJournalForDate(currentDate)
  const dates = Object.keys({...todos, ...journal}).sort().reverse()
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
          
          {/* Export/Import Section */}
          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e9e9e7' }}>
            <button
              onClick={() => setShowExportPanel(!showExportPanel)}
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: '600',
                color: '#9b9a97',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                textAlign: 'left',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f1f1ef'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              Export/Import
              <span style={{ 
                fontSize: '10px',
                transform: showExportPanel ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.15s ease'
              }}>
                ▼
              </span>
            </button>
            
            {showExportPanel && (
              <div style={{ marginTop: '12px', padding: '16px', backgroundColor: '#f8f8f7', borderRadius: '8px' }}>
                {/* Export Section */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#37352f',
                    marginBottom: '8px'
                  }}>
                    Export Data
                  </div>
                  <button
                    onClick={handleExportData}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: '#2383e2',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '500',
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#1a73d0'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#2383e2'
                    }}
                  >
                    📋 Copy All Data
                  </button>
                  <div style={{
                    fontSize: '11px',
                    color: '#9b9a97',
                    marginTop: '4px',
                    lineHeight: '1.3'
                  }}>
                    Copies all todos and journal entries
                  </div>
                </div>
                
                {/* Import Section */}
                <div>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#37352f',
                    marginBottom: '8px'
                  }}>
                    Import Data
                  </div>
                  <textarea
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder="Paste exported data here..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      border: '1px solid #e9e9e7',
                      borderRadius: '6px',
                      fontSize: '11px',
                      backgroundColor: '#ffffff',
                      outline: 'none',
                      transition: 'border-color 0.15s ease',
                      fontFamily: 'monospace',
                      resize: 'vertical',
                      marginBottom: '8px'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#2383e2'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e9e9e7'
                    }}
                  />
                  <button
                    onClick={handleImportData}
                    disabled={!importText.trim()}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: importText.trim() ? '#2383e2' : '#e9e9e7',
                      color: importText.trim() ? 'white' : '#9b9a97',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: importText.trim() ? 'pointer' : 'not-allowed',
                      fontSize: '13px',
                      fontWeight: '500',
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (importText.trim()) {
                        e.currentTarget.style.backgroundColor = '#1a73d0'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (importText.trim()) {
                        e.currentTarget.style.backgroundColor = '#2383e2'
                      }
                    }}
                  >
                    📥 Merge Data
                  </button>
                  <div style={{
                    fontSize: '11px',
                    color: '#9b9a97',
                    marginTop: '4px',
                    lineHeight: '1.3'
                  }}>
                    Merges without duplicating existing items
                  </div>
                </div>
                
                {/* Status Message */}
                {importStatus.type && (
                  <div style={{
                    marginTop: '12px',
                    padding: '8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    backgroundColor: importStatus.type === 'success' ? '#e8f5e8' : importStatus.type === 'error' ? '#ffeaea' : '#e8f4fd',
                    color: importStatus.type === 'success' ? '#0f7b0f' : importStatus.type === 'error' ? '#d73a49' : '#0366d6',
                    border: `1px solid ${importStatus.type === 'success' ? '#c6e6c6' : importStatus.type === 'error' ? '#f5c6cb' : '#b8daff'}`
                  }}>
                    {importStatus.message}
                  </div>
                )}
              </div>
            )}
          </div>
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

        {/* Main Content Area */}
        <div 
          style={{ 
            flex: 1,
            display: 'flex',
            flexDirection: isDesktop ? 'row' : 'column',
            overflowY: 'auto'
          }}
        >
          {/* Todos Section */}
          <div 
            style={{ 
              flex: isDesktop ? 1 : 'auto',
              display: 'flex',
              flexDirection: 'column',
              borderRight: isDesktop ? '1px solid #e9e9e7' : 'none'
            }}
          >
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
                padding: '0 40px 24px',
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
                <div style={{ maxWidth: isDesktop ? 'none' : '700px' }}>
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

          {/* Journal Section */}
          <div 
            style={{ 
              flex: isDesktop ? 1 : 'auto',
              display: 'flex',
              flexDirection: 'column',
              borderTop: !isDesktop ? '1px solid #e9e9e7' : 'none'
            }}
          >
            {/* Add Journal Entry Section */}
            <div 
              className={isMobile ? 'mobile-content' : ''}
              style={{ 
                padding: '24px 40px'
              }}
            >
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                gap: '12px'
              }}>
                <textarea
                  value={newJournalText}
                  onChange={(e) => setNewJournalText(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      handleAddJournalEntry()
                    }
                  }}
                  placeholder="Write your thoughts..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #e9e9e7',
                    borderRadius: '8px',
                    fontSize: '15px',
                    backgroundColor: '#ffffff',
                    outline: 'none',
                    transition: 'border-color 0.15s ease',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    minHeight: '80px'
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#9b9a97' }}>
                    Press Cmd+Enter to add entry
                  </div>
                  <button
                    onClick={handleAddJournalEntry}
                    disabled={!newJournalText.trim()}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: newJournalText.trim() ? '#2383e2' : '#e9e9e7',
                      color: newJournalText.trim() ? 'white' : '#9b9a97',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: newJournalText.trim() ? 'pointer' : 'not-allowed',
                      fontSize: '14px',
                      fontWeight: '500',
                      transition: 'all 0.15s ease',
                      fontFamily: 'inherit'
                    }}
                    onMouseEnter={(e) => {
                      if (newJournalText.trim()) {
                        e.currentTarget.style.backgroundColor = '#1a73d0'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (newJournalText.trim()) {
                        e.currentTarget.style.backgroundColor = '#2383e2'
                      }
                    }}
                  >
                    Add Entry
                  </button>
                </div>
              </div>
            </div>

            {/* Journal Entries */}
            <div 
              className={isMobile ? 'mobile-content' : ''}
              style={{ 
                flex: 1,
                padding: '0 40px 24px',
                overflowY: 'auto'
              }}
            >
              {currentJournalEntries.length === 0 ? (
                <div style={{ 
                  textAlign: 'center',
                  padding: '60px 20px',
                  color: '#9b9a97'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📖</div>
                  <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>
                    No journal entries yet
                  </div>
                  <div style={{ fontSize: '14px' }}>
                    Start writing your thoughts for today!
                  </div>
                </div>
              ) : (
                <div style={{ maxWidth: isDesktop ? 'none' : '700px' }}>
                  {currentJournalEntries.map((entry) => (
                    <div
                      key={entry.id}
                      style={{
                        display: 'flex',
                        gap: '16px',
                        padding: '16px',
                        marginBottom: '12px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #e9e9e7',
                        borderRadius: '8px',
                        transition: 'all 0.15s ease'
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
                      <div style={{
                        fontSize: '13px',
                        color: '#9b9a97',
                        fontWeight: '500',
                        minWidth: '60px',
                        paddingTop: '2px'
                      }}>
                        {formatTime(entry.createdAt)}
                      </div>
                      <div style={{
                        flex: 1,
                        fontSize: '15px',
                        lineHeight: '1.5',
                        color: '#37352f',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {entry.text}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
