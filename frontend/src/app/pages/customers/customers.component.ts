import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { finalize, timeout } from 'rxjs';
import { Customer, CustomerService } from '../../core/services/customer.service';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="page">
      <div class="page-header">
        <h2>Customers</h2>
        <a routerLink="/customers/new" class="btn btn-primary">New Customer</a>
      </div>

      @if (loading) {
        <p>Loading customers...</p>
      } @else if (errorMessage) {
        <p class="error">{{ errorMessage }}</p>
      } @else if (customers.length === 0) {
        <p>No customers found.</p>
      } @else {
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Billing Address</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (customer of customers; track customer.id) {
                <tr>
                  <td>{{ customer.name }}</td>
                  <td>{{ customer.email }}</td>
                  <td>{{ customer.phone }}</td>
                  <td>{{ customer.billingAddress }}</td>
                  <td class="actions">
                    <button type="button" class="btn" (click)="editCustomer(customer.id)">Edit</button>
                    <button type="button" class="btn btn-danger" (click)="deleteCustomer(customer.id)">Delete</button>
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
    .table-wrap { overflow-x: auto; background: #fff; border: 1px solid #ddd; border-radius: 12px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 12px; border-bottom: 1px solid #eee; text-align: left; }
    .actions { display: flex; gap: 8px; }
    .btn { border: 1px solid #ccc; background: #fff; padding: 8px 12px; border-radius: 8px; cursor: pointer; text-decoration: none; color: inherit; }
    .btn-primary { background: #111827; color: #fff; border-color: #111827; }
    .btn-danger { background: #b91c1c; color: #fff; border-color: #b91c1c; }
    .error { color: #b91c1c; }
  `]
})
export class CustomersComponent implements OnInit {
  private readonly customerService = inject(CustomerService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  customers: Customer[] = [];
  loading = false;
  errorMessage = '';

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.loading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.customerService.getAll()
      .pipe(
        timeout(8000),
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (customers) => {
          this.customers = customers;
          this.cdr.detectChanges();
        },
        error: () => {
          this.errorMessage = 'Failed to load customers.';
          this.cdr.detectChanges();
        }
      });
  }

  editCustomer(id: number): void {
    this.router.navigate(['/customers', id, 'edit']);
  }

  deleteCustomer(id: number): void {
    const confirmed = window.confirm('Delete this customer?');
    if (!confirmed) return;

    this.customerService.delete(id).subscribe({
      next: () => this.loadCustomers(),
      error: () => {
        this.errorMessage = 'Failed to delete customer.';
        this.cdr.detectChanges();
      }
    });
  }
}
