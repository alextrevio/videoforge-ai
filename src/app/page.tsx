'use client'
import { AppProvider } from '@/lib/context'
import VideoForgeApp from '@/components/VideoForgeApp'

export default function Home() {
  return (
    <AppProvider>
      <VideoForgeApp />
    </AppProvider>
  )
}
