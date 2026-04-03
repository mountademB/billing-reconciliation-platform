package com.mountadem.billing.dto.dashboard;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class BillingDashboardSummaryResponse {
    private long totalCustomers;
    private long totalInvoices;
    private long totalPaidInvoices;
    private long totalOverdueInvoices;
    private long totalDraftInvoices;
    private BigDecimal totalOutstandingBalance;
    private BigDecimal totalRevenueCollected;
}
