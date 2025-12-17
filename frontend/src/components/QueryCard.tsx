import { useState } from "react"
import { ChevronDown, ChevronRight, ChevronUp, Loader2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { moreExamples, primaryExamples } from "@/constants/examples"

type QueryCardProps = {
  prompt: string
  onPromptChange: (value: string) => void
  onSubmit: () => void
  onExampleSelect: (example: string) => void
  loading: boolean
  error: string | null
}

function QueryCard({
  prompt,
  onPromptChange,
  onSubmit,
  onExampleSelect,
  loading,
  error,
}: QueryCardProps) {
  const [showMoreExamples, setShowMoreExamples] = useState(false)

  return (
    <Card className="shadow-sm">
      <CardHeader className="space-y-2">
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5 text-primary" />
          Your question
        </CardTitle>
        <CardDescription>Describe what you want to know in plain English.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            onSubmit()
          }}
        >
          <div className="space-y-3">
            <Label htmlFor="prompt" className="sr-only">
              Prompt
            </Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(event) => onPromptChange(event.target.value)}
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
                    onClick={() => onExampleSelect(example)}
                    disabled={loading}
                  >
                    {example}
                  </button>
                ))}
                {showMoreExamples &&
                  moreExamples.map((example) => (
                    <button
                      key={example}
                      type="button"
                      className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors text-left disabled:opacity-50"
                      onClick={() => onExampleSelect(example)}
                      disabled={loading}
                    >
                      {example}
                    </button>
                  ))}
              </div>
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
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex flex-col gap-1 text-sm">{error && <span className="text-destructive">{error}</span>}</div>
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
  )
}

export default QueryCard
