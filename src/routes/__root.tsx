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
    <RootDocument isOnline={isOnline} updateAvailable={updateAvailable} handleUpdate={handleUpdate}>
      <Outlet />
      <TanStackRouterDevtools />
    </RootDocument>
  )
}

function RootDocument({ 
  children, 
  isOnline, 
  updateAvailable, 
  handleUpdate 
}: { 
  children: React.ReactNode
  isOnline: boolean
  updateAvailable: boolean
  handleUpdate: () => void
}) {
  return (
    <html>
      <head>
        <HeadContent />
        <style dangerouslySetInnerHTML={{
          __html: `
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
              background-color: #fafafa;
              color: #37352f;
              line-height: 1.5;
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
            }
            
            .update-notification {
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 12px 16px;
              text-align: center;
              font-size: 14px;
              z-index: 1000;
              box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            }
            
            .update-button {
              background: rgba(255,255,255,0.2);
              border: 1px solid rgba(255,255,255,0.3);
              color: white;
              padding: 6px 12px;
              border-radius: 6px;
              cursor: pointer;
              margin-left: 12px;
              font-size: 13px;
              transition: background-color 0.2s ease;
            }
            
            .update-button:hover {
              background: rgba(255,255,255,0.3);
            }

            /* Mobile responsiveness */
            @media (max-width: 768px) {
              .mobile-sidebar {
                position: fixed !important;
                left: -280px !important;
                top: 0 !important;
                height: 100vh !important;
                z-index: 999 !important;
                transition: left 0.3s ease !important;
              }
              
              .mobile-sidebar.open {
                left: 0 !important;
              }
              
              .mobile-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.5);
                z-index: 998;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
              }
              
              .mobile-overlay.open {
                opacity: 1;
                visibility: visible;
              }
              
              .mobile-main {
                width: 100% !important;
                margin-left: 0 !important;
              }
              
              .mobile-header {
                padding: 16px 20px !important;
              }
              
              .mobile-title {
                fontSize: 24px !important;
              }
              
              .mobile-content {
                padding: 16px 20px !important;
              }
            }

            /* Scrollbar styling */
            ::-webkit-scrollbar {
              width: 6px;
            }
            
            ::-webkit-scrollbar-track {
              background: transparent;
            }
            
            ::-webkit-scrollbar-thumb {
              background: #d3d3d1;
              border-radius: 3px;
            }
            
            ::-webkit-scrollbar-thumb:hover {
              background: #9b9a97;
            }
          `
        }} />
      </head>
      <body>
        {updateAvailable && (
          <div className="update-notification">
            ✨ A new version is available!
            <button className="update-button" onClick={handleUpdate}>
              Update Now
            </button>
          </div>
        )}
        <div style={{ paddingTop: updateAvailable ? '52px' : '0' }}>
          {children}
        </div>
        <Scripts />
      </body>
    </html>
  )
}
