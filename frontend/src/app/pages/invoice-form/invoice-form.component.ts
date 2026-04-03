import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Customer, CustomerService } from '../../core/services/customer.service';
import { InvoiceCreateRequest, InvoiceService } from '../../core/services/invoice.service';

@Component({
  selector: 'app-invoice-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="page">
      <div class="page-header">
        <h2>New Invoice</h2>
        <a routerLink="/invoices" class="btn">Back</a>
      </div>

      @if (errorMessage) {
        <p class="error">{{ errorMessage }}</p>
      }

      <form [formGroup]="form" (ngSubmit)="submit()" class="form-card">
        <div class="grid two-cols">
          <label>
            <span>Customer</span>
            <select formControlName="customerId">
              <option value="">Select customer</option>
              @for (customer of customers; track customer.id) {
                <option [value]="customer.id">{{ customer.name }}</option>
              }
            </select>
          </label>

          <label>
            <span>Issue Date</span>
            <input type="date" formControlName="issueDate">
          </label>

          <label>
            <span>Due Date</span>
            <input type="date" formControlName="dueDate">
          </label>
        </div>

        <div class="lines-section">
          <div class="lines-header">
            <h3>Invoice Lines</h3>
            <button type="button" class="btn" (click)="addLine()">Add Line</button>
          </div>

          <div formArrayName="lines" class="lines-list">
            @for (line of lines.controls; track $index) {
              <div class="line-row" [formGroupName]="$index">
                <label class="description">
                  <span>Description</span>
                  <input type="text" formControlName="description">
                </label>

                <label>
                  <span>Quantity</span>
                  <input type="number" min="0.01" step="0.01" formControlName="quantity">
                </label>

                <label>
                  <span>Unit Price</span>
                  <input type="number" min="0.01" step="0.01" formControlName="unitPrice">
                </label>

                <div class="line-total">
                  <span>Line Total</span>
                  <strong>{{ formatMoney(getLineTotal($index)) }}</strong>
                </div>

                <div class="line-actions">
                  <button type="button" class="btn btn-danger" (click)="removeLine($index)" [disabled]="lines.length === 1">
                    Remove
                  </button>
                </div>
              </div>
            }
          </div>
        </div>

        <div class="summary">
          <div><span>Subtotal</span><strong>{{ formatMoney(subtotal) }}</strong></div>
          <div><span>Tax</span><strong>{{ formatMoney(0) }}</strong></div>
          <div class="grand-total"><span>Total</span><strong>{{ formatMoney(total) }}</strong></div>
        </div>

        <button type="submit" class="btn btn-primary" [disabled]="form.invalid || saving">
          {{ saving ? 'Saving...' : 'Save as Draft' }}
        </button>
      </form>
    </section>
  `,
  styles: [`
    .page { padding: 24px; max-width: 1100px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .form-card { display: grid; gap: 20px; background: #fff; border: 1px solid #ddd; border-radius: 12px; padding: 20px; }
    .grid { display: grid; gap: 16px; }
    .two-cols { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    label { display: grid; gap: 8px; }
    input, select, textarea { width: 100%; padding: 10px 12px; border: 1px solid #ccc; border-radius: 8px; font: inherit; }
    .lines-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .lines-list { display: grid; gap: 12px; }
    .line-row { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr auto; gap: 12px; align-items: end; border: 1px solid #eee; border-radius: 12px; padding: 12px; }
    .description { min-width: 0; }
    .line-total { display: grid; gap: 8px; }
    .line-actions { display: flex; align-items: end; }
    .summary { margin-left: auto; min-width: 280px; display: grid; gap: 10px; }
    .summary > div { display: flex; justify-content: space-between; gap: 16px; }
    .grand-total { font-size: 18px; }
    .btn { border: 1px solid #ccc; background: #fff; padding: 10px 14px; border-radius: 8px; cursor: pointer; text-decoration: none; color: inherit; width: fit-content; }
    .btn-primary { background: #111827; color: #fff; border-color: #111827; }
    .btn-danger { background: #b91c1c; color: #fff; border-color: #b91c1c; }
    .error { color: #b91c1c; margin-bottom: 12px; }
    @media (max-width: 960px) {
      .two-cols { grid-template-columns: 1fr; }
      .line-row { grid-template-columns: 1fr; }
      .summary { margin-left: 0; }
    }
  `]
})
export class InvoiceFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly customerService = inject(CustomerService);
  private readonly invoiceService = inject(InvoiceService);
  private readonly router = inject(Router);

  customers: Customer[] = [];
  saving = false;
  errorMessage = '';

  form = this.fb.group({
    customerId: ['', Validators.required],
    issueDate: ['', Validators.required],
    dueDate: ['', Validators.required],
    lines: this.fb.array([this.createLineGroup()])
  });

  ngOnInit(): void {
    this.customerService.getAll().subscribe({
      next: (customers) => this.customers = customers,
      error: () => this.errorMessage = 'Failed to load customers.'
    });
  }

  get lines(): FormArray {
    return this.form.get('lines') as FormArray;
  }

  createLineGroup() {
    return this.fb.group({
      description: ['', [Validators.required, Validators.maxLength(255)]],
      quantity: [1, [Validators.required, Validators.min(0.01)]],
      unitPrice: [0, [Validators.required, Validators.min(0.01)]]
    });
  }

  addLine(): void {
    this.lines.push(this.createLineGroup());
  }

  removeLine(index: number): void {
    if (this.lines.length === 1) return;
    this.lines.removeAt(index);
  }

  getLineTotal(index: number): number {
    const line = this.lines.at(index).value;
    const quantity = Number(line.quantity ?? 0);
    const unitPrice = Number(line.unitPrice ?? 0);
    return quantity * unitPrice;
  }

  get subtotal(): number {
    return this.lines.controls.reduce((sum, _, index) => sum + this.getLineTotal(index), 0);
  }

  get total(): number {
    return this.subtotal;
  }

  formatMoney(value: number): string {
    return new Intl.NumberFormat('fr-MA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.errorMessage = '';

    const raw = this.form.getRawValue();

    const payload: InvoiceCreateRequest = {
      customerId: Number(raw.customerId),
      issueDate: raw.issueDate || '',
      dueDate: raw.dueDate || '',
      lines: (raw.lines || []).map(line => ({
        description: line.description || '',
        quantity: Number(line.quantity),
        unitPrice: Number(line.unitPrice)
      }))
    };

    this.invoiceService.createDraft(payload).subscribe({
      next: () => {
        this.saving = false;
        this.router.navigate(['/invoices']);
      },
      error: () => {
        this.saving = false;
        this.errorMessage = 'Failed to create invoice.';
      }
    });
  }
}
