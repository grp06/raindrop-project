import { useState } from 'react'
import { queryBackend } from '@/api/query'
import QueryCard from '@/components/QueryCard'
import ResultsCard from '@/components/ResultsCard'
import { Badge } from '@/components/ui/badge'
import type { QueryResponse } from '@/types/query'

function App() {
  const [prompt, setPrompt] = useState('')
  const [result, setResult] = useState<QueryResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const runQuery = async (queryPrompt: string) => {
    const trimmed = queryPrompt.trim()
    if (!trimmed) {
      setError('Enter a prompt to send to the backend.')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const { ok, status, data } = await queryBackend(trimmed)
      if (!ok) {
        const message = data.error ?? `Request failed with status ${status}`
        setResult(data)
        setError(message)
        return
      }
      setResult(data)
      setError(data.error ?? null)
    } catch (err) {
      console.error(err)
      const message =
        err instanceof Error ? err.message : 'Request failed. Check backend logs for details.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const submitPrompt = () => runQuery(prompt)

  const handleExampleClick = (example: string) => {
    setPrompt(example)
    runQuery(example)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/40 via-background to-background">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10">
        <header className="rounded-2xl border bg-card/80 p-6 shadow-sm backdrop-blur">
          <div className="space-y-2">
            <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs uppercase tracking-tight bg-primary/10 text-primary">
              Fitness Data Explorer
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Ask anything about 13,000+ athletes
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Ask questions in plain English. We'll query a real dataset of physical performance metrics and show you the results.
            </p>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-2 items-start">
          <QueryCard
            prompt={prompt}
            onPromptChange={setPrompt}
            onSubmit={submitPrompt}
            onExampleSelect={handleExampleClick}
            loading={loading}
            error={error}
          />
          <ResultsCard result={result} />
        </div>

        <footer className="text-center text-xs text-muted-foreground/60 pt-4">
          Dataset: 13,393 physical performance records from the Korea Sports Promotion Foundation. Ages 20–64, classified A–D by fitness level.
          {' '}
          <a 
            href="https://www.opendatabay.com/data/healthcare/950616d0-e08a-4ab3-9e13-84c010e9d4b8" 
            target="_blank" 
            rel="noopener noreferrer"
            className="underline hover:text-muted-foreground transition-colors"
          >
            View source dataset
          </a>
        </footer>
      </div>
    </div>
  )
}

export default App
