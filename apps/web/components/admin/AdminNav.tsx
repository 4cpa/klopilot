'use client';

import { usePathname } from 'next/navigation';

const LINKS: { href: string; label: string; roles: string[] }[] = [
  { href: '/admin', label: '🔧 Moderation', roles: ['moderator', 'admin'] },
  { href: '/admin/toilets', label: '🚽 Toiletten', roles: ['moderator', 'admin'] },
  { href: '/admin/users', label: '👤 Benutzer', roles: ['admin'] },
  { href: '/admin/data', label: '📊 Daten', roles: ['admin'] },
];

export function AdminNav({ role }: { role: string }) {
  const pathname = usePathname();
  const links = LINKS.filter((l) => l.roles.includes(role));

  return (
    <nav
      style={{
        display: 'flex',
        gap: 4,
        padding: '8px 24px',
        background: 'var(--cream)',
        borderBottom: '1px solid var(--line)',
        overflowX: 'auto',
      }}
    >
      {links.map((l) => {
        const active = pathname === l.href;
        return (
          <a
            key={l.href}
            href={l.href}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              color: active ? '#fff' : 'var(--muted)',
              background: active ? 'var(--btn-primary-bg)' : 'transparent',
            }}
          >
            {l.label}
          </a>
        );
      })}
    </nav>
  );
}
