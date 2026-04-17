"use strict";
// =============================================================================
// PsyScale — Shared Types
// Partagés entre apps/web et apps/api
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountingEntryType = exports.RECURRING_FREQUENCY_LABELS = exports.RecurringFrequency = exports.EXPENSE_PAYMENT_METHOD_LABELS = exports.ExpensePaymentMethod = exports.EXPENSE_CATEGORY_LABELS = exports.ExpenseCategory = exports.MON_SOUTIEN_PSY_MAX_SESSIONS = exports.MON_SOUTIEN_PSY_RATE = exports.WaitlistStatus = exports.WaitlistUrgency = exports.PaymentMode = exports.BookingPaymentStatus = exports.ConsultationCategory = exports.PLAN_DISPLAY_NAMES = exports.PLAN_PRICES = exports.PLAN_LIMITS = exports.AiFeature = exports.NotificationType = exports.VideoRoomStatus = exports.GdprConsentType = exports.AuditAction = exports.InvoiceStatus = exports.PaymentStatus = exports.PaymentType = exports.InvitationStatus = exports.ExerciseStatus = exports.AppointmentStatus = exports.PatientStatus = exports.SessionPaymentStatus = exports.SessionType = exports.SubscriptionStatus = exports.SubscriptionPlan = exports.UserRole = void 0;
// -----------------------------------------------------------------------------
// Enums
// -----------------------------------------------------------------------------
var UserRole;
(function (UserRole) {
    UserRole["PSYCHOLOGIST"] = "psychologist";
    UserRole["PATIENT"] = "patient";
    UserRole["ADMIN"] = "admin";
})(UserRole || (exports.UserRole = UserRole = {}));
var SubscriptionPlan;
(function (SubscriptionPlan) {
    SubscriptionPlan["FREE"] = "free";
    SubscriptionPlan["STARTER"] = "starter";
    SubscriptionPlan["PRO"] = "pro";
    SubscriptionPlan["CLINIC"] = "clinic";
})(SubscriptionPlan || (exports.SubscriptionPlan = SubscriptionPlan = {}));
var SubscriptionStatus;
(function (SubscriptionStatus) {
    SubscriptionStatus["TRIALING"] = "trialing";
    SubscriptionStatus["ACTIVE"] = "active";
    SubscriptionStatus["PAST_DUE"] = "past_due";
    SubscriptionStatus["CANCELED"] = "canceled";
})(SubscriptionStatus || (exports.SubscriptionStatus = SubscriptionStatus = {}));
var SessionType;
(function (SessionType) {
    SessionType["INDIVIDUAL"] = "individual";
    SessionType["GROUP"] = "group";
    SessionType["ONLINE"] = "online";
})(SessionType || (exports.SessionType = SessionType = {}));
var SessionPaymentStatus;
(function (SessionPaymentStatus) {
    SessionPaymentStatus["PENDING"] = "pending";
    SessionPaymentStatus["PAID"] = "paid";
    SessionPaymentStatus["FREE"] = "free";
})(SessionPaymentStatus || (exports.SessionPaymentStatus = SessionPaymentStatus = {}));
var PatientStatus;
(function (PatientStatus) {
    PatientStatus["ACTIVE"] = "active";
    PatientStatus["INACTIVE"] = "inactive";
    PatientStatus["ARCHIVED"] = "archived";
})(PatientStatus || (exports.PatientStatus = PatientStatus = {}));
var AppointmentStatus;
(function (AppointmentStatus) {
    AppointmentStatus["SCHEDULED"] = "scheduled";
    AppointmentStatus["CONFIRMED"] = "confirmed";
    AppointmentStatus["CANCELLED"] = "cancelled";
    AppointmentStatus["COMPLETED"] = "completed";
    AppointmentStatus["NO_SHOW"] = "no_show";
})(AppointmentStatus || (exports.AppointmentStatus = AppointmentStatus = {}));
var ExerciseStatus;
(function (ExerciseStatus) {
    ExerciseStatus["ASSIGNED"] = "assigned";
    ExerciseStatus["IN_PROGRESS"] = "in_progress";
    ExerciseStatus["COMPLETED"] = "completed";
    ExerciseStatus["SKIPPED"] = "skipped";
})(ExerciseStatus || (exports.ExerciseStatus = ExerciseStatus = {}));
var InvitationStatus;
(function (InvitationStatus) {
    InvitationStatus["PENDING"] = "pending";
    InvitationStatus["ACCEPTED"] = "accepted";
    InvitationStatus["EXPIRED"] = "expired";
})(InvitationStatus || (exports.InvitationStatus = InvitationStatus = {}));
var PaymentType;
(function (PaymentType) {
    PaymentType["SESSION"] = "session";
    PaymentType["COURSE"] = "course";
    PaymentType["SUBSCRIPTION"] = "subscription";
})(PaymentType || (exports.PaymentType = PaymentType = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "pending";
    PaymentStatus["PAID"] = "paid";
    PaymentStatus["FAILED"] = "failed";
    PaymentStatus["REFUNDED"] = "refunded";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var InvoiceStatus;
(function (InvoiceStatus) {
    InvoiceStatus["DRAFT"] = "draft";
    InvoiceStatus["SENT"] = "sent";
    InvoiceStatus["PAID"] = "paid";
})(InvoiceStatus || (exports.InvoiceStatus = InvoiceStatus = {}));
var AuditAction;
(function (AuditAction) {
    AuditAction["READ"] = "READ";
    AuditAction["CREATE"] = "CREATE";
    AuditAction["UPDATE"] = "UPDATE";
    AuditAction["DELETE"] = "DELETE";
    AuditAction["DECRYPT"] = "DECRYPT";
    AuditAction["AI_SUMMARY_SAVE"] = "AI_SUMMARY_SAVE";
    AuditAction["VIDEO_ROOM_CREATED"] = "VIDEO_ROOM_CREATED";
    AuditAction["VIDEO_PSY_JOIN"] = "VIDEO_PSY_JOIN";
    AuditAction["VIDEO_PATIENT_JOIN"] = "VIDEO_PATIENT_JOIN";
    AuditAction["VIDEO_CALL_END"] = "VIDEO_CALL_END";
    AuditAction["VIDEO_ROOM_CLEANUP"] = "VIDEO_ROOM_CLEANUP";
})(AuditAction || (exports.AuditAction = AuditAction = {}));
var GdprConsentType;
(function (GdprConsentType) {
    GdprConsentType["DATA_PROCESSING"] = "data_processing";
    GdprConsentType["AI_PROCESSING"] = "ai_processing";
    GdprConsentType["MARKETING"] = "marketing";
    GdprConsentType["VIDEO_CONSULTATION"] = "video_consultation";
})(GdprConsentType || (exports.GdprConsentType = GdprConsentType = {}));
var VideoRoomStatus;
(function (VideoRoomStatus) {
    VideoRoomStatus["WAITING"] = "waiting";
    VideoRoomStatus["ACTIVE"] = "active";
    VideoRoomStatus["ENDED"] = "ended";
})(VideoRoomStatus || (exports.VideoRoomStatus = VideoRoomStatus = {}));
var NotificationType;
(function (NotificationType) {
    NotificationType["SESSION_REMINDER"] = "session_reminder";
    NotificationType["MOOD_ALERT"] = "mood_alert";
    NotificationType["PAYMENT"] = "payment";
    NotificationType["AI_COMPLETE"] = "ai_complete";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
var AiFeature;
(function (AiFeature) {
    AiFeature["SESSION_SUMMARY"] = "session_summary";
    AiFeature["EXERCISE"] = "exercise";
    AiFeature["CONTENT"] = "content";
})(AiFeature || (exports.AiFeature = AiFeature = {}));
// Plan limits
exports.PLAN_LIMITS = {
    [SubscriptionPlan.FREE]: { patients: null, sessions: null, aiSummaries: 0, videoConsultations: 0, courses: 0, expenses: 30 },
    [SubscriptionPlan.STARTER]: { patients: null, sessions: null, aiSummaries: 10, videoConsultations: null, courses: 0, expenses: null },
    [SubscriptionPlan.PRO]: { patients: null, sessions: null, aiSummaries: -1, videoConsultations: null, courses: 5, expenses: null }, // null/-1 = unlimited
    [SubscriptionPlan.CLINIC]: { patients: null, sessions: null, aiSummaries: -1, videoConsultations: null, courses: null, expenses: null }, // -1 / null = illimité
};
exports.PLAN_PRICES = {
    [SubscriptionPlan.FREE]: 0,
    [SubscriptionPlan.STARTER]: 25,
    [SubscriptionPlan.PRO]: 40,
    [SubscriptionPlan.CLINIC]: 79,
};
// Display names for plans (enum values stay same for DB/Stripe compat)
exports.PLAN_DISPLAY_NAMES = {
    [SubscriptionPlan.FREE]: 'Free',
    [SubscriptionPlan.STARTER]: 'Solo',
    [SubscriptionPlan.PRO]: 'Pro',
    [SubscriptionPlan.CLINIC]: 'Clinic',
};
// =============================================================================
// Lot 1: Consultation Types, Mon Soutien Psy, Waitlist
// =============================================================================
var ConsultationCategory;
(function (ConsultationCategory) {
    ConsultationCategory["STANDARD"] = "standard";
    ConsultationCategory["MON_SOUTIEN_PSY"] = "mon_soutien_psy";
})(ConsultationCategory || (exports.ConsultationCategory = ConsultationCategory = {}));
var BookingPaymentStatus;
(function (BookingPaymentStatus) {
    BookingPaymentStatus["NONE"] = "none";
    BookingPaymentStatus["PENDING_PAYMENT"] = "pending_payment";
    BookingPaymentStatus["PAID"] = "paid";
    BookingPaymentStatus["PAYMENT_FAILED"] = "payment_failed";
    BookingPaymentStatus["REFUNDED"] = "refunded";
})(BookingPaymentStatus || (exports.BookingPaymentStatus = BookingPaymentStatus = {}));
var PaymentMode;
(function (PaymentMode) {
    PaymentMode["PREPAID"] = "prepaid";
    PaymentMode["POSTPAID"] = "postpaid";
    PaymentMode["BOTH"] = "both";
})(PaymentMode || (exports.PaymentMode = PaymentMode = {}));
var WaitlistUrgency;
(function (WaitlistUrgency) {
    WaitlistUrgency["LOW"] = "low";
    WaitlistUrgency["MEDIUM"] = "medium";
    WaitlistUrgency["HIGH"] = "high";
})(WaitlistUrgency || (exports.WaitlistUrgency = WaitlistUrgency = {}));
var WaitlistStatus;
(function (WaitlistStatus) {
    WaitlistStatus["WAITING"] = "waiting";
    WaitlistStatus["CONTACTED"] = "contacted";
    WaitlistStatus["SCHEDULED"] = "scheduled";
    WaitlistStatus["REMOVED"] = "removed";
})(WaitlistStatus || (exports.WaitlistStatus = WaitlistStatus = {}));
exports.MON_SOUTIEN_PSY_RATE = 50.00;
exports.MON_SOUTIEN_PSY_MAX_SESSIONS = 12;
// =============================================================================
// Accounting Module
// =============================================================================
var ExpenseCategory;
(function (ExpenseCategory) {
    ExpenseCategory["RENT"] = "rent";
    ExpenseCategory["INSURANCE"] = "insurance";
    ExpenseCategory["EQUIPMENT"] = "equipment";
    ExpenseCategory["IT_SOFTWARE"] = "it_software";
    ExpenseCategory["PHONE_INTERNET"] = "phone_internet";
    ExpenseCategory["TRAINING"] = "training";
    ExpenseCategory["SUPERVISION"] = "supervision";
    ExpenseCategory["PROFESSIONAL_FEES"] = "professional_fees";
    ExpenseCategory["TRANSPORT"] = "transport";
    ExpenseCategory["OFFICE_SUPPLIES"] = "office_supplies";
    ExpenseCategory["TESTS_TOOLS"] = "tests_tools";
    ExpenseCategory["BANK_FEES"] = "bank_fees";
    ExpenseCategory["ACCOUNTING"] = "accounting";
    ExpenseCategory["CLEANING"] = "cleaning";
    ExpenseCategory["OTHER"] = "other";
})(ExpenseCategory || (exports.ExpenseCategory = ExpenseCategory = {}));
exports.EXPENSE_CATEGORY_LABELS = {
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
var ExpensePaymentMethod;
(function (ExpensePaymentMethod) {
    ExpensePaymentMethod["CASH"] = "cash";
    ExpensePaymentMethod["CHECK"] = "check";
    ExpensePaymentMethod["CARD"] = "card";
    ExpensePaymentMethod["TRANSFER"] = "transfer";
    ExpensePaymentMethod["DIRECT_DEBIT"] = "direct_debit";
    ExpensePaymentMethod["STRIPE"] = "stripe";
    ExpensePaymentMethod["OTHER"] = "other_pm";
})(ExpensePaymentMethod || (exports.ExpensePaymentMethod = ExpensePaymentMethod = {}));
exports.EXPENSE_PAYMENT_METHOD_LABELS = {
    [ExpensePaymentMethod.CASH]: 'Espèces',
    [ExpensePaymentMethod.CHECK]: 'Chèque',
    [ExpensePaymentMethod.CARD]: 'Carte bancaire',
    [ExpensePaymentMethod.TRANSFER]: 'Virement',
    [ExpensePaymentMethod.DIRECT_DEBIT]: 'Prélèvement',
    [ExpensePaymentMethod.STRIPE]: 'Paiement en ligne',
    [ExpensePaymentMethod.OTHER]: 'Autre',
};
var RecurringFrequency;
(function (RecurringFrequency) {
    RecurringFrequency["MONTHLY"] = "monthly";
    RecurringFrequency["QUARTERLY"] = "quarterly";
    RecurringFrequency["YEARLY"] = "yearly";
})(RecurringFrequency || (exports.RecurringFrequency = RecurringFrequency = {}));
exports.RECURRING_FREQUENCY_LABELS = {
    [RecurringFrequency.MONTHLY]: 'Mensuel',
    [RecurringFrequency.QUARTERLY]: 'Trimestriel',
    [RecurringFrequency.YEARLY]: 'Annuel',
};
var AccountingEntryType;
(function (AccountingEntryType) {
    AccountingEntryType["INCOME"] = "income";
    AccountingEntryType["EXPENSE"] = "expense";
})(AccountingEntryType || (exports.AccountingEntryType = AccountingEntryType = {}));
//# sourceMappingURL=index.js.map