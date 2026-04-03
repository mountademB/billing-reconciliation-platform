package com.mountadem.billing.dto.invoice;

import com.mountadem.billing.enums.InvoiceStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class InvoiceResponse {
    private Long id;
    private String invoiceNumber;
    private Long customerId;
    private String customerName;
    private LocalDate issueDate;
    private LocalDate dueDate;
    private InvoiceStatus status;
    private BigDecimal subtotal;
    private BigDecimal taxAmount;
    private BigDecimal totalAmount;
    private BigDecimal amountPaid;
    private BigDecimal balanceDue;
    private List<InvoiceLineResponse> lines;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
