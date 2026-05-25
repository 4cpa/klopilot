'use client';

// Inline-Script das vor React hydratiert — verhindert Flackern beim Laden
export function ThemeScript() {
  const script = `
    (function(){
      try {
        var t = localStorage.getItem('klo-theme') || 'system';
        var dark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
      } catch(e) {}
    })();
  `;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
