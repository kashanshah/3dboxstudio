"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type StudioErrorBoundaryProps = {
  children: ReactNode;
  title?: string;
  onReset?: () => void;
};

type StudioErrorBoundaryState = {
  error: Error | null;
};

export default class StudioErrorBoundary extends Component<StudioErrorBoundaryProps, StudioErrorBoundaryState> {
  state: StudioErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): StudioErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Studio render error:", error, info.componentStack);
  }

  private handleReset = () => {
    this.setState({ error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.error) {
      return (
        <div className="studio-error-fallback" role="alert">
          <div className="studio-error-fallback-card">
            <h2 className="studio-error-fallback-title">
              {this.props.title ?? "3D preview unavailable"}
            </h2>
            <p className="studio-error-fallback-lead">
              Your browser could not initialize the WebGL viewport. This can happen on older GPUs, when hardware
              acceleration is disabled, or after a graphics driver update.
            </p>
            <p className="studio-error-fallback-hint">
              Try reloading the page, enabling hardware acceleration in your browser settings, or using a different
              browser. You can still use File → Export JSON if you have a saved design.
            </p>
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
