import React, { Component } from 'react';

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 * and logs them automatically to the backend
 */
class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // Log error details
        console.error('[ErrorBoundary] Caught error:', error, errorInfo);

        this.setState({ errorInfo });

        // Send error to backend automatically
        this.reportErrorToBackend(error, errorInfo);
    }

    async reportErrorToBackend(error, errorInfo) {
        const { userId } = this.props;

        try {
            await fetch('http://localhost:4000/api/error-reports/automatic', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userId || null,
                    source: 'Frontend (React)',
                    errorMessage: error.toString(),
                    stackTrace: errorInfo?.componentStack || error.stack || 'No stack trace',
                    url: window.location.href
                })
            });
            console.log('[ErrorBoundary] Error reported to backend');
        } catch (reportError) {
            console.error('[ErrorBoundary] Failed to report error:', reportError);
        }
    }

    handleReload = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            // Fallback UI when error occurs
            return (
                <div className="min-h-screen bg-havelock-blue-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl p-8 max-w-lg w-full text-center">
                        <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>

                        <h2 className="text-2xl font-bold text-gray-800 mb-2">
                            ¡Algo salió mal!
                        </h2>

                        <p className="text-gray-600 mb-6">
                            Ha ocurrido un error inesperado. El desarrollador ha sido notificado automáticamente.
                        </p>

                        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                            <p className="text-sm text-gray-500 font-medium mb-1">Error:</p>
                            <p className="text-sm text-red-600 font-mono break-all">
                                {this.state.error?.toString()}
                            </p>
                        </div>

                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={this.handleGoHome}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors font-semibold"
                            >
                                Ir al Inicio
                            </button>
                            <button
                                onClick={this.handleReload}
                                className="px-4 py-2 bg-havelock-blue-400 text-white rounded-md hover:bg-havelock-blue-500 transition-colors font-semibold"
                            >
                                Recargar Página
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
