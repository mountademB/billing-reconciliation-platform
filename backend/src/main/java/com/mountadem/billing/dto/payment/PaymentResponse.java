package com.mountadem.billing.dto.payment;

import com.mountadem.billing.enums.PaymentMethod;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class PaymentResponse {
    private Long id;
    private Long invoiceId;
    private LocalDate paymentDate;
    private BigDecimal amount;
    private PaymentMethod method;
    private String reference;
    private String notes;
    private LocalDateTime createdAt;
}
