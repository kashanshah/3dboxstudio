"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { trackStudioError } from "@/lib/analytics";
import { useTranslations } from "next-intl";

type StudioErrorBoundaryProps = {
  children: ReactNode;
  title?: string;
  onReset?: () => void;
};

type StudioErrorCopy = { unavailable: string; webglLead: string; webglHint: string; genericLead: string; reload: string; retry: string };

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

class StudioErrorBoundaryInner extends Component<StudioErrorBoundaryProps & { copy: StudioErrorCopy }, StudioErrorBoundaryState> {
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
              {this.props.title ?? this.props.copy.unavailable}
            </h2>
            {webgl ? (
              <>
                <p className="studio-error-fallback-lead">
                  {this.props.copy.webglLead}
                </p>
                <p className="studio-error-fallback-hint">
                  {this.props.copy.webglHint}
                </p>
              </>
            ) : (
              <>
                <p className="studio-error-fallback-lead">
                  {this.props.copy.genericLead}
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
                {this.props.copy.reload}
              </button>
              <button type="button" className="btn" onClick={this.handleReset}>
                {this.props.copy.retry}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function StudioErrorBoundary(props: StudioErrorBoundaryProps) {
  const t = useTranslations("studio.renderError");
  const copy: StudioErrorCopy = {
    unavailable: t("unavailable"), webglLead: t("webglLead"), webglHint: t("webglHint"),
    genericLead: t("genericLead"), reload: t("reload"), retry: t("retry"),
  };
  return <StudioErrorBoundaryInner {...props} copy={copy} />;
}
