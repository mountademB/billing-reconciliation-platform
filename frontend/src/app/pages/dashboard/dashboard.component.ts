import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { finalize, timeout } from 'rxjs';
import { DashboardService, BillingDashboardSummary } from '../../core/services/dashboard.service';
import { Invoice, InvoiceService } from '../../core/services/invoice.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="page">
      <div class="page-header">
        <div>
          <h2>Dashboard</h2>
          <p class="muted">Finance operations overview</p>
        </div>
        <div class="header-actions">
          <a routerLink="/invoices/new" class="btn btn-primary">New Invoice</a>
          <a routerLink="/customers/new" class="btn">New Customer</a>
        </div>
      </div>

      @if (loading) {
        <p>Loading dashboard...</p>
      } @else if (errorMessage) {
        <p class="error">{{ errorMessage }}</p>
      } @else if (summary) {
        <div class="cards">
          <article class="stat-card">
            <span>Total Invoices</span>
            <strong>{{ summary.totalInvoices }}</strong>
          </article>

          <article class="stat-card">
            <span>Outstanding Balance</span>
            <strong>{{ formatMoney(summary.totalOutstandingBalance) }}</strong>
          </article>

          <article class="stat-card">
            <span>Overdue Invoices</span>
            <strong>{{ summary.totalOverdueInvoices }}</strong>
          </article>

          <article class="stat-card">
            <span>Paid Invoices</span>
            <strong>{{ summary.totalPaidInvoices }}</strong>
          </article>

          <article class="stat-card">
            <span>Customers</span>
            <strong>{{ summary.totalCustomers }}</strong>
          </article>

          <article class="stat-card">
            <span>Revenue Collected</span>
            <strong>{{ formatMoney(summary.totalRevenueCollected) }}</strong>
          </article>
        </div>

        <div class="sections">
          <section class="card">
            <div class="section-header">
              <h3>Overdue Invoices</h3>
              <a routerLink="/invoices" class="link-btn">View all invoices</a>
            </div>

            @if (overdueInvoices.length === 0) {
              <p>No overdue invoices.</p>
            } @else {
              <div class="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Invoice #</th>
                      <th>Customer</th>
                      <th>Due Date</th>
                      <th>Balance</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (invoice of overdueInvoices; track invoice.id) {
                      <tr>
                        <td>{{ invoice.invoiceNumber }}</td>
                        <td>{{ invoice.customerName }}</td>
                        <td>{{ invoice.dueDate }}</td>
                        <td>{{ formatMoney(invoice.balanceDue) }}</td>
                        <td>
                          <a [routerLink]="['/invoices', invoice.id]" class="btn">Open</a>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </section>

          <section class="card">
            <div class="section-header">
              <h3>Unpaid Invoice Quick Links</h3>
              <a routerLink="/invoices" class="link-btn">Go to invoices</a>
            </div>

            @if (unpaidInvoices.length === 0) {
              <p>No unpaid invoices.</p>
            } @else {
              <div class="quick-links">
                @for (invoice of unpaidInvoices; track invoice.id) {
                  <a class="quick-link" [routerLink]="['/invoices', invoice.id]">
                    <div>
                      <strong>{{ invoice.invoiceNumber }}</strong>
                      <span>{{ invoice.customerName }}</span>
                    </div>
                    <div class="quick-meta">
                      <span>{{ invoice.status }}</span>
                      <strong>{{ formatMoney(invoice.balanceDue) }}</strong>
                    </div>
                  </a>
                }
              </div>
            }
          </section>
        </div>
      }
    </section>
  `,
  styles: [`
    .page { padding: 24px; display: grid; gap: 20px; }
    .page-header { display: flex; justify-content: space-between; align-items: start; gap: 16px; }
    .muted { color: #6b7280; margin: 4px 0 0; }
    .header-actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .cards { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
    .stat-card { background: #fff; border: 1px solid #ddd; border-radius: 12px; padding: 18px; display: grid; gap: 8px; }
    .stat-card span { color: #6b7280; font-size: 14px; }
    .stat-card strong { font-size: 28px; color: #111827; }
    .sections { display: grid; grid-template-columns: 1.2fr 1fr; gap: 20px; }
    .card { background: #fff; border: 1px solid #ddd; border-radius: 12px; padding: 20px; }
    .section-header { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 16px; }
    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 12px; border-bottom: 1px solid #eee; text-align: left; vertical-align: middle; }
    .quick-links { display: grid; gap: 12px; }
    .quick-link { display: flex; justify-content: space-between; gap: 16px; padding: 14px; border: 1px solid #eee; border-radius: 12px; text-decoration: none; color: inherit; }
    .quick-link:hover { background: #f9fafb; }
    .quick-link div { display: grid; gap: 4px; }
    .quick-link span { color: #6b7280; font-size: 14px; }
    .quick-meta { text-align: right; }
    .btn, .link-btn { border: 1px solid #ccc; background: #fff; padding: 8px 12px; border-radius: 8px; cursor: pointer; text-decoration: none; color: inherit; width: fit-content; }
    .btn-primary { background: #111827; color: #fff; border-color: #111827; }
    .error { color: #b91c1c; }
    @media (max-width: 1100px) {
      .cards { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .sections { grid-template-columns: 1fr; }
    }
    @media (max-width: 700px) {
      .cards { grid-template-columns: 1fr; }
      .page-header { flex-direction: column; align-items: stretch; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly invoiceService = inject(InvoiceService);
  private readonly cdr = inject(ChangeDetectorRef);

  summary: BillingDashboardSummary | null = null;
  overdueInvoices: Invoice[] = [];
  unpaidInvoices: Invoice[] = [];
  loading = false;
  errorMessage = '';

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    let summaryDone = false;
    let invoicesDone = false;

    const finishIfDone = () => {
      if (summaryDone && invoicesDone) {
        this.loading = false;
        this.cdr.detectChanges();
      }
    };

    this.dashboardService.getSummary()
      .pipe(timeout(8000))
      .subscribe({
        next: (summary) => {
          this.summary = summary;
          summaryDone = true;
          this.cdr.detectChanges();
          finishIfDone();
        },
        error: () => {
          this.errorMessage = 'Failed to load dashboard summary.';
          summaryDone = true;
          invoicesDone = true;
          this.loading = false;
          this.cdr.detectChanges();
        }
      });

    this.invoiceService.getAll()
      .pipe(timeout(8000))
      .subscribe({
        next: (invoices) => {
          this.overdueInvoices = invoices
            .filter(invoice => invoice.status === 'OVERDUE')
            .sort((a, b) => b.balanceDue - a.balanceDue);

          this.unpaidInvoices = invoices
            .filter(invoice => ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'].includes(invoice.status) && invoice.balanceDue > 0)
            .sort((a, b) => b.balanceDue - a.balanceDue)
            .slice(0, 6);

          invoicesDone = true;
          this.cdr.detectChanges();
          finishIfDone();
        },
        error: () => {
          this.errorMessage = 'Failed to load invoice data.';
          summaryDone = true;
          invoicesDone = true;
          this.loading = false;
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
}
