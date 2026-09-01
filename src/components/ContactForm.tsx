"use client";

import { useState, type FormEvent } from "react";
import { CONTACT_TOPICS } from "@/content/contact";

type ContactFormProps = {
  initialStatus?: "idle" | "success" | "error";
};

type SubmitResponse = {
  ok?: boolean;
  error?: string;
  message?: string;
  redirectUrl?: string | null;
};

export default function ContactForm({ initialStatus = "idle" }: ContactFormProps) {
  const [status, setStatus] = useState<"idle" | "success" | "error">(initialStatus);
  const [error, setError] = useState<string | null>(
    initialStatus === "error" ? "Something went wrong. Please try again." : null,
  );
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setStatus("idle");
    setLoading(true);

    const form = e.currentTarget;
    const data = new FormData(form);
    const payload = {
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      topic: String(data.get("topic") ?? ""),
      subject: String(data.get("subject") ?? ""),
      message: String(data.get("message") ?? ""),
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await res.json().catch(() => ({}))) as SubmitResponse;

      if (body.redirectUrl) {
        window.location.href = body.redirectUrl;
        return;
      }

      if (!res.ok || body.ok === false) {
        setStatus("error");
        setError(body.error ?? "Could not send your message. Please try again.");
        return;
      }

      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
      setError("Could not send your message. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  if (status === "success") {
    return (
      <div className="contact-form-success" role="status">
        <div className="contact-form-success-icon" aria-hidden>
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.75" />
            <path
              d="M8 12.5l2.5 2.5L16 9"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h2>Message sent</h2>
        <p>Thanks for reaching out. We&apos;ll get back to you at the email you provided.</p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setStatus("idle");
            setError(null);
          }}
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form className="contact-form" onSubmit={onSubmit} noValidate>
      {error ? (
        <p className="contact-form-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="contact-form-grid">
        <div className="contact-field">
          <label htmlFor="contact-name">Name</label>
          <input
            id="contact-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            maxLength={120}
            placeholder="Your name"
          />
        </div>

        <div className="contact-field">
          <label htmlFor="contact-email">Email</label>
          <input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            placeholder="you@example.com"
          />
        </div>
      </div>

      <div className="contact-form-grid">
        <div className="contact-field">
          <label htmlFor="contact-topic">Topic</label>
          <select id="contact-topic" name="topic" required defaultValue={CONTACT_TOPICS[0].value}>
            <option value="" disabled>
              Select a topic
            </option>
            {CONTACT_TOPICS.map((topic) => (
              <option key={topic.value} value={topic.value}>
                {topic.label}
              </option>
            ))}
          </select>
        </div>

        <div className="contact-field">
          <label htmlFor="contact-subject">Subject</label>
          <input
            id="contact-subject"
            name="subject"
            type="text"
            required
            maxLength={200}
            placeholder="Brief summary"
          />
        </div>
      </div>

      <div className="contact-field">
        <label htmlFor="contact-message">Message</label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={6}
          maxLength={5000}
          placeholder="Tell us how we can help…"
        />
      </div>

      <div className="contact-form-actions">
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Sending…" : "Send message"}
        </button>
        <p className="contact-form-note">
          We usually reply within a few business days. For quick answers, check the{" "}
          <a href="/faq">FAQ</a>.
        </p>
      </div>
    </form>
  );
}
