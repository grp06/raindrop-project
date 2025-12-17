import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { queryBackend } from '@/api/query'
import QueryCard from '@/components/QueryCard'
import ResultsCard from '@/components/ResultsCard'
import { Badge } from '@/components/ui/badge'
import { fieldGroups } from '@/constants/fields'
import type { QueryResponse } from '@/types/query'

function App() {
  const [prompt, setPrompt] = useState('')
  const [result, setResult] = useState<QueryResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [schemaOpen, setSchemaOpen] = useState(false)

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
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
        <header className="rounded-2xl border bg-card/80 p-6 shadow-sm backdrop-blur">
          <div className="space-y-3">
            <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs uppercase tracking-tight bg-primary/10 text-primary">
              Fitness Data Explorer
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Ask anything about 13,000+ athletes
            </h1>
            <p className="text-sm text-muted-foreground">
              Ask questions in plain English. We'll query a real dataset of physical performance metrics and show you the results.
            </p>
            <button
              type="button"
              onClick={() => setSchemaOpen(!schemaOpen)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {schemaOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              <span className="font-mono">schema</span>
            </button>
            {schemaOpen && (
              <div className="rounded-lg border bg-muted/40 p-4 font-mono text-xs grid gap-2 sm:grid-cols-2">
                {fieldGroups.map((group) => (
                  <div key={group.label} className="flex flex-col gap-0.5">
                    <span className="text-muted-foreground uppercase tracking-wide text-[10px]">{group.label}</span>
                    <span className="text-foreground">{group.fields}</span>
                  </div>
                ))}
              </div>
            )}
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
