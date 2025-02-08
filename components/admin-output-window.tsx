"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2 } from "lucide-react"

interface LogEntry {
  timestamp: string
  type: 'subjects' | 'styles' | 'prompts' | string
  input: string
  output: string
  duration: number
  tokens: {
    prompt: number
    completion: number
    total: number
  }
}

export function AdminOutputWindow() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedType, setSelectedType] = useState<string>('all')
  const [error, setError] = useState<string | null>(null)

  const fetchLogs = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch('/api/admin/logs', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch logs')
      }

      const data = await response.json()
      setLogs(data.logs)
    } catch (error) {
      console.error('Error fetching logs:', error)
      setError('Failed to fetch logs. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchLogs, 30000)
    return () => clearInterval(interval)
  }, [])

  const filteredLogs = selectedType === 'all'
    ? logs
    : logs.filter(log => log.type.toLowerCase() === selectedType.toLowerCase())

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="space-x-2">
          <Button
            variant={selectedType === 'all' ? 'default' : 'outline'}
            onClick={() => setSelectedType('all')}
          >
            All
          </Button>
          <Button
            variant={selectedType === 'subjects' ? 'default' : 'outline'}
            onClick={() => setSelectedType('subjects')}
          >
            Subjects
          </Button>
          <Button
            variant={selectedType === 'styles' ? 'default' : 'outline'}
            onClick={() => setSelectedType('styles')}
          >
            Styles
          </Button>
          <Button
            variant={selectedType === 'prompts' ? 'default' : 'outline'}
            onClick={() => setSelectedType('prompts')}
          >
            Prompts
          </Button>
        </div>
        <Button onClick={fetchLogs} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading
            </>
          ) : (
            'Refresh Logs'
          )}
        </Button>
      </div>

      <ScrollArea className="h-[600px] rounded-md border p-4">
        {filteredLogs.map((log, index) => (
          <div key={index} className="mb-6 last:mb-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">{new Date(log.timestamp).toLocaleString()}</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  log.type === 'subjects' ? 'bg-blue-100 text-blue-800' :
                  log.type === 'styles' ? 'bg-green-100 text-green-800' :
                  'bg-purple-100 text-purple-800'
                }`}>
                  {log.type}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                Duration: {formatDuration(log.duration)} | 
                Tokens: {log.tokens.total} ({log.tokens.prompt} prompt, {log.tokens.completion} completion)
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-500">Input</h4>
                <pre className="p-3 bg-gray-50 rounded-md text-sm overflow-x-auto">
                  {log.input}
                </pre>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-500">Output</h4>
                <pre className="p-3 bg-gray-50 rounded-md text-sm overflow-x-auto">
                  {log.output}
                </pre>
              </div>
            </div>
          </div>
        ))}

        {filteredLogs.length === 0 && !isLoading && (
          <div className="text-center text-gray-500 py-8">
            No logs found. Click refresh to fetch latest logs.
          </div>
        )}
      </ScrollArea>

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-md">
          {error}
        </div>
      )}
    </Card>
  )
}
