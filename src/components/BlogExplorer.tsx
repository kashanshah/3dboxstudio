"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  BLOG_CATEGORIES,
  BLOG_POSTS,
  getBlogCategory,
  getBlogCategoryLabel,
  type BlogCategoryId,
  type BlogPost,
} from "@/content/blogPosts";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function normalizeQuery(value: string): string {
  return value.trim().toLowerCase();
}

function matchesSearch(post: BlogPost, query: string): boolean {
  if (!query) return true;
  const category = getBlogCategoryLabel(getBlogCategory(post.slug));
  const haystack = [
    post.title,
    post.description,
    post.keywords.join(" "),
    category,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

export default function BlogExplorer() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<BlogCategoryId | "all">("all");

  const normalizedQuery = normalizeQuery(query);

  const sortedPosts = useMemo(
    () =>
      [...BLOG_POSTS].sort((a, b) => b.published.localeCompare(a.published)),
    [],
  );

  const filteredPosts = useMemo(() => {
    return sortedPosts.filter((post) => {
      const postCategory = getBlogCategory(post.slug);
      const categoryMatch = category === "all" || postCategory === category;
      return categoryMatch && matchesSearch(post, normalizedQuery);
    });
  }, [category, normalizedQuery, sortedPosts]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<BlogCategoryId | "all", number>();
    counts.set("all", BLOG_POSTS.length);
    for (const { id } of BLOG_CATEGORIES) {
      counts.set(id, 0);
    }
    for (const post of BLOG_POSTS) {
      const id = getBlogCategory(post.slug);
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    return counts;
  }, []);

  return (
    <div className="blog-explorer">
      <div className="faq-explorer-toolbar">
        <label className="faq-search">
          <span className="visually-hidden">Search articles</span>
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
            placeholder="Search titles, topics, keywords…"
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
          aria-label="Filter by topic"
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
          {BLOG_CATEGORIES.map(({ id, label }) => (
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
        {filteredPosts.length === BLOG_POSTS.length &&
        !normalizedQuery &&
        category === "all"
          ? `${BLOG_POSTS.length} articles`
          : `${filteredPosts.length} of ${BLOG_POSTS.length} articles`}
      </p>

      {filteredPosts.length > 0 ? (
        <ul className="blog-index-list">
          {filteredPosts.map((post) => (
            <li key={post.slug} className="blog-index-card">
              <span className="faq-item-category">
                {getBlogCategoryLabel(getBlogCategory(post.slug))}
              </span>
              <p className="blog-index-meta">
                <time dateTime={post.published}>{formatDate(post.published)}</time>
                <span aria-hidden> · </span>
                {post.readMinutes} min read
              </p>
              <h2 className="blog-index-title">
                <Link href={`/blog/${post.slug}`}>{post.title}</Link>
              </h2>
              <p className="blog-index-desc">{post.description}</p>
              <p className="blog-index-keywords">
                {post.keywords.join(" · ")}
              </p>
              <Link href={`/blog/${post.slug}`} className="blog-index-link">
                Read article →
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="faq-empty">
          <p>No articles match your search.</p>
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
