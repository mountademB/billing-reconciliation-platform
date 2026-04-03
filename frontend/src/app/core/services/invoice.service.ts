import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type InvoiceStatus =
  | 'DRAFT'
  | 'ISSUED'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'OVERDUE'
  | 'CANCELLED';

export type PaymentMethod =
  | 'CASH'
  | 'BANK_TRANSFER'
  | 'CREDIT_CARD'
  | 'DEBIT_CARD'
  | 'CHECK'
  | 'OTHER';

export interface InvoiceLine {
  id: number;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  customerId: number;
  customerName: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  lines: InvoiceLine[];
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceLineRequest {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface InvoiceCreateRequest {
  customerId: number;
  issueDate: string;
  dueDate: string;
  lines: InvoiceLineRequest[];
}

export interface Payment {
  id: number;
  invoiceId: number;
  paymentDate: string;
  amount: number;
  method: PaymentMethod;
  reference: string;
  notes: string;
  createdAt: string;
}

export interface PaymentCreateRequest {
  paymentDate: string;
  amount: number;
  method: PaymentMethod;
  reference: string;
  notes: string;
}

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/invoices';

  getAll(): Observable<Invoice[]> {
    return this.http.get<Invoice[]>(this.apiUrl);
  }

  getById(id: number): Observable<Invoice> {
    return this.http.get<Invoice>(`${this.apiUrl}/${id}`);
  }

  createDraft(payload: InvoiceCreateRequest): Observable<Invoice> {
    return this.http.post<Invoice>(this.apiUrl, payload);
  }

  updateStatus(id: number, status: InvoiceStatus): Observable<Invoice> {
    return this.http.put<Invoice>(`${this.apiUrl}/${id}/status`, { status });
  }

  markOverdue(): Observable<Invoice[]> {
    return this.http.put<Invoice[]>(`${this.apiUrl}/mark-overdue`, {});
  }

  getPayments(invoiceId: number): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.apiUrl}/${invoiceId}/payments`);
  }

  createPayment(invoiceId: number, payload: PaymentCreateRequest): Observable<Payment> {
    return this.http.post<Payment>(`${this.apiUrl}/${invoiceId}/payments`, payload);
  }
}
