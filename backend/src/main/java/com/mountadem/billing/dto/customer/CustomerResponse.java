package com.mountadem.billing.dto.customer;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class CustomerResponse {
    private Long id;
    private String name;
    private String email;
    private String phone;
    private String billingAddress;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
