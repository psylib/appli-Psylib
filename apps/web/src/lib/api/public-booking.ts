const API_BASE = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';

export interface ConsultationType {
  id: string;
  name: string;
  duration: number;
  rate: number;
  color: string;
  category: 'standard' | 'mon_soutien_psy';
}

export interface PublicPsyProfile {
  id: string;
  name: string;
  slug: string;
  specialization: string | null;
  bio: string | null;
  phone: string | null;
  address: string | null;
  adeliNumber: string | null;
  defaultSessionDuration: number;
  defaultSessionRate: number | null;
  avatarUrl: string | null;
  city: string | null;
  department: string | null;
  approaches: string[];
  specialties: string[];
  languages: string[];
  websiteUrl: string | null;
  acceptsMonSoutienPsy: boolean;
  offersVisio: boolean;
  acceptsOnlinePayment?: boolean;
  consultationTypes?: ConsultationType[];
}

export interface BookingDto {
  patientName: string;
  patientEmail: string;
  patientPhone?: string;
  scheduledAt: string;
  reason?: string;
  consultationTypeId?: string;
  payOnline?: boolean;
}

export interface BookingResult {
  success: boolean;
  appointmentId: string;
  checkoutUrl?: string;
  requiresPayment?: boolean;
}

async function publicFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}/api/v1${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const body = (await res.json()) as { message?: string };
      if (body.message) msg = body.message;
    } catch { /* ignore */ }
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

export const publicBookingApi = {
  getProfile: (slug: string) =>
    publicFetch<PublicPsyProfile>(`/public/psy/${slug}`),

  getSlots: (slug: string, from: string, to: string, consultationTypeId?: string) =>
    publicFetch<{ slots: string[] }>(
      `/public/psy/${slug}/slots?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}${consultationTypeId ? `&consultationTypeId=${encodeURIComponent(consultationTypeId)}` : ''}`
    ),

  book: (slug: string, dto: BookingDto) =>
    publicFetch<BookingResult>(`/public/psy/${slug}/book`, {
      method: 'POST',
      body: JSON.stringify(dto),
    }),
};
