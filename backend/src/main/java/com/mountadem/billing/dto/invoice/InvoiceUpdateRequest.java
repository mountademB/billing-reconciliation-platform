package com.mountadem.billing.dto.invoice;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class InvoiceUpdateRequest {

    @NotNull(message = "Customer id is required")
    private Long customerId;

    @NotNull(message = "Issue date is required")
    private LocalDate issueDate;

    @NotNull(message = "Due date is required")
    private LocalDate dueDate;

    @Valid
    @NotEmpty(message = "At least one invoice line is required")
    private List<InvoiceLineRequest> lines;
}
