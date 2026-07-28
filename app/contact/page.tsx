"use client";

import { useState } from "react";
import Link from "next/link";

type Fields = Partial<Record<"name" | "email" | "subject" | "message", string>>;

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [fields, setFields] = useState<Fields>({});
  const [status, setStatus] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [msg, setMsg] = useState<string | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("busy");
    setFields({});
    setMsg(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (res.status === 422) {
        setFields(data?.error?.fields ?? {});
        setStatus("error");
        setMsg("Some fields need attention.");
        return;
      }
      if (!res.ok) {
        setStatus("error");
        setMsg(data?.error?.message ?? "Could not send the message.");
        return;
      }

      setStatus("done");
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch {
      setStatus("error");
      setMsg("Network error. Try again.");
    }
  };

  return (
    <div className="wrap" style={{ padding: "40px 0 90px" }}>
      <div className="crumbs" style={{ padding: 0, marginBottom: 20 }}>
        <Link href="/">Home</Link> · Contact
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "start" }}>
        <div>
          <span className="eyebrow">Contact</span>
          <h1 className="serif" style={{ fontSize: 38, margin: "10px 0 14px", letterSpacing: "-.015em" }}>
            A question, a problem, an idea
          </h1>
          <p style={{ color: "var(--muted)", maxWidth: "42ch" }}>
            Ask us anything about picking gear, shipping or returns. We answer the
            same day on weekdays.
          </p>

          <table className="spec" style={{ marginTop: 30 }}>
            <tbody>
              <tr><td>Email</td><td>hello@tare.example</td></tr>
              <tr><td>Phone</td><td>+1 (555) 010 0100</td></tr>
              <tr><td>Address</td><td>Portland, Oregon</td></tr>
              <tr><td>Hours</td><td>Weekdays, 9am to 6pm</td></tr>
            </tbody>
          </table>
        </div>

        <form className="form" onSubmit={submit} noValidate>
          {status === "done" && (
            <div className="alert ok" data-testid="contact-success">
              Message received. We will get back to you shortly.
            </div>
          )}
          {status === "error" && msg && <div className="alert err">{msg}</div>}

          <div className="field">
            <label htmlFor="name">Full name</label>
            <input id="name" value={form.name} onChange={set("name")} aria-invalid={!!fields.name} />
            {fields.name && <div className="err">{fields.name}</div>}
          </div>

          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={form.email} onChange={set("email")} aria-invalid={!!fields.email} />
            {fields.email && <div className="err">{fields.email}</div>}
          </div>

          <div className="field">
            <label htmlFor="subject">Subject</label>
            <input id="subject" value={form.subject} onChange={set("subject")} aria-invalid={!!fields.subject} />
            {fields.subject && <div className="err">{fields.subject}</div>}
          </div>

          <div className="field">
            <label htmlFor="message">Message</label>
            <textarea id="message" value={form.message} onChange={set("message")} aria-invalid={!!fields.message} />
            {fields.message && <div className="err">{fields.message}</div>}
          </div>

          <button className="btn" type="submit" disabled={status === "busy"} data-testid="contact-submit">
            {status === "busy" ? "Sending…" : "Send message"}
          </button>
        </form>
      </div>
    </div>
  );
}
