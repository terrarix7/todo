import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { getTodos, addTodo, toggleTodo, getTodosForDate, getTodoStats, formatDate, getJournal, addJournalEntry, getJournalForDate, formatTime, exportAllData, importAndMergeData, getTodayDateString, getFutureDates, canAddContentToDate, canToggleTodoOnDate } from '../lib/todos'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const [todos, setTodos] = React.useState(() => getTodos())
  const [journal, setJournal] = React.useState(() => getJournal())
  const [currentDate, setCurrentDate] = React.useState(() => getTodayDateString())
  const [newTodoText, setNewTodoText] = React.useState('')
  const [newJournalText, setNewJournalText] = React.useState('')
  const [isOnline, setIsOnline] = React.useState(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const [isMobile, setIsMobile] = React.useState(false)
  const [isDesktop, setIsDesktop] = React.useState(false)
  const [showExportPanel, setShowExportPanel] = React.useState(false)
  const [importText, setImportText] = React.useState('')
  const [importStatus, setImportStatus] = React.useState<{ type: 'success' | 'error' | 'info' | null; message: string }>({ type: null, message: '' })
  const [swStatus, setSwStatus] = React.useState<{ type: 'success' | 'error' | 'info' | null; message: string }>({ type: null, message: '' })
  const [updateAvailable, setUpdateAvailable] = React.useState(false)
  const [isDarkMode, setIsDarkMode] = React.useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode')
      if (saved !== null) return JSON.parse(saved)
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  })

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

  // Theme persistence
  React.useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode))
  }, [isDarkMode])

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
  }

  // Theme colors
  const theme = {
    bg: isDarkMode ? '#15202b' : '#fafafa',
    cardBg: isDarkMode ? '#192734' : '#ffffff',
    sidebarBg: isDarkMode ? '#192734' : '#fbfbfa',
    text: isDarkMode ? '#ffffff' : '#37352f',
    textMuted: isDarkMode ? '#8b98a5' : '#9b9a97',
    border: isDarkMode ? '#38444d' : '#e9e9e7',
    accent: isDarkMode ? '#1d9bf0' : '#2383e2',
    accentHover: isDarkMode ? '#1a8cd8' : '#1a73d0'
  }

  // Background service worker update check
  React.useEffect(() => {
    if ('serviceWorker' in navigator) {
      const checkForUpdates = async () => {
        try {
          const registration = await navigator.serviceWorker.getRegistration()
          if (registration) {
            // Check if there's already a waiting service worker
            if (registration.waiting) {
              setUpdateAvailable(true)
            }
            
            // Listen for new service workers
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    setUpdateAvailable(true)
                  }
                })
              }
            })
            
            // Periodically check for updates (every 30 seconds)
            const updateInterval = setInterval(async () => {
              try {
                await registration.update()
              } catch (error) {
                // Silently fail - this is a background check
              }
            }, 30000)
            
            return () => clearInterval(updateInterval)
          }
        } catch (error) {
          // Silently fail - this is a background check
        }
      }
      
      checkForUpdates()
    }
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

  // Global keyboard handler for Cmd+Enter
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        
        // Check which input is focused
        const activeElement = document.activeElement as HTMLElement
        
        if (activeElement?.tagName === 'INPUT' && newTodoText.trim()) {
          handleAddTodo()
        } else if (activeElement?.tagName === 'TEXTAREA' && newJournalText.trim()) {
          handleAddJournalEntry()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [newTodoText, newJournalText])

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

  const handleApplyUpdate = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration()
        
        if (registration?.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' })
          setSwStatus({ type: 'success', message: 'Updating app...' })
          setTimeout(() => window.location.reload(), 500)
        } else {
          // Force update check one more time
          await registration?.update()
          setTimeout(() => window.location.reload(), 500)
        }
      }
    } catch (error) {
      setSwStatus({ type: 'error', message: 'Update failed' })
      setTimeout(() => setSwStatus({ type: null, message: '' }), 2000)
    }
  }

  const currentTodos = getTodosForDate(currentDate)
  const currentJournalEntries = getJournalForDate(currentDate)
  const futureDates = getFutureDates()
  const existingDates = Object.keys({...todos, ...journal})
  const allDates = Array.from(new Set([...futureDates, ...existingDates])).sort().reverse()
  const today = getTodayDateString()
  
  const canAddToCurrentDate = canAddContentToDate(currentDate)
  const isCurrentDateToday = currentDate === today

  return (
    <div style={{ 
      display: 'flex', 
      height: '100vh', 
      backgroundColor: theme.bg
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
          backgroundColor: theme.sidebarBg, 
          borderRight: `1px solid ${theme.border}`,
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
            color: theme.textMuted,
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
              color: theme.textMuted,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <button
                onClick={toggleTheme}
                style={{
                  background: 'none',
                  border: 'none',
                  color: theme.textMuted,
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDarkMode ? (
                  // Sun icon
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="5"/>
                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                  </svg>
                ) : (
                  // Moon icon
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                  </svg>
                )}
              </button>
              <div style={{
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
          </div>
          
          {allDates.map(date => {
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
                  backgroundColor: isSelected ? theme.accent : 'transparent',
                  color: isSelected ? 'white' : theme.text,
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
                    e.currentTarget.style.backgroundColor = isDarkMode ? '#38444d' : '#f1f1ef'
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
          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: `1px solid ${theme.border}` }}>
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
                color: theme.textMuted,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                textAlign: 'left',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isDarkMode ? '#38444d' : '#f1f1ef'
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
              <div style={{ marginTop: '12px', padding: '16px', backgroundColor: isDarkMode ? '#38444d' : '#f8f8f7', borderRadius: '8px' }}>
                {/* Export Section */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '500',
                    color: theme.text,
                    marginBottom: '8px'
                  }}>
                    Export Data
                  </div>
                  <button
                    onClick={handleExportData}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: theme.accent,
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '500',
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = theme.accentHover
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = theme.accent
                    }}
                  >
                    📋 Copy All Data
                  </button>
                  <div style={{
                    fontSize: '11px',
                    color: theme.textMuted,
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
                    color: theme.text,
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
                      border: `1px solid ${theme.border}`,
                      borderRadius: '6px',
                      fontSize: '11px',
                      backgroundColor: theme.cardBg,
                      color: theme.text,
                      outline: 'none',
                      fontFamily: 'monospace',
                      resize: 'vertical',
                      marginBottom: '8px'
                    }}
                  />
                  <button
                    onClick={handleImportData}
                    disabled={!importText.trim()}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: importText.trim() ? theme.accent : (isDarkMode ? '#38444d' : '#e9e9e7'),
                      color: importText.trim() ? 'white' : theme.textMuted,
                      border: 'none',
                      borderRadius: '6px',
                      cursor: importText.trim() ? 'pointer' : 'not-allowed',
                      fontSize: '13px',
                      fontWeight: '500',
                      fontFamily: 'inherit'
                    }}
                  >
                    📥 Merge Data
                  </button>
                  <div style={{
                    fontSize: '11px',
                    color: theme.textMuted,
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

          {/* Service Worker Update Section - Only show when update is available */}
          {updateAvailable && (
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${theme.border}` }}>
              <button
                onClick={handleApplyUpdate}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: theme.accent,
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500',
                  color: 'white',
                  textAlign: 'center',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme.accentHover
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = theme.accent
                }}
              >
                Update Available
              </button>
              
              {/* Service Worker Status Message */}
              {swStatus.type && (
                <div style={{
                  marginTop: '8px',
                  padding: '8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  backgroundColor: swStatus.type === 'success' ? '#e8f5e8' : swStatus.type === 'error' ? '#ffeaea' : '#e8f4fd',
                  color: swStatus.type === 'success' ? '#0f7b0f' : swStatus.type === 'error' ? '#d73a49' : '#0366d6',
                  border: `1px solid ${swStatus.type === 'success' ? '#c6e6c6' : swStatus.type === 'error' ? '#f5c6cb' : '#b8daff'}`,
                  textAlign: 'center',
                  lineHeight: '1.3'
                }}>
                  {swStatus.message}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div 
        className={isMobile ? 'mobile-main' : ''}
        style={{ 
          flex: 1, 
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: theme.cardBg
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
              borderRight: isDesktop ? `1px solid ${theme.border}` : 'none'
            }}
          >
            {/* Add Todo Section */}
            {canAddToCurrentDate && (
              <div 
                className={isMobile ? 'mobile-content' : ''}
                style={{ 
                  padding: '24px 40px'
                }}
              >
                <input
                  type="text"
                  value={newTodoText}
                  onChange={(e) => setNewTodoText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTodo()}
                  placeholder="Add a task..."
                  style={{
                    width: '100%',
                    padding: '12px 0',
                    border: 'none',
                    borderBottom: `1px solid ${theme.border}`,
                    fontSize: '15px',
                    backgroundColor: 'transparent',
                    color: theme.text,
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
            )}

            {/* Todos List */}
            <div 
              className={isMobile ? 'mobile-content' : ''}
              style={{ 
                flex: 1,
                padding: canAddToCurrentDate ? '0 40px 24px' : '24px 40px',
                overflowY: 'auto'
              }}
            >
              {currentTodos.length === 0 ? (
                <div style={{ 
                  textAlign: 'center',
                  padding: '60px 20px',
                  color: '#9b9a97'
                }}>
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
                        padding: '8px 0',
                        gap: '12px',
                        opacity: todo.completed ? 0.5 : 1
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={todo.completed}
                        onChange={() => canToggleTodoOnDate(currentDate) && handleToggleTodo(todo.id)}
                        disabled={!canToggleTodoOnDate(currentDate)}
                        style={{ 
                          width: '16px',
                          height: '16px',
                          margin: 0,
                          border: 'none',
                          outline: 'none',
                          opacity: canToggleTodoOnDate(currentDate) ? 1 : 0.5,
                          cursor: canToggleTodoOnDate(currentDate) ? 'pointer' : 'not-allowed'
                        }}
                      />
                      <span
                        style={{
                          flex: 1,
                          textDecoration: todo.completed ? 'line-through' : 'none',
                          color: todo.completed ? theme.textMuted : theme.text,
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
              borderTop: !isDesktop ? `1px solid ${theme.border}` : 'none'
            }}
          >
            {/* Add Journal Entry Section */}
            {isCurrentDateToday && (
              <div 
                className={isMobile ? 'mobile-content' : ''}
                style={{ 
                  padding: '24px 40px'
                }}
              >
                <textarea
                  value={newJournalText}
                  onChange={(e) => setNewJournalText(e.target.value)}
                  placeholder="Write your thoughts..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px 0',
                    border: 'none',
                    borderBottom: `1px solid ${theme.border}`,
                    fontSize: '15px',
                    backgroundColor: 'transparent',
                    color: theme.text,
                    outline: 'none',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    minHeight: '80px'
                  }}
                />
              </div>
            )}

            {/* Journal Entries */}
            <div 
              className={isMobile ? 'mobile-content' : ''}
              style={{ 
                flex: 1,
                padding: isCurrentDateToday ? '0 40px 24px' : '24px 40px',
                overflowY: 'auto'
              }}
            >
              {currentJournalEntries.length === 0 ? (
                <div style={{ 
                  textAlign: 'center',
                  padding: '60px 20px',
                  color: '#9b9a97'
                }}>
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
                        padding: '8px 0',
                        marginBottom: '8px'
                      }}
                    >
                      <div style={{
                        fontSize: '13px',
                        color: theme.textMuted,
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
                        color: theme.text,
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
