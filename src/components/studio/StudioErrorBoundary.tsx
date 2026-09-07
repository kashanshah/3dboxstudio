"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { trackStudioError } from "@/lib/analytics";

type StudioErrorBoundaryProps = {
  children: ReactNode;
  title?: string;
  onReset?: () => void;
};

type StudioErrorBoundaryState = {
  error: Error | null;
};

function isLikelyWebGLError(error: Error): boolean {
  const text = `${error.name} ${error.message}`.toLowerCase();
  return text.includes("webgl") || text.includes("getcontext") || text.includes("gpu");
}

/** Catches a subtree error, renders `fallback`, and retries when `resetKey` changes. */
export class ResettableErrorBoundary extends Component<
  {
    children: ReactNode;
    resetKey?: string | number;
    fallback?: ReactNode;
    onError?: (error: Error, info: ErrorInfo) => void;
  },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info);
  }

  componentDidUpdate(prevProps: { resetKey?: string | number }) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error) return this.props.fallback ?? null;
    return this.props.children;
  }
}

export default class StudioErrorBoundary extends Component<StudioErrorBoundaryProps, StudioErrorBoundaryState> {
  state: StudioErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): StudioErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Studio render error:", error, info.componentStack);
    trackStudioError(isLikelyWebGLError(error) ? "webgl_init_failed" : "unknown", "rendering");
  }

  private handleReset = () => {
    this.setState({ error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.error) {
      const webgl = isLikelyWebGLError(this.state.error);
      return (
        <div className="studio-error-fallback" role="alert">
          <div className="studio-error-fallback-card">
            <h2 className="studio-error-fallback-title">
              {this.props.title ?? "3D preview unavailable"}
            </h2>
            {webgl ? (
              <>
                <p className="studio-error-fallback-lead">
                  Your browser could not initialize the WebGL viewport. This can happen on older GPUs, when hardware
                  acceleration is disabled, or after a graphics driver update.
                </p>
                <p className="studio-error-fallback-hint">
                  Try reloading the page, enabling hardware acceleration in your browser settings, or using a different
                  browser. You can still use File → Export JSON if you have a saved design.
                </p>
              </>
            ) : (
              <>
                <p className="studio-error-fallback-lead">
                  The 3D preview hit an error and stopped. Try again, or reload the studio. You can still use File →
                  Export JSON if you have a saved design.
                </p>
                {this.state.error.message ? (
                  <p className="studio-error-fallback-detail">
                    <code>{this.state.error.message}</code>
                  </p>
                ) : null}
              </>
            )}
            <div className="studio-error-fallback-actions">
              <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
                Reload studio
              </button>
              <button type="button" className="btn" onClick={this.handleReset}>
                Try again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
