"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "🔍 Cerca", exact: true },
  { href: "/leads", label: "📋 Lead" },
  { href: "/whatsapp", label: "💬 WhatsApp" },
  { href: "/settings", label: "⚙️ Impostazioni" },
];

export function Sidebar() {
  const path = usePathname();
  return (
    <aside className="sidebar">
      <div className="brand">Lead<span className="dot">·</span>Machine</div>
      <div className="tagline">Trova → Demo → Contatta</div>
      <nav>
        {LINKS.map((l) => {
          const active = l.exact ? path === l.href : path.startsWith(l.href);
          return (
            <Link key={l.href} href={l.href} className={`navlink ${active ? "active" : ""}`}>
              {l.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
