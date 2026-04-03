import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  billingAddress: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerCreateRequest {
  name: string;
  email: string;
  phone: string;
  billingAddress: string;
}

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/customers';

  getAll(): Observable<Customer[]> {
    return this.http.get<Customer[]>(this.apiUrl);
  }

  getById(id: number): Observable<Customer> {
    return this.http.get<Customer>(`${this.apiUrl}/${id}`);
  }

  create(payload: CustomerCreateRequest): Observable<Customer> {
    return this.http.post<Customer>(this.apiUrl, payload);
  }

  update(id: number, payload: CustomerCreateRequest): Observable<Customer> {
    return this.http.put<Customer>(`${this.apiUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
