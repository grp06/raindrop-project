import { useState } from "react"
import { Code2, Zap } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import ResultsTable from "@/components/ResultsTable"
import type { QueryResponse } from "@/types/query"

type ResultsCardProps = {
  result: QueryResponse | null
}

function ResultsCard({ result }: ResultsCardProps) {
  const [showSql, setShowSql] = useState(false)

  const rows = result ? result.rows : []
  const hasError = Boolean(result?.error)
  const hasSuccess = Boolean(result && !result.error)
  const hasRows = rows.length > 0

  const description = hasSuccess
    ? `${rows.length} ${rows.length === 1 ? "result" : "results"} found`
    : "Your answer will appear here"

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-500" />
            Results
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {hasSuccess && <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10">Success</Badge>}
        {hasError && <Badge variant="destructive">Error</Badge>}
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
            {(hasRows || (!hasError && !hasRows)) && (
              <div className="max-h-72 overflow-auto rounded-lg border bg-muted/40 px-3 py-2">
                {hasRows ? (
                  <ResultsTable columns={result.columns} rows={rows} />
                ) : (
                  <p className="text-sm text-muted-foreground py-4 text-center">No matching results found.</p>
                )}
              </div>
            )}

            {result.sql && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setShowSql(!showSql)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  <Code2 className="h-3 w-3" />
                  {showSql ? "Hide" : "Show"} generated SQL
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

            {hasError && (
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
  )
}

export default ResultsCard
