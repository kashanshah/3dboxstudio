"use client";

import { Link } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  BLOG_CATEGORIES,
  BLOG_POSTS,
  getBlogCategory,
  getBlogPostImageAlt,
  getBlogPostImagePath,
  type BlogCategoryId,
  type BlogPost,
} from "@/content/blogPosts";
import { getLocalizedBlogIndexPost, hasBlogTranslation } from "@/content/blogLocales";
import type { Locale } from "@/i18n/config";

function formatDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function normalizeQuery(value: string): string {
  return value.trim().toLowerCase();
}

function matchesSearch(post: BlogPost, query: string, categoryLabel: string): boolean {
  if (!query) return true;
  const haystack = [
    post.title,
    post.description,
    categoryLabel,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

export default function BlogExplorer() {
  const locale = useLocale() as Locale;
  const t = useTranslations("blog.index");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<BlogCategoryId | "all">("all");

  const normalizedQuery = normalizeQuery(query);

  function getCategoryLabel(id: BlogCategoryId): string {
    return t(`categories.${id}`);
  }

  const sortedPosts = useMemo(
    () =>
      BLOG_POSTS.map((post) => getLocalizedBlogIndexPost(post.slug, locale) ?? post).sort((a, b) =>
        b.published.localeCompare(a.published)
      ),
    [locale],
  );

  const filteredPosts = useMemo(() => {
    return sortedPosts.filter((post) => {
      const postCategory = getBlogCategory(post.slug);
      const categoryMatch = category === "all" || postCategory === category;
      return categoryMatch && matchesSearch(post, normalizedQuery, getCategoryLabel(postCategory));
    });
  }, [category, normalizedQuery, sortedPosts, t]);

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
          <span className="visually-hidden">{t("searchLabel")}</span>
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
            placeholder={t("searchPlaceholder")}
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
              aria-label={t("clearSearch")}
            >
              ×
            </button>
          ) : null}
        </label>

        <div
          className="faq-filters"
          role="group"
          aria-label={t("filterByTopic")}
        >
          <button
            type="button"
            className={`faq-filter-chip${category === "all" ? " is-active" : ""}`}
            aria-pressed={category === "all"}
            onClick={() => setCategory("all")}
          >
            {t("all")}
            <span className="faq-filter-count">{categoryCounts.get("all")}</span>
          </button>
          {BLOG_CATEGORIES.map(({ id }) => (
            <button
              key={id}
              type="button"
              className={`faq-filter-chip${category === id ? " is-active" : ""}`}
              aria-pressed={category === id}
              onClick={() => setCategory(id)}
            >
              {getCategoryLabel(id)}
              <span className="faq-filter-count">{categoryCounts.get(id)}</span>
            </button>
          ))}
        </div>
      </div>

      <p className="faq-results-meta" aria-live="polite">
        {filteredPosts.length === BLOG_POSTS.length &&
        !normalizedQuery &&
        category === "all"
          ? t("resultsAll", { count: BLOG_POSTS.length })
          : t("resultsFiltered", {
              count: filteredPosts.length,
              total: BLOG_POSTS.length,
            })}
      </p>

      {filteredPosts.length > 0 ? (
        <ul className="blog-index-list">
          {filteredPosts.map((post) => (
            <li key={post.slug} className="blog-index-card">
              <Link
                href={`/blog/${post.slug}`}
                className="blog-index-thumb-link"
              >
                <img
                  className="blog-index-thumb"
                  src={getBlogPostImagePath(post.slug)}
                  alt={getBlogPostImageAlt(post)}
                  width={1200}
                  height={800}
                  loading="lazy"
                  decoding="async"
                />
              </Link>
              <span className="faq-item-category">
                {getCategoryLabel(getBlogCategory(post.slug))}
              </span>
              <p className="blog-index-meta">
                <time dateTime={post.published}>{formatDate(post.published, locale)}</time>
                <span aria-hidden> · </span>
                {t("readMinutes", { minutes: post.readMinutes })}
              </p>
              <h2 className="blog-index-title">
                <Link href={`/blog/${post.slug}`}>{post.title}</Link>
              </h2>
              <p className="blog-index-desc">{post.description}</p>
              {locale !== "en" && !hasBlogTranslation(locale, post.slug) ? (
                <p className="blog-locale-note">{t("fullArticleEnglishOnly")}</p>
              ) : null}
              <Link href={`/blog/${post.slug}`} className="blog-index-link">
                {t("readArticle")}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="faq-empty">
          <p>{t("empty")}</p>
          <button
            type="button"
            className="faq-empty-reset"
            onClick={() => {
              setQuery("");
              setCategory("all");
            }}
          >
            {t("clearFilters")}
          </button>
        </div>
      )}
    </div>
  );
}
