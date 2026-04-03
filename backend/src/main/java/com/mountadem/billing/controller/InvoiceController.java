package com.mountadem.billing.controller;

import com.mountadem.billing.dto.invoice.InvoiceCreateRequest;
import com.mountadem.billing.dto.invoice.InvoiceResponse;
import com.mountadem.billing.dto.invoice.InvoiceStatusUpdateRequest;
import com.mountadem.billing.dto.invoice.InvoiceUpdateRequest;
import com.mountadem.billing.service.InvoiceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class InvoiceController {

    private final InvoiceService invoiceService;

    @GetMapping
    public List<InvoiceResponse> getAllInvoices() {
        return invoiceService.getAllInvoices();
    }

    @GetMapping("/{id}")
    public InvoiceResponse getInvoiceById(@PathVariable Long id) {
        return invoiceService.getInvoiceById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public InvoiceResponse createInvoice(@Valid @RequestBody InvoiceCreateRequest request) {
        return invoiceService.createDraftInvoice(request);
    }

    @PutMapping("/{id}")
    public InvoiceResponse updateInvoice(@PathVariable Long id, @Valid @RequestBody InvoiceUpdateRequest request) {
        return invoiceService.updateDraftInvoice(id, request);
    }

    @PutMapping("/{id}/status")
    public InvoiceResponse updateInvoiceStatus(@PathVariable Long id, @Valid @RequestBody InvoiceStatusUpdateRequest request) {
        return invoiceService.updateInvoiceStatus(id, request.getStatus());
    }

    @PutMapping("/mark-overdue")
    public List<InvoiceResponse> markOverdueInvoices() {
        return invoiceService.markOverdueInvoices();
    }
}
