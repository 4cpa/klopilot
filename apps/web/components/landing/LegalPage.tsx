import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import type { ReactNode } from 'react';

interface Props {
  title: string;
  children: ReactNode;
}

export function LegalPage({ title, children }: Props) {
  return (
    <>
      {/* Minimal header */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          background: 'var(--paper)',
          borderBottom: '1px solid var(--line)',
          padding: '0 24px',
          height: 56,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <Link
          href="/"
          aria-label="Startseite"
          style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}
        >
          <Logo size={24} />
          <span
            style={{
              fontFamily: 'var(--font-fraunces)',
              fontWeight: 700,
              fontSize: 16,
              color: 'var(--ink)',
            }}
          >
            klopilot
          </span>
        </Link>
        <span style={{ color: 'var(--line)', fontWeight: 300 }}>|</span>
        <span style={{ fontSize: 14, color: 'var(--muted)' }}>{title}</span>

        <Link
          href="/"
          style={{
            marginLeft: 'auto',
            fontSize: 13,
            color: 'var(--muted)',
            textDecoration: 'none',
          }}
        >
          ← Startseite
        </Link>
      </header>

      {/* Content */}
      <main
        style={{
          maxWidth: 760,
          margin: '0 auto',
          padding: '48px 24px 96px',
        }}
      >
        <h1
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: 'clamp(28px, 5vw, 40px)',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: 'var(--ink)',
            marginBottom: 32,
          }}
        >
          {title}
        </h1>

        <div
          style={{
            fontSize: 16,
            lineHeight: 1.75,
            color: 'var(--ink)',
          }}
          className="legal-content"
        >
          {children}
        </div>
      </main>

      <style>{`
        .legal-content h2 {
          font-family: var(--font-fraunces);
          font-size: 22px;
          font-weight: 700;
          color: var(--ink);
          margin: 40px 0 12px;
        }
        .legal-content h3 {
          font-size: 17px;
          font-weight: 700;
          color: var(--ink);
          margin: 28px 0 8px;
        }
        .legal-content p {
          margin: 0 0 16px;
          color: var(--ink);
        }
        .legal-content a {
          color: var(--score-primary-text);
          text-decoration: underline;
          text-decoration-thickness: 1px;
          text-underline-offset: 2px;
        }
        .legal-content ul {
          padding-left: 20px;
          margin: 0 0 16px;
        }
        .legal-content li {
          margin-bottom: 6px;
        }
        .legal-content .meta {
          font-size: 14px;
          color: var(--muted);
          padding: 16px;
          background: var(--cream);
          border-radius: 8px;
          border: 1px solid var(--line);
          margin-bottom: 32px;
        }
      `}</style>
    </>
  );
}
