package com.mountadem.billing.controller;

import com.mountadem.billing.dto.dashboard.BillingDashboardSummaryResponse;
import com.mountadem.billing.service.BillingDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class BillingDashboardController {

    private final BillingDashboardService billingDashboardService;

    @GetMapping("/summary")
    public BillingDashboardSummaryResponse getSummary() {
        return billingDashboardService.getSummary();
    }
}
