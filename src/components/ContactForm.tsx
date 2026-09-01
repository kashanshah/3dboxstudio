"use client";

import { useRef, useState, type FormEvent } from "react";
import { CONTACT_TOPICS } from "@/content/contact";
import TurnstileWidget, { type TurnstileWidgetHandle } from "@/components/TurnstileWidget";

type ContactFormProps = {
  initialStatus?: "idle" | "success" | "error";
};

type SubmitResponse = {
  ok?: boolean;
  error?: string;
  message?: string;
  redirectUrl?: string | null;
};

type ContactField = "name" | "email" | "topic" | "subject" | "message";
type FieldErrors = Partial<Record<ContactField, string>>;

const FIELD_ORDER: ContactField[] = ["name", "email", "topic", "subject", "message"];
const FIELD_IDS: Record<ContactField, string> = {
  name: "contact-name",
  email: "contact-email",
  topic: "contact-topic",
  subject: "contact-subject",
  message: "contact-message",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_TOPICS = new Set<string>(CONTACT_TOPICS.map((topic) => topic.value));

function readField(data: FormData, name: ContactField): string {
  return String(data.get(name) ?? "").trim();
}

function validateContactFields(data: FormData): FieldErrors {
  const errors: FieldErrors = {};
  const name = readField(data, "name");
  const email = readField(data, "email");
  const topic = String(data.get("topic") ?? "");
  const subject = readField(data, "subject");
  const message = readField(data, "message");

  if (!name) errors.name = "Enter your name.";
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    errors.email = "Enter a valid email address.";
  }
  if (!VALID_TOPICS.has(topic)) errors.topic = "Choose a topic.";
  if (!subject) errors.subject = "Enter a subject.";
  if (!message) errors.message = "Enter a message.";
  return errors;
}

function firstInvalidField(errors: FieldErrors): ContactField | null {
  return FIELD_ORDER.find((field) => errors[field]) ?? null;
}

export default function ContactForm({ initialStatus = "idle" }: ContactFormProps) {
  const [status, setStatus] = useState<"idle" | "success" | "error">(initialStatus);
  const [error, setError] = useState<string | null>(
    initialStatus === "error" ? "Something went wrong. Please try again." : null,
  );
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);

  function clearFieldError(field: string) {
    if (!(field in fieldErrors)) return;
    setFieldErrors((current) => {
      if (!current[field as ContactField]) return current;
      const next = { ...current };
      delete next[field as ContactField];
      return next;
    });
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setStatus("idle");

    const form = e.currentTarget;
    const data = new FormData(form);
    const nextFieldErrors = validateContactFields(data);
    setFieldErrors(nextFieldErrors);

    const invalid = firstInvalidField(nextFieldErrors);
    if (invalid) {
      document.getElementById(FIELD_IDS[invalid])?.focus();
      return;
    }

    if (!turnstileToken) {
      setStatus("error");
      setError("Please complete the verification and try again.");
      return;
    }

    setLoading(true);

    const payload = {
      name: readField(data, "name"),
      email: readField(data, "email"),
      topic: String(data.get("topic") ?? ""),
      subject: readField(data, "subject"),
      message: readField(data, "message"),
      turnstileToken,
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
        setTurnstileToken(null);
        turnstileRef.current?.reset();
        return;
      }

      setStatus("success");
      setTurnstileToken(null);
      setFieldErrors({});
      form.reset();
    } catch {
      setStatus("error");
      setError("Could not send your message. Please check your connection and try again.");
      setTurnstileToken(null);
      turnstileRef.current?.reset();
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
            setFieldErrors({});
          }}
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form
      className="contact-form"
      onSubmit={onSubmit}
      onChange={(e) => {
        const target = e.target;
        if (
          target instanceof HTMLInputElement ||
          target instanceof HTMLSelectElement ||
          target instanceof HTMLTextAreaElement
        ) {
          clearFieldError(target.name);
        }
      }}
      noValidate
    >
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
            aria-invalid={fieldErrors.name ? true : undefined}
            aria-describedby={fieldErrors.name ? "contact-name-error" : undefined}
          />
          {fieldErrors.name ? (
            <p id="contact-name-error" className="contact-field-error">
              {fieldErrors.name}
            </p>
          ) : null}
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
            aria-invalid={fieldErrors.email ? true : undefined}
            aria-describedby={fieldErrors.email ? "contact-email-error" : undefined}
          />
          {fieldErrors.email ? (
            <p id="contact-email-error" className="contact-field-error">
              {fieldErrors.email}
            </p>
          ) : null}
        </div>
      </div>

      <div className="contact-form-grid">
        <div className="contact-field">
          <label htmlFor="contact-topic">Topic</label>
          <select
            id="contact-topic"
            name="topic"
            required
            defaultValue={CONTACT_TOPICS[0].value}
            aria-invalid={fieldErrors.topic ? true : undefined}
            aria-describedby={fieldErrors.topic ? "contact-topic-error" : undefined}
          >
            <option value="" disabled>
              Select a topic
            </option>
            {CONTACT_TOPICS.map((topic) => (
              <option key={topic.value} value={topic.value}>
                {topic.label}
              </option>
            ))}
          </select>
          {fieldErrors.topic ? (
            <p id="contact-topic-error" className="contact-field-error">
              {fieldErrors.topic}
            </p>
          ) : null}
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
            aria-invalid={fieldErrors.subject ? true : undefined}
            aria-describedby={fieldErrors.subject ? "contact-subject-error" : undefined}
          />
          {fieldErrors.subject ? (
            <p id="contact-subject-error" className="contact-field-error">
              {fieldErrors.subject}
            </p>
          ) : null}
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
          aria-invalid={fieldErrors.message ? true : undefined}
          aria-describedby={fieldErrors.message ? "contact-message-error" : undefined}
        />
        {fieldErrors.message ? (
          <p id="contact-message-error" className="contact-field-error">
            {fieldErrors.message}
          </p>
        ) : null}
      </div>

      <TurnstileWidget ref={turnstileRef} onToken={setTurnstileToken} />

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
