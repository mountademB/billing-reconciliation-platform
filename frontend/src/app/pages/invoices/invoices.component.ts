import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize, timeout } from 'rxjs';
import { Invoice, InvoiceService, InvoiceStatus } from '../../core/services/invoice.service';

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="page">
      <div class="page-header">
        <h2>Invoices</h2>
        <div class="header-actions">
          <a routerLink="/invoices/new" class="btn btn-primary">New Invoice</a>
          <button type="button" class="btn" (click)="markOverdue()">Mark Overdue</button>
        </div>
      </div>

      <section class="filters-card">
        <div class="filters-header">
          <h3>Filters</h3>
          <button type="button" class="btn" (click)="clearFilters()">Clear</button>
        </div>

        <div class="filters-grid">
          <label>
            <span>Invoice #</span>
            <input type="text" [(ngModel)]="invoiceNumberFilter" placeholder="Search invoice number">
          </label>

          <label>
            <span>Customer</span>
            <select [(ngModel)]="customerFilter">
              <option value="">All customers</option>
              @for (customer of customerOptions; track customer) {
                <option [value]="customer">{{ customer }}</option>
              }
            </select>
          </label>

          <label>
            <span>Status</span>
            <select [(ngModel)]="statusFilter">
              <option value="">All statuses</option>
              @for (status of statusOptions; track status) {
                <option [value]="status">{{ status }}</option>
              }
            </select>
          </label>

          <label>
            <span>Due Date From</span>
            <input type="date" [(ngModel)]="dueDateFromFilter">
          </label>

          <label>
            <span>Due Date To</span>
            <input type="date" [(ngModel)]="dueDateToFilter">
          </label>
        </div>
      </section>

      @if (loading) {
        <p>Loading invoices...</p>
      } @else if (errorMessage) {
        <p class="error">{{ errorMessage }}</p>
      } @else if (filteredInvoices.length === 0) {
        <p>No invoices match the current filters.</p>
      } @else {
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Customer</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Balance</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (invoice of filteredInvoices; track invoice.id) {
                <tr>
                  <td>{{ invoice.invoiceNumber }}</td>
                  <td>{{ invoice.customerName }}</td>
                  <td>{{ invoice.issueDate }}</td>
                  <td>{{ invoice.dueDate }}</td>
                  <td>
                    <span class="badge" [class]="badgeClass(invoice.status)">
                      {{ invoice.status }}
                    </span>
                  </td>
                  <td>{{ formatMoney(invoice.totalAmount) }}</td>
                  <td>{{ formatMoney(invoice.amountPaid) }}</td>
                  <td class="money-strong">{{ formatMoney(invoice.balanceDue) }}</td>
                  <td class="actions">
                    <a [routerLink]="['/invoices', invoice.id]" class="btn">View</a>
                    @if (invoice.status === 'DRAFT') {
                      <button type="button" class="btn btn-primary" (click)="changeStatus(invoice.id, 'ISSUED')">Issue</button>
                    }
                    @if (invoice.status === 'DRAFT' || (invoice.status === 'ISSUED' && invoice.amountPaid === 0)) {
                      <button type="button" class="btn btn-danger" (click)="changeStatus(invoice.id, 'CANCELLED')">Cancel</button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </section>
  `,
  styles: [`
    .page { padding: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .header-actions { display: flex; gap: 8px; }

    .filters-card { background: #fff; border: 1px solid #ddd; border-radius: 14px; padding: 16px; margin-bottom: 16px; }
    .filters-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .filters-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; }
    .filters-grid label { display: grid; gap: 8px; }
    .filters-grid input, .filters-grid select {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #ccc;
      border-radius: 10px;
      font: inherit;
    }

    .table-wrap { overflow-x: auto; background: #fff; border: 1px solid #ddd; border-radius: 14px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 10px 12px; border-bottom: 1px solid #eee; text-align: left; vertical-align: middle; }
    .money-strong { font-weight: 700; }

    .actions { display: flex; gap: 8px; flex-wrap: wrap; min-width: 180px; }

    .btn {
      border: 1px solid #ccc;
      background: #fff;
      padding: 8px 12px;
      border-radius: 10px;
      cursor: pointer;
      text-decoration: none;
      color: inherit;
    }
    .btn-primary { background: #111827; color: #fff; border-color: #111827; }
    .btn-danger { background: #b91c1c; color: #fff; border-color: #b91c1c; }

    .badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 6px 10px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: .02em;
    }
    .draft { background: #e5e7eb; color: #111827; }
    .issued { background: #dbeafe; color: #1d4ed8; }
    .partially-paid { background: #fef3c7; color: #92400e; box-shadow: inset 0 0 0 1px #f4d37b; }
    .paid { background: #dcfce7; color: #166534; box-shadow: inset 0 0 0 1px #8fdda8; }
    .overdue { background: #fee2e2; color: #991b1b; box-shadow: inset 0 0 0 1px #f5a6a6; }
    .cancelled { background: #f3f4f6; color: #6b7280; }

    .error { color: #b91c1c; }

    @media (max-width: 1200px) {
      .filters-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }

    @media (max-width: 700px) {
      .filters-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class InvoicesComponent implements OnInit {
  private readonly invoiceService = inject(InvoiceService);
  private readonly cdr = inject(ChangeDetectorRef);

  invoices: Invoice[] = [];
  loading = false;
  errorMessage = '';

  invoiceNumberFilter = '';
  customerFilter = '';
  statusFilter = '';
  dueDateFromFilter = '';
  dueDateToFilter = '';

  statusOptions: InvoiceStatus[] = [
    'DRAFT',
    'ISSUED',
    'PARTIALLY_PAID',
    'PAID',
    'OVERDUE',
    'CANCELLED'
  ];

  ngOnInit(): void {
    this.loadInvoices();
  }

  get customerOptions(): string[] {
    return [...new Set(this.invoices.map(invoice => invoice.customerName))].sort((a, b) => a.localeCompare(b));
  }

  get filteredInvoices(): Invoice[] {
    return this.invoices.filter(invoice => {
      const matchesInvoiceNumber =
        !this.invoiceNumberFilter ||
        invoice.invoiceNumber.toLowerCase().includes(this.invoiceNumberFilter.toLowerCase().trim());

      const matchesCustomer =
        !this.customerFilter || invoice.customerName === this.customerFilter;

      const matchesStatus =
        !this.statusFilter || invoice.status === this.statusFilter;

      const dueDateValue = new Date(invoice.dueDate).getTime();

      const matchesDueDateFrom =
        !this.dueDateFromFilter || dueDateValue >= new Date(this.dueDateFromFilter).getTime();

      const matchesDueDateTo =
        !this.dueDateToFilter || dueDateValue <= new Date(this.dueDateToFilter).getTime();

      return matchesInvoiceNumber && matchesCustomer && matchesStatus && matchesDueDateFrom && matchesDueDateTo;
    });
  }

  loadInvoices(): void {
    this.loading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.invoiceService.getAll()
      .pipe(
        timeout(8000),
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (invoices) => {
          this.invoices = invoices;
          this.cdr.detectChanges();
        },
        error: () => {
          this.errorMessage = 'Failed to load invoices.';
          this.cdr.detectChanges();
        }
      });
  }

  clearFilters(): void {
    this.invoiceNumberFilter = '';
    this.customerFilter = '';
    this.statusFilter = '';
    this.dueDateFromFilter = '';
    this.dueDateToFilter = '';
    this.cdr.detectChanges();
  }

  changeStatus(id: number, status: InvoiceStatus): void {
    this.invoiceService.updateStatus(id, status).subscribe({
      next: () => this.loadInvoices(),
      error: () => {
        this.errorMessage = 'Failed to update invoice status.';
        this.cdr.detectChanges();
      }
    });
  }

  markOverdue(): void {
    this.invoiceService.markOverdue().subscribe({
      next: () => this.loadInvoices(),
      error: () => {
        this.errorMessage = 'Failed to mark overdue invoices.';
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
