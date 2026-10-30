export function NavSymbol({ name }: { name: 'explore' | 'satellite' | 'prepare' | 'drill' | 'research' | 'ddpm' }) {
  return <svg className="nav-symbol" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    {name === 'explore' && <><path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2Z"/><path d="M9 3v16M15 5v16"/></>}
    {name === 'satellite' && <><path d="m9 7 8 8-3 3-8-8Z"/><path d="m3 5 3-3 4 4-3 3ZM15 17l3-3 4 4-3 3ZM14 4a7 7 0 0 1 6 6M14 8a3 3 0 0 1 2 2"/></>}
    {name === 'prepare' && <><path d="M9 4H5v17h14V4h-4M9 3h6v4H9Z"/><path d="m8 14 3 3 5-6"/></>}
    {name === 'drill' && <><circle cx="15" cy="4" r="2"/><path d="m10 10 3-3 3 4 4 1M13 7l-2 7 4 3 1 5M11 14l-3 5H3M6 8l4 2"/></>}
    {name === 'research' && <><path d="M12 5C9 3 6 3 3 4v16c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1ZM12 5v16"/><path d="M6 8h3M6 12h3M15 8h3M15 12h3"/></>}
    {name === 'ddpm' && <><path d="M12 2L4 22h8z" /><circle cx="12" cy="9" r="1.5" /></>}
  </svg>;
}
