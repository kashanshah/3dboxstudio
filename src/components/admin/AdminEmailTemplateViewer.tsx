"use client";

import { useEffect, useState } from "react";

type EmailTemplatePreview = {
  id: string;
  label: string;
  description: string;
  subject: string;
  html: string;
  sourcePath: string;
};

export default function AdminEmailTemplateViewer() {
  const [templates, setTemplates] = useState<EmailTemplatePreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/admin/email-templates");
        const body = (await res.json().catch(() => ({}))) as {
          items?: EmailTemplatePreview[];
          error?: string;
        };

        if (!res.ok) throw new Error(body.error ?? "Could not load email templates.");
        if (!cancelled) {
          setTemplates(body.items ?? []);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not load email templates.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <h2>Email templates</h2>
        <p className="admin-panel-meta">Rendered from live code used by Resend</p>
      </div>

      <div className="admin-template-viewer">
        <p className="admin-muted">
          Edit templates in <code>src/server/email/templates.tsx</code>. The previews below render the same HTML that
          the mailer sends.
        </p>

        {loading ? <p className="admin-muted">Loading email templates...</p> : null}
        {error ? <p className="admin-error">{error}</p> : null}

        <div className="admin-template-grid">
          {templates.map((template) => (
            <section key={template.id} className="admin-template-card">
              <div className="admin-template-card-info">
                <div className="admin-template-card-head">
                  <div>
                    <h3>{template.label}</h3>
                    <p>{template.description}</p>
                  </div>
                  <code>{template.sourcePath}</code>
                </div>

                <div className="admin-template-meta">
                  <div>
                    <strong>Subject</strong>
                    <div>{template.subject}</div>
                  </div>
                </div>
              </div>

              <div className="admin-template-preview-wrap">
                <iframe
                  className="admin-template-preview"
                  title={`${template.label} preview`}
                  srcDoc={template.html}
                />
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
