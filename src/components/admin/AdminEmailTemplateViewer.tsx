import { getEmailTemplatePreviews } from "@/server/email/templates";

export default function AdminEmailTemplateViewer() {
  const templates = getEmailTemplatePreviews();

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

        <div className="admin-template-grid">
          {templates.map((template) => (
            <section key={template.id} className="admin-template-card">
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

              <iframe
                className="admin-template-preview"
                title={`${template.label} preview`}
                srcDoc={template.html}
              />
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
