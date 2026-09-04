export default function AdminLoading() {
  return (
    <div className="space-y-4 p-4 sm:p-6" aria-busy="true" aria-label="Carregando">
      <div className="h-4 w-28 animate-pulse rounded bg-black/[0.06]" />
      <div className="h-8 w-48 animate-pulse rounded bg-black/[0.07]" />
      <div className="h-32 animate-pulse rounded-[var(--pib-radius)] border border-[var(--pib-line)] bg-black/[0.04]" />
      <div className="h-48 animate-pulse rounded-[var(--pib-radius)] border border-[var(--pib-line)] bg-black/[0.04]" />
    </div>
  )
}
