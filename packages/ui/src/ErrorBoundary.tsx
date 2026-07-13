import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, message: error instanceof Error ? error.message : String(error) };
  }

  override render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="tr-error-boundary" role="alert">
          <span className="tr-error-boundary__label">ERROR</span>
          <span className="tr-error-boundary__message">{this.state.message}</span>
        </div>
      );
    }
    return this.props.children;
  }
}
