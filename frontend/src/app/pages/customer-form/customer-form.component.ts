import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CustomerService } from '../../core/services/customer.service';

@Component({
  selector: 'app-customer-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="page">
      <div class="page-header">
        <h2>{{ isEditMode ? 'Edit Customer' : 'New Customer' }}</h2>
        <a routerLink="/customers" class="btn">Back</a>
      </div>

      @if (errorMessage) {
        <p class="error">{{ errorMessage }}</p>
      }

      <form [formGroup]="form" (ngSubmit)="submit()" class="form-card">
        <label>
          <span>Name</span>
          <input type="text" formControlName="name">
        </label>

        <label>
          <span>Email</span>
          <input type="email" formControlName="email">
        </label>

        <label>
          <span>Phone</span>
          <input type="text" formControlName="phone">
        </label>

        <label>
          <span>Billing Address</span>
          <textarea rows="4" formControlName="billingAddress"></textarea>
        </label>

        <button type="submit" class="btn btn-primary" [disabled]="form.invalid || saving">
          {{ saving ? 'Saving...' : (isEditMode ? 'Update Customer' : 'Create Customer') }}
        </button>
      </form>
    </section>
  `,
  styles: [`
    .page { padding: 24px; max-width: 800px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .form-card { display: grid; gap: 16px; background: #fff; border: 1px solid #ddd; border-radius: 12px; padding: 20px; }
    label { display: grid; gap: 8px; }
    input, textarea { width: 100%; padding: 10px 12px; border: 1px solid #ccc; border-radius: 8px; font: inherit; }
    .btn { border: 1px solid #ccc; background: #fff; padding: 10px 14px; border-radius: 8px; cursor: pointer; text-decoration: none; color: inherit; width: fit-content; }
    .btn-primary { background: #111827; color: #fff; border-color: #111827; }
    .error { color: #b91c1c; margin-bottom: 12px; }
  `]
})
export class CustomerFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly customerService = inject(CustomerService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  saving = false;
  errorMessage = '';
  customerId: number | null = null;

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    phone: ['', [Validators.maxLength(30)]],
    billingAddress: ['', [Validators.maxLength(500)]]
  });

  get isEditMode(): boolean {
    return this.customerId !== null;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.customerId = Number(id);
    this.customerService.getById(this.customerId).subscribe({
      next: (customer) => this.form.patchValue({
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        billingAddress: customer.billingAddress
      }),
      error: () => this.errorMessage = 'Failed to load customer.'
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    const payload = this.form.getRawValue();

    const request$ = this.isEditMode
      ? this.customerService.update(this.customerId!, payload)
      : this.customerService.create(payload);

    request$.subscribe({
      next: () => {
        this.saving = false;
        this.router.navigate(['/customers']);
      },
      error: () => {
        this.saving = false;
        this.errorMessage = 'Failed to save customer.';
      }
    });
  }
}
