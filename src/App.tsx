import { AppProvider, useApp } from './app-context.tsx'
import { Shell } from './components/Shell.tsx'
import { HomePage } from './pages/HomePage.tsx'
import { PassSetupPage } from './pages/PassSetupPage.tsx'
import { PathPage } from './pages/PathPage.tsx'
import { PlayPage } from './pages/PlayPage.tsx'
import { ProgressPage } from './pages/ProgressPage.tsx'
import { ResultsPage } from './pages/ResultsPage.tsx'

function Routes() {
  const { path } = useApp()
  if (path.startsWith('/pad')) return <PathPage />
  if (path.startsWith('/spelen')) return <PlayPage />
  if (path.startsWith('/samen')) return <PassSetupPage />
  if (path.startsWith('/resultaat')) return <ResultsPage />
  if (path.startsWith('/voortgang')) return <ProgressPage />
  return <HomePage />
}

export default function App() {
  return (
    <AppProvider>
      <Shell>
        <Routes />
      </Shell>
    </AppProvider>
  )
}
