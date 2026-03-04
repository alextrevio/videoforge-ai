import dynamic from 'next/dynamic'

// Force dynamic rendering — never prerender this page
export const fetchCache = 'force-no-store'

const App = dynamic(() => import('@/components/AppShell'), { ssr: false })

export default function Home() {
  return <App />
}
