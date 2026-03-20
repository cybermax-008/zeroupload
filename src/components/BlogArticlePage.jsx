import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useParams, Navigate } from 'react-router-dom';
import { theme } from '../lib/theme';
import { BLOG_POSTS, BLOG_POST_BY_SLUG, BASE_URL } from '../lib/blogPosts';

export default function BlogArticlePage() {
  const { slug } = useParams();
  const post = BLOG_POST_BY_SLUG[slug];

  if (!post) return <Navigate to="/blog" replace />;

  const relatedPosts = BLOG_POSTS.filter(p => p.slug !== slug);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: { '@type': 'Organization', name: 'Acorn Tools' },
    publisher: {
      '@type': 'Organization',
      name: 'Acorn Tools',
      url: BASE_URL,
    },
    mainEntityOfPage: `${BASE_URL}/blog/${post.slug}`,
  };

  return (
    <>
      <Helmet>
        <title>{post.metaTitle}</title>
        <meta name="description" content={post.description} />
        <link rel="canonical" href={`${BASE_URL}/blog/${post.slug}`} />
        <meta property="og:title" content={post.metaTitle} />
        <meta property="og:description" content={post.description} />
        <meta property="og:url" content={`${BASE_URL}/blog/${post.slug}`} />
        <meta property="og:type" content="article" />
        <meta property="og:image" content={`${BASE_URL}/social-preview.png`} />
        <meta property="article:published_time" content={post.date} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.metaTitle} />
        <meta name="twitter:description" content={post.description} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      {/* ── Breadcrumb ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        marginBottom: 24, flexWrap: 'wrap',
      }}>
        <Link
          to="/"
          style={{
            fontFamily: theme.font,
            fontSize: 12, fontWeight: 500,
            padding: '6px 14px',
            borderRadius: 6,
            border: `1px solid ${theme.border}`,
            background: 'transparent',
            color: theme.textMuted,
            cursor: 'pointer',
            transition: theme.transition,
            display: 'flex', alignItems: 'center', gap: 6,
            textDecoration: 'none',
          }}
        >
          <span style={{ fontSize: 14 }}>←</span> All Tools
        </Link>
        <Link
          to="/blog"
          style={{
            fontFamily: theme.font,
            fontSize: 12, fontWeight: 500,
            color: theme.textMuted,
            textDecoration: 'none',
            transition: theme.transition,
          }}
        >
          Blog
        </Link>
        <span style={{ color: theme.textDim, fontSize: 11 }}>·</span>
        <span style={{ fontSize: 12, color: theme.textDim }}>
          {post.category}
        </span>
      </div>

      {/* ── Article header ── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          marginBottom: 12, flexWrap: 'wrap',
        }}>
          <span style={{
            fontSize: 10, fontWeight: 600,
            color: theme.accent,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            padding: '3px 8px',
            borderRadius: 4,
            background: theme.accentDim,
          }}>
            {post.category}
          </span>
          <span style={{ fontSize: 11, color: theme.textDim }}>
            {post.date} · {post.readTime}
          </span>
        </div>

        <h1 style={{
          fontSize: 24, fontWeight: 700,
          color: theme.text,
          lineHeight: 1.3,
          marginBottom: 0,
        }}>
          {post.title}
        </h1>
      </div>

      {/* ── Article body ── */}
      <article style={{ maxWidth: 640 }}>
        {post.sections.map((section, i) => (
          <section key={i} style={{ marginBottom: 32 }}>
            <h2 style={{
              fontSize: 17, fontWeight: 700,
              color: theme.text,
              marginBottom: 12,
              lineHeight: 1.3,
            }}>
              {section.heading}
            </h2>
            {section.paragraphs.map((p, j) => (
              <p key={j} style={{
                fontSize: 14, color: theme.textMuted,
                lineHeight: 1.8,
                marginBottom: 14,
              }}>
                {p}
              </p>
            ))}
          </section>
        ))}
      </article>

      {/* ── CTA section ── */}
      <div style={{
        background: theme.surface,
        border: `1px solid ${theme.border}`,
        borderRadius: theme.radiusLg,
        padding: '28px 24px',
        marginTop: 20,
        marginBottom: 36,
      }}>
        <div style={{
          fontSize: 15, fontWeight: 700,
          color: theme.text,
          marginBottom: 6,
        }}>
          Try these tools — no upload required
        </div>
        <p style={{
          fontSize: 13, color: theme.textMuted,
          lineHeight: 1.5,
          marginBottom: 16,
        }}>
          All processing happens in your browser. Your files never leave your device.
        </p>
        <div style={{
          display: 'flex', gap: 10,
          flexWrap: 'wrap',
        }}>
          {post.ctas.map((cta) => (
            <CtaButton key={cta.path} cta={cta} />
          ))}
        </div>
      </div>

      {/* ── Related posts ── */}
      {relatedPosts.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <h2 style={{
            fontSize: 12, fontWeight: 600,
            color: theme.textMuted,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            marginBottom: 12,
          }}>
            More articles
          </h2>
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            {relatedPosts.map((rp) => (
              <RelatedPostCard key={rp.slug} post={rp} />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// ══════════════════════════════════════════
// CtaButton
// ══════════════════════════════════════════
function CtaButton({ cta }) {
  const [hover, setHover] = useState(false);

  return (
    <Link
      to={cta.path}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        fontFamily: theme.font,
        fontSize: 13, fontWeight: 600,
        padding: '10px 18px',
        borderRadius: 8,
        border: `1px solid ${hover ? theme.accent : theme.border}`,
        background: hover ? theme.accentDim : 'transparent',
        color: hover ? theme.accent : theme.text,
        textDecoration: 'none',
        transition: theme.transition,
        display: 'inline-flex', alignItems: 'center', gap: 8,
      }}
    >
      <span style={{ color: theme.accent }}>{cta.icon}</span>
      {cta.label}
    </Link>
  );
}

// ══════════════════════════════════════════
// RelatedPostCard
// ══════════════════════════════════════════
function RelatedPostCard({ post }) {
  const [hover, setHover] = useState(false);

  return (
    <Link
      to={`/blog/${post.slug}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        fontFamily: theme.font,
        textDecoration: 'none',
        padding: '16px',
        borderRadius: theme.radius,
        border: `1px solid ${hover ? theme.borderActive : theme.border}`,
        background: hover ? theme.surfaceHover : theme.surface,
        cursor: 'pointer',
        transition: theme.transition,
        display: 'flex', flexDirection: 'column', gap: 4,
      }}
    >
      <span style={{
        fontSize: 10, fontWeight: 600,
        color: theme.accent,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
      }}>
        {post.category}
      </span>
      <span style={{
        fontSize: 14, fontWeight: 600,
        color: theme.text,
        lineHeight: 1.4,
      }}>
        {post.title}
      </span>
      <span style={{
        fontSize: 12, color: theme.textMuted,
        lineHeight: 1.4,
      }}>
        {post.readTime}
      </span>
    </Link>
  );
}
