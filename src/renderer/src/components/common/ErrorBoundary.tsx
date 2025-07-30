import { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({ error, errorInfo })
  }

  handleReload = (): void => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
    // Force a full page reload to reset the app state
    window.location.reload()
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-destructive">Something went wrong</CardTitle>
              <CardDescription>
                The application encountered an unexpected error and needs to be reloaded.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {this.state.error && (
                <div className="text-sm font-mono text-muted-foreground bg-muted p-3 rounded-md overflow-auto max-h-32">
                  {this.state.error.message}
                </div>
              )}
              <div className="flex gap-2">
                <Button onClick={this.handleReload} className="flex-1">
                  Reload Application
                </Button>
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      const result = await window.api.support.mailSupport()
                      if (!result.success) {
                        console.error('Failed to open email client:', result.error)
                      }
                    } catch (error) {
                      console.error('Failed to open email client:', error)
                    }
                  }}
                  className="flex-1"
                >
                  Report Issue
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
