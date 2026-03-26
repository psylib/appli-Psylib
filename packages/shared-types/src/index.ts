// =============================================================================
// PsyScale — Shared Types
// Partagés entre apps/web et apps/api
// =============================================================================

// -----------------------------------------------------------------------------
// Enums
// -----------------------------------------------------------------------------

export enum UserRole {
  PSYCHOLOGIST = 'psychologist',
  PATIENT = 'patient',
  ADMIN = 'admin',
}

export enum SubscriptionPlan {
  FREE = 'free',
  STARTER = 'starter',
  PRO = 'pro',
  CLINIC = 'clinic',
}

export enum SubscriptionStatus {
  TRIALING = 'trialing',
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
}

export enum SessionType {
  INDIVIDUAL = 'individual',
  GROUP = 'group',
  ONLINE = 'online',
}

export enum SessionPaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FREE = 'free',
}

export enum PatientStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived',
}

export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  NO_SHOW = 'no_show',
}

export enum ExerciseStatus {
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  SKIPPED = 'skipped',
}

export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  EXPIRED = 'expired',
}

export enum PaymentType {
  SESSION = 'session',
  COURSE = 'course',
  SUBSCRIPTION = 'subscription',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
}

export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  PAID = 'paid',
}

export enum AuditAction {
  READ = 'READ',
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  DECRYPT = 'DECRYPT',
}

export enum GdprConsentType {
  DATA_PROCESSING = 'data_processing',
  AI_PROCESSING = 'ai_processing',
  MARKETING = 'marketing',
}

export enum NotificationType {
  SESSION_REMINDER = 'session_reminder',
  MOOD_ALERT = 'mood_alert',
  PAYMENT = 'payment',
  AI_COMPLETE = 'ai_complete',
}

export enum AiFeature {
  SESSION_SUMMARY = 'session_summary',
  EXERCISE = 'exercise',
  CONTENT = 'content',
}

// -----------------------------------------------------------------------------
// Entity Interfaces
// -----------------------------------------------------------------------------

export interface User {
  id: string;
  email: string;
  role: UserRole;
  avatarUrl: string | null;
  locale: string;
  timezone: string;
  lastSignInAt: Date | null;
  createdAt: Date;
}

export interface Psychologist {
  id: string;
  userId: string;
  name: string;
  slug: string;
  specialization: string | null;
  bio: string | null;
  phone: string | null;
  address: string | null;
  adeliNumber: string | null;
  isOnboarded: boolean;
  defaultSessionDuration: number;
  defaultSessionRate: number | null;
  createdAt: Date;
}

export interface Subscription {
  id: string;
  psychologistId: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  trialEndsAt: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}

export interface Patient {
  id: string;
  psychologistId: string;
  userId: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  birthDate: Date | null;
  notes: string | null; // chiffré en DB
  status: PatientStatus;
  source: string | null;
  createdAt: Date;
}

export interface Session {
  id: string;
  patientId: string;
  psychologistId: string;
  date: Date;
  duration: number;
  type: SessionType;
  notes: string | null; // chiffré en DB
  summaryAi: string | null;
  tags: string[];
  rate: number | null;
  paymentStatus: SessionPaymentStatus;
  createdAt: Date;
}

export interface Appointment {
  id: string;
  psychologistId: string;
  patientId: string;
  sessionId: string | null;
  scheduledAt: Date;
  duration: number;
  status: AppointmentStatus;
  reminderSentAt: Date | null;
}

export interface MoodTracking {
  id: string;
  patientId: string;
  mood: number; // 1-10
  note: string | null;
  createdAt: Date;
}

export interface Exercise {
  id: string;
  patientId: string;
  title: string;
  description: string;
  status: ExerciseStatus;
  createdByAi: boolean;
  dueDate: Date | null;
  completedAt: Date | null;
  patientFeedback: string | null;
}

export interface JournalEntry {
  id: string;
  patientId: string;
  content: string; // chiffré en DB
  mood: number | null;
  tags: string[];
  isPrivate: boolean;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  psychologistId: string;
  patientId: string;
  createdAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string; // chiffré en DB
  readAt: Date | null;
  createdAt: Date;
}

