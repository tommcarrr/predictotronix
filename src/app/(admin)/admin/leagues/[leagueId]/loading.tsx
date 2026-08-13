export default function LeagueDetailLoading() {
  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6 lg:p-8" aria-busy="true">
      <div className="h-5 w-28 animate-pulse rounded bg-muted" />
      <div className="h-20 animate-pulse rounded-2xl bg-muted" />
      <div className="h-12 animate-pulse rounded-xl bg-muted" />
      <div className="h-56 animate-pulse rounded-2xl bg-muted" />
    </main>
  );
}
