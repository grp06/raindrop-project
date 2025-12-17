import { useState, type FormEvent } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { ChevronDown, ChevronRight, ChevronUp, Code2, Info, Loader2, Sparkles, Zap } from 'lucide-react'

type QueryResponse = {
  sql: string
  columns?: string[]
  rows: unknown[]
  error?: string
}

const primaryExamples = [
  'Average grip force by fitness class',
  'Compare body fat percentage between males and females',
  'How many participants are in each fitness class?',
  'Top 10 strongest grip force results',
  'Average blood pressure by age group',
]

const moreExamples = [
  'What is the average weight for class A athletes?',
  'Compare sit-up counts between genders',
  'Broad jump distance by fitness class',
  'Average height and weight for females over 40',
  'How many participants have body fat under 20%?',
  'Systolic vs diastolic blood pressure averages',
  'Top 5 sit-up performers in class A',
]

function App() {
  const [prompt, setPrompt] = useState('')
  const [result, setResult] = useState<QueryResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showSql, setShowSql] = useState(false)
  const [showMoreExamples, setShowMoreExamples] = useState(false)
  const [showFields, setShowFields] = useState(false)

  const fieldGroups = [
    { label: 'Demographics', fields: 'age, gender, height, weight' },
    { label: 'Health', fields: 'body fat %, systolic, diastolic' },
    { label: 'Performance', fields: 'grip force, sit-ups, broad jump, flexibility' },
    { label: 'Classification', fields: 'fitness class (A–D)' },
  ]

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

  const submitPrompt = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    runQuery(prompt)
  }

  const handleExampleClick = (example: string) => {
    setPrompt(example)
    runQuery(example)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/40 via-background to-background">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10">
        <header className="rounded-2xl border bg-card/80 p-6 shadow-sm backdrop-blur">
          <div className="space-y-2">
            <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs uppercase tracking-tight">
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
          <Card className="shadow-sm">
            <CardHeader className="space-y-2">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                Your question
              </CardTitle>
              <CardDescription>Describe what you want to know in plain English.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={submitPrompt}>
                <div className="space-y-3">
                  <Label htmlFor="prompt" className="sr-only">Prompt</Label>
                    <Textarea
                      id="prompt"
                      value={prompt}
                      onChange={(event) => setPrompt(event.target.value)}
                    placeholder="e.g., What's the average grip strength by fitness class?"
                      rows={4}
                      className="text-base"
                    />
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground font-medium">Try an example:</p>
                    <div className="flex flex-wrap gap-2">
                      {primaryExamples.map((example) => (
                        <button
                          key={example}
                          type="button"
                          className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors text-left disabled:opacity-50"
                          onClick={() => handleExampleClick(example)}
                          disabled={loading}
                        >
                          {example}
                        </button>
                      ))}
                      {showMoreExamples && moreExamples.map((example) => (
                        <button
                          key={example}
                          type="button"
                          className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors text-left disabled:opacity-50"
                          onClick={() => handleExampleClick(example)}
                          disabled={loading}
                        >
                          {example}
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      <button
                        type="button"
                        onClick={() => setShowMoreExamples(!showMoreExamples)}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                      >
                        {showMoreExamples ? (
                          <>
                            <ChevronUp className="h-3 w-3" />
                            Show fewer examples
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-3 w-3" />
                            Show more examples
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowFields(!showFields)}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                      >
                        <Info className="h-3 w-3" />
                        {showFields ? 'Hide' : 'View'} available fields
                      </button>
                    </div>
                    {showFields && (
                      <div className="rounded-lg border bg-muted/50 p-3 text-xs space-y-1.5">
                        {fieldGroups.map((group) => (
                          <div key={group.label} className="flex gap-2">
                            <span className="font-medium text-foreground w-24 shrink-0">{group.label}:</span>
                            <span className="text-muted-foreground">{group.fields}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex flex-col gap-1 text-sm">
                    {error && <span className="text-destructive">{error}</span>}
                  </div>
                  <Button type="submit" disabled={loading} size="lg" className="gap-2">
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        Get answer
                        <ChevronRight className="h-4 w-4" />
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
                  <Zap className="h-5 w-5 text-blue-500" />
                  Results
                </CardTitle>
                <CardDescription>
                  {result && !result.error && Array.isArray(result.rows) 
                    ? `${result.rows.length} ${result.rows.length === 1 ? 'result' : 'results'} found`
                    : 'Your answer will appear here'}
                </CardDescription>
              </div>
              {result && !result.error && <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10">Success</Badge>}
              {result?.error && <Badge variant="destructive">Error</Badge>}
            </CardHeader>
            <CardContent className="space-y-4">
              {!result && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="rounded-full bg-muted p-3 mb-3">
                    <Zap className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">Ask a question to see results</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Powered by GPT-5 + Context Free Grammar</p>
                </div>
              )}

              {result && (
                <div className="space-y-4">
                  <div className="max-h-72 overflow-auto rounded-lg border bg-muted/40 px-3 py-2">
                    {Array.isArray(result.rows) && result.rows.length > 0 && result.rows.every((row) => row && typeof row === 'object' && !Array.isArray(row)) ? (
                      <table className="w-full text-sm">
                        <thead className="sticky -top-2 -mx-3 px-3 bg-muted">
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
                      <p className="text-sm text-muted-foreground py-4 text-center">No matching results found.</p>
                    )}
                  </div>
                  
                  {result.sql && (
                    <div className="space-y-2">
                      <button 
                        type="button"
                        onClick={() => setShowSql(!showSql)}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                      >
                        <Code2 className="h-3 w-3" />
                        {showSql ? 'Hide' : 'Show'} generated SQL
                      </button>
                      {showSql && (
                        <ScrollArea className="h-24 rounded-lg border bg-muted/40 px-3 py-2">
                          <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-muted-foreground">
                            {result.sql}
                          </pre>
                        </ScrollArea>
                      )}
                    </div>
                  )}

                  {result.error && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-destructive">Error</p>
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