export interface Course {
  id: string;
  psychologistId: string;
  title: string;
  description: string;
  price: number;
  isPublished: boolean;
  createdAt: Date;
}

export interface CourseModule {
  id: string;
  courseId: string;
  title: string;
  videoUrl: string | null;
  content: string | null;
  order: number;
}

export interface CourseEnrollment {
  id: string;
  courseId: string;
  userId: string;
  paymentId: string | null;
  progress: Record<string, Date>;
  enrolledAt: Date;
}

export interface Payment {
  id: string;
  psychologistId: string;
  patientId: string | null;
  type: PaymentType;
  amount: number;
  status: PaymentStatus;
  stripePaymentIntentId: string | null;
  invoiceUrl: string | null;
  createdAt: Date;
}

export interface Invoice {
  id: string;
  psychologistId: string;
  patientId: string | null;
  invoiceNumber: string;
  amountTtc: number;
  status: InvoiceStatus;
  issuedAt: Date;
  pdfUrl: string | null;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorType: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  ipAddress: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

export interface GdprConsent {
  id: string;
  patientId: string;
  type: GdprConsentType;
  version: string;
  consentedAt: Date;
  withdrawnAt: Date | null;
  ipAddress: string | null;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  readAt: Date | null;
  createdAt: Date;
}

export interface OnboardingProgress {
  id: string;
  psychologistId: string;
  stepsCompleted: string[];
  completedAt: Date | null;
}

export interface PatientInvitation {
  id: string;
  psychologistId: string;
  patientId: string;
  email: string;
  token: string;
  status: InvitationStatus;
  expiresAt: Date;
}

export interface AiUsage {
  id: string;
  psychologistId: string;
  feature: AiFeature;
  tokensUsed: number;
  model: string;
  costUsd: number;
  createdAt: Date;
}

// -----------------------------------------------------------------------------
// API Types
// -----------------------------------------------------------------------------

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

// Auth
export interface JwtPayload {
  sub: string;
  email: string;
  jti?: string; // JWT ID — used for token revocation blacklist
  realm_access: {
    roles: string[];
  };
  resource_access?: Record<string, { roles: string[] }>;
  iat: number;
  exp: number;
}

export interface AuthSession {
  user: {
    id: string;
    email: string;
    role: UserRole;
    name?: string;
  };
  accessToken: string;
}

// Request/Response contracts
export interface CreatePatientDto {
  name: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  notes?: string;
  source?: string;
}

export interface UpdatePatientDto extends Partial<CreatePatientDto> {
  status?: PatientStatus;
}

export interface CreateSessionDto {
  patientId: string;
  date: string;
  duration: number;
  type: SessionType;
  notes?: string;
  tags?: string[];
  rate?: number;
}

export interface UpdateSessionDto extends Partial<CreateSessionDto> {
  paymentStatus?: SessionPaymentStatus;
}

export interface CreateAppointmentDto {
  patientId: string;
  scheduledAt: string;
  duration: number;
}

export interface DashboardStats {
  totalPatients: number;
  activePatients: number;
  sessionsThisMonth: number;
  revenueThisMonth: number;
  upcomingAppointments: number;
  pendingInvoices: number;
}

export interface HealthCheckResponse {
  status: 'ok' | 'error';
  db: 'ok' | 'error';
  redis: 'ok' | 'error';
  timestamp: string;
}

// Plan limits
export const PLAN_LIMITS: Record<SubscriptionPlan, { patients: number | null; sessions: number | null; aiSummaries: number }> = {
  [SubscriptionPlan.FREE]: { patients: 5, sessions: 10, aiSummaries: 0 },
  [SubscriptionPlan.STARTER]: { patients: 40, sessions: 40, aiSummaries: 10 },
  [SubscriptionPlan.PRO]: { patients: null, sessions: null, aiSummaries: 100 },
  [SubscriptionPlan.CLINIC]: { patients: null, sessions: null, aiSummaries: -1 }, // -1 = illimité
};

export const PLAN_PRICES: Record<SubscriptionPlan, number> = {
  [SubscriptionPlan.FREE]: 0,
  [SubscriptionPlan.STARTER]: 29.99,
  [SubscriptionPlan.PRO]: 69,
  [SubscriptionPlan.CLINIC]: 119,
};
