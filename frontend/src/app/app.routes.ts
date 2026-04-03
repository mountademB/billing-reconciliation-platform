import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { CustomersComponent } from './pages/customers/customers.component';
import { CustomerFormComponent } from './pages/customer-form/customer-form.component';
import { InvoicesComponent } from './pages/invoices/invoices.component';
import { InvoiceFormComponent } from './pages/invoice-form/invoice-form.component';
import { InvoiceDetailComponent } from './pages/invoice-detail/invoice-detail.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'customers', component: CustomersComponent },
  { path: 'customers/new', component: CustomerFormComponent },
  { path: 'customers/:id/edit', component: CustomerFormComponent },
  { path: 'invoices', component: InvoicesComponent },
  { path: 'invoices/new', component: InvoiceFormComponent },
  { path: 'invoices/:id', component: InvoiceDetailComponent },
  { path: '**', redirectTo: 'dashboard' }
];
