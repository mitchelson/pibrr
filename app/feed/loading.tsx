/** Skeleton ao trocar para a aba Comunidade. */
export default function FeedLoading() {
  return (
    <div className="pib-page pib-stack" aria-busy="true" aria-label="Carregando">
      <div className="space-y-3">
        <div className="h-3 w-28 animate-pulse rounded bg-black/[0.06]" />
        <div className="h-9 w-56 animate-pulse rounded bg-black/[0.07]" />
      </div>
      <div className="h-28 animate-pulse rounded-[var(--pib-radius)] border border-[var(--pib-line)] bg-black/[0.04]" />
      <div className="h-40 animate-pulse rounded-[var(--pib-radius)] border border-[var(--pib-line)] bg-black/[0.04]" />
      <div className="h-40 animate-pulse rounded-[var(--pib-radius)] border border-[var(--pib-line)] bg-black/[0.04]" />
    </div>
  )
}
