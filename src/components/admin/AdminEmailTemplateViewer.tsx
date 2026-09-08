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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedTemplate = selectedId ? templates.find((template) => template.id === selectedId) ?? null : null;

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
          const items = body.items ?? [];
          setTemplates(items);
          setSelectedId((current) => current ?? items[0]?.id ?? null);
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
          Edit templates in <code>src/server/email/templates.tsx</code>. Click a template to preview the same HTML the
          mailer sends.
        </p>

        {loading ? <p className="admin-muted">Loading email templates...</p> : null}
        {error ? <p className="admin-error">{error}</p> : null}

        {templates.length > 0 ? (
          <div className="admin-template-grid">
            <div className="admin-template-list" role="list" aria-label="Email templates">
              {templates.map((template) => {
                const selected = template.id === selectedId;
                return (
                  <button
                    key={template.id}
                    type="button"
                    className={`admin-template-list-item${selected ? " is-active" : ""}`}
                    aria-pressed={selected}
                    onClick={() => setSelectedId(template.id)}
                  >
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
                  </button>
                );
              })}
            </div>

            <div className="admin-template-preview-panel">
              {selectedTemplate ? (
                <>
                  <div className="admin-template-preview-header">
                    <div>
                      <h3>{selectedTemplate.label}</h3>
                      <p>{selectedTemplate.description}</p>
                    </div>
                    <code>{selectedTemplate.sourcePath}</code>
                  </div>
                  <div className="admin-template-preview-wrap">
                    <iframe
                      className="admin-template-preview"
                      title={`${selectedTemplate.label} preview`}
                      srcDoc={selectedTemplate.html}
                    />
                  </div>
                </>
              ) : (
                <div className="admin-template-empty">
                  <h3>Select a template</h3>
                  <p className="admin-muted">Choose a template from the left to render its preview here.</p>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
