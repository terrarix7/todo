import * as React from 'react'
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Daily Todos',
      },
      {
        name: 'description',
        content: 'A simple daily todo tracking app that works offline',
      },
      {
        name: 'theme-color',
        content: '#007bff',
      },
      {
        name: 'apple-mobile-web-app-capable',
        content: 'yes',
      },
      {
        name: 'apple-mobile-web-app-status-bar-style',
        content: 'default',
      },
      {
        name: 'apple-mobile-web-app-title',
        content: 'Daily Todos',
      },
    ],
    links: [
      {
        rel: 'icon',
        href: '/favicon.ico',
      },
      {
        rel: 'apple-touch-icon',
        href: '/pwa-192x192.png',
      },
      {
        rel: 'mask-icon',
        href: '/pwa-192x192.png',
        color: '#007bff',
      },
      {
        rel: 'manifest',
        href: '/manifest.json',
      },
    ],
  }),
  component: RootComponent,
})

function RootComponent() {
  const [isOnline, setIsOnline] = React.useState(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const [updateAvailable, setUpdateAvailable] = React.useState(false)

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
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
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
        })
        .catch((error) => {
          console.error('Service worker registration failed:', error)
        })

      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'SW_UPDATED') {
          setUpdateAvailable(true)
        }
      })
    }
  }, [])

  const handleUpdate = () => {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' })
      window.location.reload()
    }
  }

  return (
    <RootDocument>
      {!isOnline && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: '#ff6b6b',
          color: 'white',
          padding: '8px',
          textAlign: 'center',
          fontSize: '14px',
          zIndex: 1000
        }}>
          You're offline. Your todos are saved locally and will sync when you're back online.
        </div>
      )}
      {updateAvailable && (
        <div style={{
          position: 'fixed',
          top: isOnline ? 0 : '40px',
          left: 0,
          right: 0,
          backgroundColor: '#4CAF50',
          color: 'white',
          padding: '8px',
          textAlign: 'center',
          fontSize: '14px',
          zIndex: 1000
        }}>
          A new version is available.{' '}
          <button
            onClick={handleUpdate}
            style={{
              background: 'transparent',
              border: '1px solid white',
              color: 'white',
              padding: '4px 8px',
              cursor: 'pointer',
              marginLeft: '8px'
            }}
          >
            Update
          </button>
        </div>
      )}
      <div style={{ paddingTop: isOnline ? (updateAvailable ? '40px' : '0') : (updateAvailable ? '80px' : '40px') }}>
        <Outlet />
      </div>
      <TanStackRouterDevtools />
    </RootDocument>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
