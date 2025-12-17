import { useState, type FormEvent } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { Database, Loader2, Send, Server } from 'lucide-react'

type QueryResponse = {
  sql: string
  columns?: string[]
  rows: unknown[]
  error?: string
}

function App() {
  const [prompt, setPrompt] = useState('')
  const [result, setResult] = useState<QueryResponse | null>(null)
  const [healthStatus, setHealthStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const examplePrompts = [
    'Average grip force by fitness class',
    'Compare average body fat percentage between genders.',
    'How many participants are in each fitness class?',
    'Average sit-ups count by age and gender.',
    'Top 5 broad jump results for females.',
    'Average systolic and diastolic blood pressure by fitness class.',
    'Compare average weight between fitness class A and D.',
    'Average grip force for age 40 and above by gender.',
    'How many participants are 20 to 29 years old?',
  ]

  const fetchHealth = async () => {
    setError(null)
    setHealthStatus(null)

    try {
      const response = await fetch('/api/health')
      if (!response.ok) {
        throw new Error(`Health check failed with status ${response.status}`)
      }

      const data = (await response.json()) as { status?: string }
      setHealthStatus(data.status ?? 'unknown')
    } catch (err) {
      console.error(err)
      setError('Unable to reach the backend. Is it running?')
    }
  }

  const submitPrompt = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = prompt.trim()
    if (!trimmed) {
      setError('Enter a prompt to send to the backend.')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: trimmed }),
      })

      let data: QueryResponse | null = null
      try {
        data = (await response.json()) as QueryResponse
      } catch (_err) {
        data = null
      }

      if (!response.ok) {
        const message = data?.error ?? `Request failed with status ${response.status}`
        setResult(data ?? { sql: '', columns: [], rows: [], error: message })
        setError(message)
        return
      }

      if (!data) {
        setError('Backend returned an empty response.')
        return
      }

      setResult(data)
      setError(data.error ?? null)
    } catch (err) {
      console.error(err)
      setError('Request failed. Check backend logs for details.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/40 via-background to-background">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
        <header className="flex flex-col gap-6 rounded-2xl border bg-card/80 p-6 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs uppercase tracking-tight">
              Body performance explorer
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Ask questions about physical performance
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Turn natural-language questions into SQL to explore fitness, strength, and health metrics.
            </p>
          </div>
          <Button variant="outline" size="lg" onClick={fetchHealth} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <Server className="mr-2 h-4 w-4" />
                Check backend
              </>
            )}
          </Button>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="shadow-sm">
            <CardHeader className="space-y-2">
              <CardTitle>Ask about the body performance dataset</CardTitle>
              <CardDescription>Describe what you want to know; we will generate SQL for you.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={submitPrompt}>
                <div className="space-y-2">
                  <Label htmlFor="prompt">Prompt</Label>
                    <Textarea
                      id="prompt"
                      value={prompt}
                      onChange={(event) => setPrompt(event.target.value)}
                    placeholder="Average grip force by fitness class, or compare average body fat percentage between genders."
                      rows={5}
                    />
                  <div className="flex flex-wrap gap-2">
                    {examplePrompts.map((example) => (
                      <Button
                        key={example}
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="rounded-full"
                        onClick={() => setPrompt(example)}
                      >
                        {example}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-col gap-1 text-sm">
                    {error && <span className="text-destructive">{error}</span>}
                    {healthStatus && <span className="text-emerald-600">Backend status: {healthStatus}</span>}
                  </div>
                  <Button type="submit" disabled={loading} size="lg">
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Send to backend
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  Query result
                </CardTitle>
                <CardDescription>SQL generated from your prompt and the returned rows.</CardDescription>
              </div>
              {result && !result.error && <Badge variant="secondary">OK</Badge>}
              {result?.error && <Badge variant="destructive">Error</Badge>}
            </CardHeader>
            <CardContent className="space-y-4">
              {!result && <p className="text-sm text-muted-foreground">Submit a prompt to see SQL and rows.</p>}

              {result && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">SQL</p>
                    <ScrollArea className="h-32 rounded-lg border bg-muted/40 px-3 py-2">
                      <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
                        {result.sql || '—'}
                      </pre>
                    </ScrollArea>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Rows</p>
                    <ScrollArea className="h-60 rounded-lg border bg-muted/40 px-3 py-2">
                      {Array.isArray(result.rows) && result.rows.length > 0 && result.rows.every((row) => row && typeof row === 'object' && !Array.isArray(row)) ? (
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-muted-foreground">
                              {(result.columns && result.columns.length > 0
                                ? result.columns
                                : Array.from(
                                    new Set(
                                      (result.rows as Record<string, unknown>[]).flatMap((row) => Object.keys(row)),
                                    ),
                                  )
                              ).map((column) => (
                                <th key={column} className="border-b py-2 pr-4 font-medium">
                                  {column}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {(result.rows as Record<string, unknown>[]).map((row, index) => {
                              const columns =
                                result.columns && result.columns.length > 0
                                  ? result.columns
                                  : Object.keys(row)
                              return (
                                <tr key={index} className="border-b last:border-0">
                                  {columns.map((column) => (
                                    <td key={column} className="py-2 pr-4">
                                      {String(row[column] ?? '')}
                                    </td>
                                  ))}
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      ) : (
                        <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
                          {Array.isArray(result.rows) ? JSON.stringify(result.rows, null, 2) : '—'}
                        </pre>
                      )}
                      {Array.isArray(result.rows) && result.rows.length === 0 && (
                        <p className="text-sm text-muted-foreground">No rows returned.</p>
                      )}
                    </ScrollArea>
                  </div>
                  {result.error && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Error</p>
                      <ScrollArea className="rounded-lg border bg-destructive/10 px-3 py-2 text-destructive">
                        <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed">{result.error}</pre>
                      </ScrollArea>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default App
