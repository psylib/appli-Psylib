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
  REFUNDED = 'refunded',
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
  AI_SUMMARY_SAVE = 'AI_SUMMARY_SAVE',
  VIDEO_ROOM_CREATED = 'VIDEO_ROOM_CREATED',
  VIDEO_PSY_JOIN = 'VIDEO_PSY_JOIN',
  VIDEO_PATIENT_JOIN = 'VIDEO_PATIENT_JOIN',
  VIDEO_CALL_END = 'VIDEO_CALL_END',
  VIDEO_ROOM_CLEANUP = 'VIDEO_ROOM_CLEANUP',
}

export enum GdprConsentType {
  DATA_PROCESSING = 'data_processing',
  AI_PROCESSING = 'ai_processing',
  MARKETING = 'marketing',
  VIDEO_CONSULTATION = 'video_consultation',
}

export enum VideoRoomStatus {
  WAITING = 'waiting',
  ACTIVE = 'active',
  ENDED = 'ended',
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
  orientation?: string | null;
  aiMetadata?: Record<string, unknown> | null;
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
export const PLAN_LIMITS: Record<SubscriptionPlan, { patients: number | null; sessions: number | null; aiSummaries: number; videoConsultations: number | null; courses: number | null; expenses: number | null }> = {
  [SubscriptionPlan.FREE]: { patients: 10, sessions: 20, aiSummaries: 0, videoConsultations: 0, courses: 0, expenses: 30 },
  [SubscriptionPlan.STARTER]: { patients: 50, sessions: null, aiSummaries: 10, videoConsultations: 5, courses: 0, expenses: null },
  [SubscriptionPlan.PRO]: { patients: null, sessions: null, aiSummaries: -1, videoConsultations: null, courses: 5, expenses: null },  // null/-1 = unlimited
  [SubscriptionPlan.CLINIC]: { patients: null, sessions: null, aiSummaries: -1, videoConsultations: null, courses: null, expenses: null }, // -1 / null = illimité
};

export const PLAN_PRICES: Record<SubscriptionPlan, number> = {
  [SubscriptionPlan.FREE]: 0,
  [SubscriptionPlan.STARTER]: 25,
  [SubscriptionPlan.PRO]: 40,
  [SubscriptionPlan.CLINIC]: 79,
};

// Display names for plans (enum values stay same for DB/Stripe compat)
export const PLAN_DISPLAY_NAMES: Record<SubscriptionPlan, string> = {
  [SubscriptionPlan.FREE]: 'Free',
  [SubscriptionPlan.STARTER]: 'Solo',
  [SubscriptionPlan.PRO]: 'Pro',
  [SubscriptionPlan.CLINIC]: 'Clinic',
};

// =============================================================================
// Lot 1: Consultation Types, Mon Soutien Psy, Waitlist
// =============================================================================

export enum ConsultationCategory {
  STANDARD = 'standard',
  MON_SOUTIEN_PSY = 'mon_soutien_psy',
}

export enum BookingPaymentStatus {
  NONE = 'none',
  PENDING_PAYMENT = 'pending_payment',
  PAID = 'paid',
  PAYMENT_FAILED = 'payment_failed',
  REFUNDED = 'refunded',
}

export enum PaymentMode {
  PREPAID = 'prepaid',
  POSTPAID = 'postpaid',
  BOTH = 'both',
}

export interface ConnectSettings {
  paymentMode: PaymentMode;
  cancellationDelay: number;
  autoRefund: boolean;
  defaultSessionRate: number;
}

export enum WaitlistUrgency {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum WaitlistStatus {
  WAITING = 'waiting',
  CONTACTED = 'contacted',
  SCHEDULED = 'scheduled',
  REMOVED = 'removed',
}

export interface ConsultationType {
  id: string;
  psychologistId: string;
  name: string;
  duration: number;
  rate: number;
  color: string;
  category: ConsultationCategory;
  isPublic: boolean;
  isActive: boolean;
  sortOrder: number;
}

export interface MonSoutienPsyTracking {
  id: string;
  patientId: string;
  year: number;
  sessionsUsed: number;
  maxSessions: number;
  firstSessionAt: string | null;
  lastSessionAt: string | null;
}

export interface WaitlistEntry {
  id: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string | null;
  consultationTypeId: string | null;
  consultationType?: ConsultationType;
  urgency: WaitlistUrgency;
  preferredSlots: PreferredSlots | null;
  note: string | null;
  status: WaitlistStatus;
  contactedAt: string | null;
  createdAt: string;
}

export interface PreferredSlots {
  mornings: boolean;
  afternoons: boolean;
  preferredDays: number[];
}

export const MON_SOUTIEN_PSY_RATE = 50.00;
export const MON_SOUTIEN_PSY_MAX_SESSIONS = 12;

// =============================================================================
// Accounting Module
// =============================================================================

export enum ExpenseCategory {
  RENT = 'rent',
  INSURANCE = 'insurance',
  EQUIPMENT = 'equipment',
  IT_SOFTWARE = 'it_software',
  PHONE_INTERNET = 'phone_internet',
  TRAINING = 'training',
  SUPERVISION = 'supervision',
  PROFESSIONAL_FEES = 'professional_fees',
  TRANSPORT = 'transport',
  OFFICE_SUPPLIES = 'office_supplies',
  TESTS_TOOLS = 'tests_tools',
  BANK_FEES = 'bank_fees',
  ACCOUNTING = 'accounting',
  CLEANING = 'cleaning',
  OTHER = 'other',
}

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  [ExpenseCategory.RENT]: 'Loyer et charges',
  [ExpenseCategory.INSURANCE]: 'Assurances',
  [ExpenseCategory.EQUIPMENT]: 'Matériel professionnel',
  [ExpenseCategory.IT_SOFTWARE]: 'Informatique et logiciels',
  [ExpenseCategory.PHONE_INTERNET]: 'Téléphone et Internet',
  [ExpenseCategory.TRAINING]: 'Formation continue',
  [ExpenseCategory.SUPERVISION]: 'Supervision',
  [ExpenseCategory.PROFESSIONAL_FEES]: 'Cotisations professionnelles',
  [ExpenseCategory.TRANSPORT]: 'Déplacements',
  [ExpenseCategory.OFFICE_SUPPLIES]: 'Fournitures de bureau',
  [ExpenseCategory.TESTS_TOOLS]: 'Tests et outils',
  [ExpenseCategory.BANK_FEES]: 'Frais bancaires',
  [ExpenseCategory.ACCOUNTING]: 'Comptabilité / AGA',
  [ExpenseCategory.CLEANING]: 'Entretien locaux',
  [ExpenseCategory.OTHER]: 'Autres charges',
};

export enum ExpensePaymentMethod {
  CASH = 'cash',
  CHECK = 'check',
  CARD = 'card',
  TRANSFER = 'transfer',
  DIRECT_DEBIT = 'direct_debit',
  STRIPE = 'stripe',
  OTHER = 'other_pm',
}

export const EXPENSE_PAYMENT_METHOD_LABELS: Record<ExpensePaymentMethod, string> = {
  [ExpensePaymentMethod.CASH]: 'Espèces',
  [ExpensePaymentMethod.CHECK]: 'Chèque',
  [ExpensePaymentMethod.CARD]: 'Carte bancaire',
  [ExpensePaymentMethod.TRANSFER]: 'Virement',
  [ExpensePaymentMethod.DIRECT_DEBIT]: 'Prélèvement',
  [ExpensePaymentMethod.STRIPE]: 'Paiement en ligne',
  [ExpensePaymentMethod.OTHER]: 'Autre',
};

export enum RecurringFrequency {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

export const RECURRING_FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
  [RecurringFrequency.MONTHLY]: 'Mensuel',
  [RecurringFrequency.QUARTERLY]: 'Trimestriel',
  [RecurringFrequency.YEARLY]: 'Annuel',
};

export enum AccountingEntryType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

// Accounting interfaces
export interface ExpenseRecord {
  id: string;
  date: string;
  label: string;
  amount: number;
  amountHt: number | null;
  vatRate: number | null;
  category: ExpenseCategory;
  subcategory: string | null;
  paymentMethod: ExpensePaymentMethod;
  supplier: string | null;
  receiptUrl: string | null;
  isDeductible: boolean;
  notes: string | null;
  recurringExpenseId: string | null;
  createdAt: string;
}

export interface RecurringExpenseRecord {
  id: string;
  label: string;
  amount: number;
  category: ExpenseCategory;
  paymentMethod: ExpensePaymentMethod;
  supplier: string | null;
  frequency: RecurringFrequency;
  dayOfMonth: number;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  lastGeneratedAt: string | null;
}

export interface AccountingEntryRecord {
  id: string;
  date: string;
  entryType: AccountingEntryType;
  label: string;
  debit: number;
  credit: number;
  category: string;
  paymentMethod: string | null;
  counterpart: string | null;
  pieceRef: string | null;
  ecritureNum: number | null;
  fiscalYear: number;
}

export interface AccountingSummary {
  period: { from: string; to: string };
  income: { total: number; count: number };
  expenses: { total: number; count: number; byCategory: Record<string, number> };
  netResult: number;
}

export interface AccountingDashboard {
  monthlyPnL: Array<{ month: string; income: number; expenses: number; net: number }>;
  expensesByCategory: Array<{ category: string; label: string; amount: number; percentage: number }>;
  yearToDate: { income: number; expenses: number; net: number };
  previousYear: { income: number; expenses: number; net: number };
}

export interface TaxPrep2035 {
  year: number;
  honoraires: number;
  achats: number;
  loyersCharges: number;
  impotsTaxes: number;
  csgDeductible: number;
  autresFrais: number;
  transports: number;
  chargesSociales: number;
  fournitures: number;
  fraisActes: number;
  autresDepenses: number;
  totalDepenses: number;
  beneficeNet: number;
  disclaimer: string;
}

export interface SocialChargesEstimate {
  urssaf: {
    maladie: number;
    allocationsFamiliales: number;
    csgCrds: number;
    cfp: number;
  };
  cipav: {
    retraiteBase: number;
    retraiteComplementaire: number;
    invaliditeDeces: number;
  };
  total: number;
  monthlyProvision: number;
  disclaimer: string;
}
