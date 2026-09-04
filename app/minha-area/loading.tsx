/** Skeleton imediato enquanto o RSC da minha-área carrega. */
export default function MinhaAreaLoading() {
  return (
    <div className="pib-page pib-stack" aria-busy="true" aria-label="Carregando">
      <div className="space-y-3">
        <div className="h-3 w-24 animate-pulse rounded bg-black/[0.06]" />
        <div className="h-9 w-48 animate-pulse rounded bg-black/[0.07]" />
        <div className="h-4 w-72 max-w-full animate-pulse rounded bg-black/[0.05]" />
      </div>

      <div className="space-y-3 pt-2">
        <div className="h-3 w-20 animate-pulse rounded bg-black/[0.05]" />
        <div className="h-5 w-36 animate-pulse rounded bg-black/[0.07]" />
        <div className="h-[4.75rem] animate-pulse rounded-[var(--pib-radius)] border border-[var(--pib-line)] bg-black/[0.04]" />
      </div>

      <div className="space-y-3">
        <div className="h-3 w-28 animate-pulse rounded bg-black/[0.05]" />
        <div className="h-5 w-32 animate-pulse rounded bg-black/[0.07]" />
        <div className="h-[4.75rem] animate-pulse rounded-[var(--pib-radius)] border border-[var(--pib-line)] bg-black/[0.04]" />
        <div className="h-[4.75rem] animate-pulse rounded-[var(--pib-radius)] border border-[var(--pib-line)] bg-black/[0.04]" />
      </div>
    </div>
  )
}
