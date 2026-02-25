import { NextResponse } from "next/server";

export const ATTIVITA_DATE_RANGE_ERROR =
  "Operazione non consentita: puoi modificare/eliminare solo attività degli ultimi 7 giorni. Contatta l'amministrazione.";

type SessionLike = { user: { id: string; role?: string | null } };

function toLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Se l'utente ha role="user", verifica che la data attività sia entro gli ultimi 7 giorni e non futura.
 * Se fuori range, ritorna NextResponse con errore 403; altrimenti ritorna null (procedi).
 */
export function checkAttivitaDateRangeForUser(
  session: SessionLike,
  attivitaDate: Date | string,
): NextResponse | null {
  if (session.user.role !== "user") return null;

  const parsed =
    typeof attivitaDate === "string" ? new Date(attivitaDate) : attivitaDate;
  if (Number.isNaN(parsed.getTime())) return null;

  const dateStr = toLocalDateString(parsed);
  const todayStr = toLocalDateString(new Date());

  if (dateStr > todayStr) {
    return NextResponse.json({ error: ATTIVITA_DATE_RANGE_ERROR }, { status: 403 });
  }
  const minDate = new Date();
  minDate.setDate(minDate.getDate() - 7);
  const minDateStr = toLocalDateString(minDate);
  if (dateStr < minDateStr) {
    return NextResponse.json({ error: ATTIVITA_DATE_RANGE_ERROR }, { status: 403 });
  }
  return null;
}
