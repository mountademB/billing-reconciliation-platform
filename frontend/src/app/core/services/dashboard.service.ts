import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface BillingDashboardSummary {
  totalCustomers: number;
  totalInvoices: number;
  totalPaidInvoices: number;
  totalOverdueInvoices: number;
  totalDraftInvoices: number;
  totalOutstandingBalance: number;
  totalRevenueCollected: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/dashboard';

  getSummary(): Observable<BillingDashboardSummary> {
    return this.http.get<BillingDashboardSummary>(`${this.apiUrl}/summary`);
  }
}
