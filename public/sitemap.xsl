<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <xsl:output method="html" encoding="UTF-8" indent="yes"/>

  <xsl:template match="/">
    <html lang="en">
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <title>3D Box Studio Sitemap</title>
        <style>
          :root {
            color-scheme: light dark;
            --bg: #0b1020;
            --panel: rgba(15, 23, 42, 0.82);
            --border: rgba(148, 163, 184, 0.22);
            --text: #e5eefc;
            --muted: #9fb1cc;
            --accent: #60a5fa;
            --accent-soft: rgba(96, 165, 250, 0.14);
            --table-head: rgba(30, 41, 59, 0.82);
          }

          * { box-sizing: border-box; }
          body {
            margin: 0;
            font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            background:
              radial-gradient(circle at top left, rgba(37, 99, 235, 0.18), transparent 32rem),
              linear-gradient(180deg, #0b1020 0%, #111827 100%);
            color: var(--text);
          }
          .wrap {
            width: min(1180px, calc(100% - 2rem));
            margin: 0 auto;
            padding: 2rem 0 3rem;
          }
          .hero {
            margin-bottom: 1.25rem;
            padding: 1.4rem 1.5rem;
            border: 1px solid var(--border);
            border-radius: 20px;
            background: var(--panel);
            backdrop-filter: blur(12px);
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.22);
          }
          .eyebrow {
            margin: 0 0 0.45rem;
            color: var(--accent);
            font-size: 0.78rem;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }
          h1 {
            margin: 0;
            font-size: clamp(1.65rem, 4vw, 2.4rem);
            line-height: 1.12;
          }
          .lead {
            margin: 0.8rem 0 0;
            max-width: 72ch;
            color: var(--muted);
            line-height: 1.6;
          }
          .stats {
            display: flex;
            flex-wrap: wrap;
            gap: 0.75rem;
            margin-top: 1rem;
          }
          .stat {
            min-width: 10rem;
            padding: 0.85rem 1rem;
            border: 1px solid var(--border);
            border-radius: 14px;
            background: rgba(255, 255, 255, 0.03);
          }
          .stat strong {
            display: block;
            font-size: 1.15rem;
          }
          .stat span {
            color: var(--muted);
            font-size: 0.82rem;
          }
          .table-wrap {
            overflow: auto;
            border: 1px solid var(--border);
            border-radius: 20px;
            background: var(--panel);
            backdrop-filter: blur(12px);
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.22);
          }
          table {
            width: 100%;
            border-collapse: collapse;
            min-width: 880px;
          }
          thead th {
            position: sticky;
            top: 0;
            z-index: 1;
            text-align: left;
            font-size: 0.78rem;
            letter-spacing: 0.04em;
            text-transform: uppercase;
            color: var(--muted);
            background: var(--table-head);
          }
          th, td {
            padding: 0.9rem 1rem;
            border-bottom: 1px solid var(--border);
            vertical-align: top;
          }
          tbody tr:hover td {
            background: rgba(255, 255, 255, 0.03);
          }
          a {
            color: var(--accent);
            text-decoration: none;
          }
          a:hover { text-decoration: underline; }
          .url {
            max-width: 40rem;
            word-break: break-word;
          }
          .muted {
            color: var(--muted);
            font-size: 0.82rem;
          }
          .badge-list {
            display: flex;
            flex-wrap: wrap;
            gap: 0.4rem;
          }
          .badge {
            display: inline-flex;
            align-items: center;
            padding: 0.22rem 0.5rem;
            border-radius: 999px;
            background: var(--accent-soft);
            color: #cfe4ff;
            font-size: 0.76rem;
            white-space: nowrap;
          }
        </style>
      </head>
      <body>
        <div class="wrap">
          <section class="hero">
            <p class="eyebrow">XML Sitemap</p>
            <h1>3D Box Studio sitemap</h1>
            <p class="lead">
              Human-friendly view of the sitemap XML. Search engines still receive the same valid sitemap data,
              including localized alternate links.
            </p>
            <div class="stats">
              <div class="stat">
                <strong><xsl:value-of select="count(sitemap:urlset/sitemap:url)"/></strong>
                <span>Total URLs</span>
              </div>
              <div class="stat">
                <strong><xsl:value-of select="count(sitemap:urlset/sitemap:url/xhtml:link)"/></strong>
                <span>Alternate links</span>
              </div>
            </div>
          </section>

          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>URL</th>
                  <th>Last Modified</th>
                  <th>Alternates</th>
                </tr>
              </thead>
              <tbody>
                <xsl:for-each select="sitemap:urlset/sitemap:url">
                  <tr>
                    <td class="url">
                      <a>
                        <xsl:attribute name="href"><xsl:value-of select="sitemap:loc"/></xsl:attribute>
                        <xsl:value-of select="sitemap:loc"/>
                      </a>
                    </td>
                    <td>
                      <xsl:value-of select="substring(sitemap:lastmod, 1, 19)"/>
                      <div class="muted">UTC timestamp</div>
                    </td>
                    <td>
                      <div class="badge-list">
                        <xsl:for-each select="xhtml:link">
                          <span class="badge">
                            <xsl:value-of select="@hreflang"/>
                          </span>
                        </xsl:for-each>
                      </div>
                    </td>
                  </tr>
                </xsl:for-each>
              </tbody>
            </table>
          </div>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
