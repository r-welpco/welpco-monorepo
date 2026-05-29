"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

/**
 * SearchBar — pill-shaped two-input + submit button.
 *
 * Faithful port of `.design-reference/project/components/hero.jsx` `SearchBar`.
 *
 * Day 9 wiring: submitting the form now navigates to `/search?q=&postalCode=` —
 * `/search` is a thin client redirect that forwards to `/dashboard/search`
 * preserving the query string. This makes the hero functional without
 * coupling the marketing shell to the dashboard route directly.
 */

interface SearchBarProps {
  tone?: "light" | "dark";
}

export function SearchBar({ tone = "light" }: SearchBarProps) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const dark = tone === "dark";

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (postalCode.trim()) params.set("postalCode", postalCode.trim());
    const qs = params.toString();
    router.push(qs ? `/search?${qs}` : "/search");
  }

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      aria-label="Find a service"
      data-searchbar
      style={{
        display: "grid",
        gridTemplateColumns: "1.6fr 1fr auto",
        gap: 0,
        padding: 6,
        background: dark ? "rgba(250,241,229,0.96)" : "var(--card)",
        border: `1px solid ${dark ? "rgba(0,73,47,0.10)" : "var(--line)"}`,
        borderRadius: 999,
        boxShadow: "0 24px 60px -28px rgba(0,73,47,0.40)",
        alignItems: "center",
        width: "100%",
        maxWidth: 640,
      }}
    >
      <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 18px" }}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <circle cx="8" cy="8" r="5.5" stroke="var(--evergreen)" strokeWidth="1.6" />
          <path d="M12.5 12.5L16 16" stroke="var(--evergreen)" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <input
          name="q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="What do you need a hand with?"
          aria-label="What do you need a hand with?"
          autoComplete="off"
          style={{
            border: "none",
            outline: "none",
            background: "transparent",
            padding: "14px 0",
            fontFamily: "var(--font-body)",
            fontSize: 15,
            color: "var(--evergreen)",
            width: "100%",
          }}
        />
      </label>
      <label
        data-searchbar-zip
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          borderLeft: "1px solid rgba(0,73,47,0.16)",
          padding: "0 18px",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M8 14s5-4.2 5-8.5A5 5 0 1 0 3 5.5C3 9.8 8 14 8 14z" stroke="var(--evergreen)" strokeWidth="1.6" />
          <circle cx="8" cy="6" r="1.6" stroke="var(--evergreen)" strokeWidth="1.6" />
        </svg>
        <input
          name="postalCode"
          value={postalCode}
          onChange={(e) => setPostalCode(e.target.value)}
          placeholder="Your postal code"
          aria-label="Your postal code"
          inputMode="text"
          autoComplete="postal-code"
          maxLength={10}
          style={{
            border: "none",
            outline: "none",
            background: "transparent",
            padding: "14px 0",
            fontFamily: "var(--font-body)",
            fontSize: 15,
            color: "var(--evergreen)",
            width: "100%",
          }}
        />
      </label>
      <button type="submit" className="btn btn-primary" style={{ padding: "14px 22px" }}>
        Search
      </button>
    </form>
  );
}
