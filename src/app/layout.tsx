import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'VideoForge AI',
  description: 'AI-powered video generation and automation platform',
}

const BUILD_VERSION = Date.now().toString()

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
        <meta name="build-version" content={BUILD_VERSION} />
      </head>
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  )
}
// Force redeploy Sun Mar  1 01:12:27 UTC 2026
