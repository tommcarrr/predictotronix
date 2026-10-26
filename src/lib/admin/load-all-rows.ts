/** Load every page, including when the server caps responses below our requested size. */
export async function loadAllRows<T, E>(
  fetchPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: E | null }>
): Promise<{ data: T[]; error: E | null }> {
  const rows: T[] = [];
  while (true) {
    const { data, error } = await fetchPage(rows.length, rows.length + 999);
    // Never display partial results as a complete set of outcomes.
    if (error) return { data: [], error };
    if (!data?.length) return { data: rows, error: null };
    rows.push(...data);
  }
}
