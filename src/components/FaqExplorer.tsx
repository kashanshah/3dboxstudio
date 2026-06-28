"use client";

import { useMemo, useState } from "react";
import {
  FAQ_CATEGORIES,
  FAQ_ITEMS,
  type FaqCategoryId,
  type FaqItem,
  getCategoryLabel,
} from "@/content/faq";
import FaqList from "@/components/FaqList";

function normalizeQuery(value: string): string {
  return value.trim().toLowerCase();
}

function matchesSearch(item: FaqItem, query: string): boolean {
  if (!query) return true;
  const haystack = `${item.question} ${item.answer} ${getCategoryLabel(item.category)}`.toLowerCase();
  return haystack.includes(query);
}

export default function FaqExplorer() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<FaqCategoryId | "all">("all");

  const normalizedQuery = normalizeQuery(query);

  const filteredItems = useMemo(() => {
    return FAQ_ITEMS.filter((item) => {
      const categoryMatch = category === "all" || item.category === category;
      return categoryMatch && matchesSearch(item, normalizedQuery);
    });
  }, [category, normalizedQuery]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<FaqCategoryId | "all", number>();
    counts.set("all", FAQ_ITEMS.length);
    for (const { id } of FAQ_CATEGORIES) {
      counts.set(id, 0);
    }
    for (const item of FAQ_ITEMS) {
      counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
    }
    return counts;
  }, []);

  return (
    <div className="faq-explorer">
      <div className="faq-explorer-toolbar">
        <label className="faq-search">
          <span className="visually-hidden">Search FAQs</span>
          <svg
            className="faq-search-icon"
            viewBox="0 0 24 24"
            width={18}
            height={18}
            aria-hidden
          >
            <circle
              cx="11"
              cy="11"
              r="7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M20 20l-4-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <input
            type="search"
            className="faq-search-input"
            placeholder="Search questions, answers, topics…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
          {query ? (
            <button
              type="button"
              className="faq-search-clear"
              onClick={() => setQuery("")}
              aria-label="Clear search"
            >
              ×
            </button>
          ) : null}
        </label>

        <div
          className="faq-filters"
          role="group"
          aria-label="Filter by category"
        >
          <button
            type="button"
            className={`faq-filter-chip${category === "all" ? " is-active" : ""}`}
            aria-pressed={category === "all"}
            onClick={() => setCategory("all")}
          >
            All
            <span className="faq-filter-count">{categoryCounts.get("all")}</span>
          </button>
          {FAQ_CATEGORIES.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              className={`faq-filter-chip${category === id ? " is-active" : ""}`}
              aria-pressed={category === id}
              onClick={() => setCategory(id)}
            >
              {label}
              <span className="faq-filter-count">{categoryCounts.get(id)}</span>
            </button>
          ))}
        </div>
      </div>

      <p className="faq-results-meta" aria-live="polite">
        {filteredItems.length === FAQ_ITEMS.length && !normalizedQuery && category === "all"
          ? `${FAQ_ITEMS.length} questions`
          : `${filteredItems.length} of ${FAQ_ITEMS.length} questions`}
      </p>

      {filteredItems.length > 0 ? (
        <FaqList items={filteredItems} showCategory />
      ) : (
        <div className="faq-empty">
          <p>No questions match your search.</p>
          <button
            type="button"
            className="faq-empty-reset"
            onClick={() => {
              setQuery("");
              setCategory("all");
            }}
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
