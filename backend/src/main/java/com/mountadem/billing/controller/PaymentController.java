package com.mountadem.billing.controller;

import com.mountadem.billing.dto.payment.PaymentCreateRequest;
import com.mountadem.billing.dto.payment.PaymentResponse;
import com.mountadem.billing.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/invoices/{invoiceId}/payments")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PaymentController {

    private final PaymentService paymentService;

    @GetMapping
    public List<PaymentResponse> getPaymentsByInvoiceId(@PathVariable Long invoiceId) {
        return paymentService.getPaymentsByInvoiceId(invoiceId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PaymentResponse createPayment(@PathVariable Long invoiceId, @Valid @RequestBody PaymentCreateRequest request) {
        return paymentService.createPayment(invoiceId, request);
    }
}
