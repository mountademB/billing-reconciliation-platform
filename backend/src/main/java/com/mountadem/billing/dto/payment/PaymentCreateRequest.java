package com.mountadem.billing.dto.payment;

import com.mountadem.billing.enums.PaymentMethod;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class PaymentCreateRequest {

    @NotNull(message = "Payment date is required")
    private LocalDate paymentDate;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
    private BigDecimal amount;

    @NotNull(message = "Payment method is required")
    private PaymentMethod method;

    @Size(max = 100, message = "Reference must not exceed 100 characters")
    private String reference;

    @Size(max = 500, message = "Notes must not exceed 500 characters")
    private String notes;
}
