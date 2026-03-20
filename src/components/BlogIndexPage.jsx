import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { theme } from '../lib/theme';
import { BLOG_POSTS, BASE_URL } from '../lib/blogPosts';

export default function BlogIndexPage() {
  return (
    <>
      <Helmet>
        <title>Privacy & Compliance Blog — Acorn Tools</title>
        <meta name="description" content="Learn how browser-based file processing helps with HIPAA, GDPR, and privacy compliance. Guides for handling sensitive documents without uploading them." />
        <link rel="canonical" href={`${BASE_URL}/blog`} />
        <meta property="og:title" content="Privacy & Compliance Blog — Acorn Tools" />
        <meta property="og:description" content="Learn how browser-based file processing helps with HIPAA, GDPR, and privacy compliance." />
        <meta property="og:url" content={`${BASE_URL}/blog`} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={`${BASE_URL}/social-preview.png`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Privacy & Compliance Blog — Acorn Tools" />
        <meta name="twitter:description" content="Learn how browser-based file processing helps with HIPAA, GDPR, and privacy compliance." />
      </Helmet>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
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
      </div>

      <h1 style={{
        fontSize: 22, fontWeight: 700,
        color: theme.text,
        marginBottom: 6,
      }}>
        Privacy & Compliance Blog
      </h1>
      <p style={{
        fontSize: 13, color: theme.textMuted,
        lineHeight: 1.5, marginBottom: 28,
        maxWidth: 600,
      }}>
        Practical guides on processing sensitive documents safely — HIPAA, GDPR, and beyond.
      </p>

      <div style={{
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        {BLOG_POSTS.map((post) => (
          <BlogPostCard key={post.slug} post={post} />
        ))}
      </div>
    </>
  );
}

// ══════════════════════════════════════════
// BlogPostCard
// ══════════════════════════════════════════
function BlogPostCard({ post }) {
  const [hover, setHover] = useState(false);

  return (
    <Link
      to={`/blog/${post.slug}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        fontFamily: theme.font,
        textDecoration: 'none',
        padding: '24px 20px',
        borderRadius: theme.radius,
        border: `1px solid ${hover ? theme.borderActive : theme.border}`,
        background: hover ? theme.surfaceHover : theme.surface,
        cursor: 'pointer',
        transition: theme.transition,
        display: 'flex', flexDirection: 'column', gap: 8,
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        flexWrap: 'wrap',
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
        <span style={{
          fontSize: 11, color: theme.textDim,
        }}>
          {post.date} · {post.readTime}
        </span>
      </div>

      <div style={{
        fontSize: 16, fontWeight: 600,
        color: theme.text,
        lineHeight: 1.4,
      }}>
        {post.title}
      </div>

      <div style={{
        fontSize: 13, color: theme.textMuted,
        lineHeight: 1.5,
      }}>
        {post.description}
      </div>

      <span style={{
        fontSize: 12, fontWeight: 500,
        color: theme.accent,
        marginTop: 4,
      }}>
        Read article →
      </span>
    </Link>
  );
}
