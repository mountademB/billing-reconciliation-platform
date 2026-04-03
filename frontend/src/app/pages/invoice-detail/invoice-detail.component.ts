import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize, timeout } from 'rxjs';
import {
  Invoice,
  InvoiceService,
  InvoiceStatus,
  Payment,
  PaymentCreateRequest,
  PaymentMethod
} from '../../core/services/invoice.service';

@Component({
  selector: 'app-invoice-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="page">
      <div class="page-header">
        <div>
          <h2>Invoice Detail</h2>
          @if (invoice) {
            <p class="muted">{{ invoice.invoiceNumber }} · {{ invoice.customerName }}</p>
          }
        </div>
        <a routerLink="/invoices" class="btn">Back</a>
      </div>

      @if (loading) {
        <p>Loading invoice...</p>
      } @else if (errorMessage) {
        <p class="error">{{ errorMessage }}</p>
      } @else if (invoice) {
        <div class="detail-grid">
          <section class="card">
            <div class="card-header">
              <h3>Invoice Header</h3>
              <span class="badge" [class]="badgeClass(invoice.status)">{{ invoice.status }}</span>
            </div>

            <div class="meta-grid">
              <div><span>Invoice #</span><strong>{{ invoice.invoiceNumber }}</strong></div>
              <div><span>Customer</span><strong>{{ invoice.customerName }}</strong></div>
              <div><span>Issue Date</span><strong>{{ invoice.issueDate }}</strong></div>
              <div><span>Due Date</span><strong>{{ invoice.dueDate }}</strong></div>
            </div>

            <div class="action-row">
              @if (invoice.status === 'DRAFT') {
                <button type="button" class="btn btn-primary" (click)="changeStatus('ISSUED')">Issue</button>
              }
              @if (invoice.status === 'DRAFT' || (invoice.status === 'ISSUED' && invoice.amountPaid === 0)) {
                <button type="button" class="btn btn-danger" (click)="changeStatus('CANCELLED')">Cancel</button>
              }
            </div>
          </section>

          <section class="card">
            <h3>Totals</h3>
            <div class="summary">
              <div><span>Subtotal</span><strong>{{ formatMoney(invoice.subtotal) }}</strong></div>
              <div><span>Tax</span><strong>{{ formatMoney(invoice.taxAmount) }}</strong></div>
              <div><span>Total</span><strong>{{ formatMoney(invoice.totalAmount) }}</strong></div>
              <div><span>Paid</span><strong>{{ formatMoney(invoice.amountPaid) }}</strong></div>
              <div class="grand-total"><span>Balance</span><strong>{{ formatMoney(invoice.balanceDue) }}</strong></div>
            </div>
          </section>
        </div>

        <section class="card">
          <h3>Line Items</h3>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Line Total</th>
                </tr>
              </thead>
              <tbody>
                @for (line of invoice.lines; track line.id) {
                  <tr>
                    <td>{{ line.description }}</td>
                    <td>{{ formatMoney(line.quantity) }}</td>
                    <td>{{ formatMoney(line.unitPrice) }}</td>
                    <td>{{ formatMoney(line.lineTotal) }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>

        <section class="card">
          <div class="card-header">
            <h3>Payments</h3>
            @if (paymentsLoading) {
              <span class="muted">Loading payments...</span>
            }
          </div>

          @if (paymentLoadErrorMessage) {
            <p class="error">{{ paymentLoadErrorMessage }}</p>
          } @else if (!paymentsLoading && payments.length === 0) {
            <p>No payments recorded yet.</p>
          } @else if (payments.length > 0) {
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Reference</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  @for (payment of payments; track payment.id) {
                    <tr>
                      <td>{{ payment.paymentDate }}</td>
                      <td>{{ formatMoney(payment.amount) }}</td>
                      <td>{{ payment.method }}</td>
                      <td>{{ payment.reference || '-' }}</td>
                      <td>{{ payment.notes || '-' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </section>

        @if (invoice && canRecordPayment()) {
          <section class="card">
            <h3>Record Payment</h3>

            @if (paymentErrorMessage) {
              <p class="error">{{ paymentErrorMessage }}</p>
            }

            <form [formGroup]="paymentForm" (ngSubmit)="submitPayment()" class="payment-form">
              <label>
                <span>Payment Date</span>
                <input type="date" formControlName="paymentDate">
              </label>

              <label>
                <span>Amount</span>
                <input type="number" min="0.01" step="0.01" formControlName="amount">
              </label>

              <label>
                <span>Method</span>
                <select formControlName="method">
                  @for (method of paymentMethods; track method) {
                    <option [value]="method">{{ method }}</option>
                  }
                </select>
              </label>

              <label>
                <span>Reference</span>
                <input type="text" formControlName="reference">
              </label>

              <label class="notes">
                <span>Notes</span>
                <textarea rows="4" formControlName="notes"></textarea>
              </label>

              <button type="submit" class="btn btn-primary" [disabled]="paymentForm.invalid || savingPayment">
                {{ savingPayment ? 'Saving...' : 'Record Payment' }}
              </button>
            </form>
          </section>
        }
      }
    </section>
  `,
  styles: [`
    .page { padding: 24px; display: grid; gap: 20px; }
    .page-header { display: flex; justify-content: space-between; align-items: start; gap: 16px; }
    .muted { color: #6b7280; margin: 4px 0 0; }
    .detail-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; }
    .card { background: #fff; border: 1px solid #ddd; border-radius: 12px; padding: 20px; }
    .card-header { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 16px; }
    .meta-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
    .meta-grid div, .summary div { display: flex; justify-content: space-between; gap: 16px; }
    .summary { display: grid; gap: 12px; }
    .grand-total { font-size: 18px; }
    .action-row { display: flex; gap: 8px; margin-top: 20px; }
    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 12px; border-bottom: 1px solid #eee; text-align: left; vertical-align: middle; }
    .payment-form { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
    .payment-form label { display: grid; gap: 8px; }
    .payment-form .notes { grid-column: 1 / -1; }
    input, select, textarea { width: 100%; padding: 10px 12px; border: 1px solid #ccc; border-radius: 8px; font: inherit; }
    .btn { border: 1px solid #ccc; background: #fff; padding: 10px 14px; border-radius: 8px; cursor: pointer; text-decoration: none; color: inherit; width: fit-content; }
    .btn-primary { background: #111827; color: #fff; border-color: #111827; }
    .btn-danger { background: #b91c1c; color: #fff; border-color: #b91c1c; }
    .badge { display: inline-block; padding: 6px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; }
    .draft { background: #e5e7eb; color: #111827; }
    .issued { background: #dbeafe; color: #1d4ed8; }
    .partially-paid { background: #fef3c7; color: #92400e; }
    .paid { background: #dcfce7; color: #166534; }
    .overdue { background: #fee2e2; color: #991b1b; }
    .cancelled { background: #f3f4f6; color: #6b7280; }
    .error { color: #b91c1c; }
    @media (max-width: 960px) {
      .detail-grid, .payment-form, .meta-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class InvoiceDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly invoiceService = inject(InvoiceService);
  private readonly cdr = inject(ChangeDetectorRef);

  invoice: Invoice | null = null;
  payments: Payment[] = [];
  loading = false;
  paymentsLoading = false;
  savingPayment = false;
  errorMessage = '';
  paymentErrorMessage = '';
  paymentLoadErrorMessage = '';
  invoiceId = 0;

  paymentMethods: PaymentMethod[] = [
    'CASH',
    'BANK_TRANSFER',
    'CREDIT_CARD',
    'DEBIT_CARD',
    'CHECK',
    'OTHER'
  ];

  paymentForm = this.fb.nonNullable.group({
    paymentDate: ['', Validators.required],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    method: ['BANK_TRANSFER' as PaymentMethod, Validators.required],
    reference: [''],
    notes: ['']
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMessage = 'Invoice id is missing.';
      this.cdr.detectChanges();
      return;
    }

    this.invoiceId = Number(id);
    this.loadInvoice();
  }

  loadInvoice(): void {
    this.loading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.invoiceService.getById(this.invoiceId)
      .pipe(
        timeout(8000),
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (invoice) => {
          this.invoice = invoice;
          this.cdr.detectChanges();
          this.loadPayments();
        },
        error: () => {
          this.errorMessage = 'Failed to load invoice.';
          this.cdr.detectChanges();
        }
      });
  }

  loadPayments(): void {
    this.paymentsLoading = true;
    this.paymentLoadErrorMessage = '';
    this.cdr.detectChanges();

    this.invoiceService.getPayments(this.invoiceId)
      .pipe(
        timeout(8000),
        finalize(() => {
          this.paymentsLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (payments) => {
          this.payments = payments;
          this.cdr.detectChanges();
        },
        error: () => {
          this.paymentLoadErrorMessage = 'Failed to load payments.';
          this.cdr.detectChanges();
        }
      });
  }

  changeStatus(status: InvoiceStatus): void {
    this.invoiceService.updateStatus(this.invoiceId, status).subscribe({
      next: () => this.loadInvoice(),
      error: () => {
        this.errorMessage = 'Failed to update invoice status.';
        this.cdr.detectChanges();
      }
    });
  }

  canRecordPayment(): boolean {
    if (!this.invoice) return false;
    return ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'].includes(this.invoice.status) && this.invoice.balanceDue > 0;
  }

  submitPayment(): void {
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      this.cdr.detectChanges();
      return;
    }

    this.savingPayment = true;
    this.paymentErrorMessage = '';
    this.cdr.detectChanges();

    const raw = this.paymentForm.getRawValue();

    const payload: PaymentCreateRequest = {
      paymentDate: raw.paymentDate,
      amount: Number(raw.amount),
      method: raw.method,
      reference: raw.reference,
      notes: raw.notes
    };

    this.invoiceService.createPayment(this.invoiceId, payload).subscribe({
      next: () => {
        this.savingPayment = false;
        this.paymentForm.patchValue({
          amount: 0,
          reference: '',
          notes: ''
        });
        this.cdr.detectChanges();
        this.loadInvoice();
      },
      error: () => {
        this.savingPayment = false;
        this.paymentErrorMessage = 'Failed to record payment.';
        this.cdr.detectChanges();
      }
    });
  }

  formatMoney(value: number): string {
    return new Intl.NumberFormat('fr-MA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }

  badgeClass(status: InvoiceStatus): string {
    switch (status) {
      case 'DRAFT': return 'draft';
      case 'ISSUED': return 'issued';
      case 'PARTIALLY_PAID': return 'partially-paid';
      case 'PAID': return 'paid';
      case 'OVERDUE': return 'overdue';
      case 'CANCELLED': return 'cancelled';
      default: return 'draft';
    }
  }
}
