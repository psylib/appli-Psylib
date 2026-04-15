export class PaymentCompletedEvent {
  constructor(
    public readonly psychologistId: string,
    public readonly paymentId: string,
    public readonly invoiceId: string | null,
    public readonly patientName: string,
    public readonly amount: number,
    public readonly date: Date,
    public readonly paymentMethod: string,
    public readonly pieceRef: string | null,
  ) {}
}
