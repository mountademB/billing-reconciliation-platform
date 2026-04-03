package com.mountadem.billing.service;

import com.mountadem.billing.dto.dashboard.BillingDashboardSummaryResponse;
import com.mountadem.billing.entity.Invoice;
import com.mountadem.billing.enums.InvoiceStatus;
import com.mountadem.billing.repository.CustomerRepository;
import com.mountadem.billing.repository.InvoiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BillingDashboardService {

    private final CustomerRepository customerRepository;
    private final InvoiceRepository invoiceRepository;

    public BillingDashboardSummaryResponse getSummary() {
        List<Invoice> invoices = invoiceRepository.findAll();

        long totalCustomers = customerRepository.count();
        long totalInvoices = invoices.size();
        long totalPaidInvoices = invoices.stream()
                .filter(invoice -> invoice.getStatus() == InvoiceStatus.PAID)
                .count();
        long totalOverdueInvoices = invoices.stream()
                .filter(invoice -> invoice.getStatus() == InvoiceStatus.OVERDUE)
                .count();
        long totalDraftInvoices = invoices.stream()
                .filter(invoice -> invoice.getStatus() == InvoiceStatus.DRAFT)
                .count();

        BigDecimal totalOutstandingBalance = invoices.stream()
                .filter(invoice -> invoice.getStatus() != InvoiceStatus.CANCELLED)
                .map(Invoice::getBalanceDue)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal totalRevenueCollected = invoices.stream()
                .filter(invoice -> invoice.getStatus() != InvoiceStatus.CANCELLED)
                .map(Invoice::getAmountPaid)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        return BillingDashboardSummaryResponse.builder()
                .totalCustomers(totalCustomers)
                .totalInvoices(totalInvoices)
                .totalPaidInvoices(totalPaidInvoices)
                .totalOverdueInvoices(totalOverdueInvoices)
                .totalDraftInvoices(totalDraftInvoices)
                .totalOutstandingBalance(totalOutstandingBalance)
                .totalRevenueCollected(totalRevenueCollected)
                .build();
    }
}
