package com.mountadem.billing.dto.invoice;

import com.mountadem.billing.enums.InvoiceStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class InvoiceStatusUpdateRequest {

    @NotNull(message = "Status is required")
    private InvoiceStatus status;
}
