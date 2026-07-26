import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary捕获:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 p-4">
          <div className="bg-white rounded-lg border border-red-200 p-4">
            <h1 className="text-lg font-bold text-red-600 mb-2">页面出错了</h1>
            <p className="text-sm text-gray-700 mb-2 break-all">
              {this.state.error?.message}
            </p>
            <pre className="text-xs text-gray-500 bg-gray-50 p-2 rounded overflow-auto max-h-64 whitespace-pre-wrap break-all">
              {this.state.error?.stack}
            </pre>
            <button
              onClick={() => {
                window.location.hash = '#/'
                window.location.reload()
              }}
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
            >
              返回首页
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
