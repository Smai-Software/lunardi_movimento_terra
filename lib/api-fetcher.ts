export const fetcher = async <T,>(url: string): Promise<T> => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(
      (error as { error?: string })?.error || "Errore nel caricamento dei dati",
    );
  }
  return res.json();
};
