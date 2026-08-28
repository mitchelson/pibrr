import Link from "next/link";
import type { ReactNode } from "react";
import { SiteShell } from "@/components/site-shell";
import { CHURCH_INFO } from "@/lib/constants";
import { LEGAL_NAV } from "@/lib/nav-config";

interface LegalPageShellProps {
  title: string;
  subtitle?: string;
  updatedAt: string;
  children: ReactNode;
}

export function LegalPageShell({
  title,
  subtitle,
  updatedAt,
  children,
}: LegalPageShellProps) {
  return (
    <SiteShell hideFooter>
      <article className="mx-auto max-w-3xl px-4 py-10 md:py-14">
        <p className="site-label mb-2 text-muted-foreground">
          {CHURCH_INFO.NAME}
        </p>
        <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-3 text-lg text-muted-foreground">{subtitle}</p>
        ) : null}
        <p className="mt-4 text-sm text-muted-foreground">
          Última atualização: {updatedAt}
        </p>

        <div className="prose prose-gray mt-10 max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-foreground prose-a:no-underline hover:prose-a:underline">
          {children}
        </div>
      </article>

      <footer className="border-t border-border bg-muted/40">
        <div className="mx-auto max-w-3xl px-4 py-8">
          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            {LEGAL_NAV.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/contato"
              className="text-sm text-muted-foreground hover:text-primary"
            >
              Contato
            </Link>
          </nav>
          <p className="mt-6 text-xs text-muted-foreground">
            © {new Date().getFullYear()} {CHURCH_INFO.NAME}. Todos os direitos
            reservados.
          </p>
        </div>
      </footer>
    </SiteShell>
  );
}
