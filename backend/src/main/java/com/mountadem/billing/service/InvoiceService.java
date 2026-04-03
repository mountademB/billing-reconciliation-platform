package com.mountadem.billing.service;

import com.mountadem.billing.dto.invoice.InvoiceCreateRequest;
import com.mountadem.billing.dto.invoice.InvoiceLineRequest;
import com.mountadem.billing.dto.invoice.InvoiceLineResponse;
import com.mountadem.billing.dto.invoice.InvoiceResponse;
import com.mountadem.billing.dto.invoice.InvoiceUpdateRequest;
import com.mountadem.billing.entity.Customer;
import com.mountadem.billing.entity.Invoice;
import com.mountadem.billing.entity.InvoiceLine;
import com.mountadem.billing.enums.InvoiceStatus;
import com.mountadem.billing.exception.BusinessRuleException;
import com.mountadem.billing.exception.ResourceNotFoundException;
import com.mountadem.billing.repository.CustomerRepository;
import com.mountadem.billing.repository.InvoiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final CustomerRepository customerRepository;

    public List<InvoiceResponse> getAllInvoices() {
        return invoiceRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public InvoiceResponse getInvoiceById(Long id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with id: " + id));
        return mapToResponse(invoice);
    }

    public InvoiceResponse createDraftInvoice(InvoiceCreateRequest request) {
        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + request.getCustomerId()));

        validateDates(request.getIssueDate(), request.getDueDate());

        Invoice invoice = Invoice.builder()
                .invoiceNumber(generateInvoiceNumber())
                .customer(customer)
                .issueDate(request.getIssueDate())
                .dueDate(request.getDueDate())
                .status(InvoiceStatus.DRAFT)
                .taxAmount(zero())
                .amountPaid(zero())
                .build();

        applyLinesAndTotals(invoice, request.getLines());

        Invoice savedInvoice = invoiceRepository.save(invoice);
        return mapToResponse(savedInvoice);
    }

    public InvoiceResponse updateDraftInvoice(Long id, InvoiceUpdateRequest request) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with id: " + id));

        if (invoice.getStatus() != InvoiceStatus.DRAFT) {
            throw new BusinessRuleException("Only DRAFT invoices can be edited");
        }

        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + request.getCustomerId()));

        validateDates(request.getIssueDate(), request.getDueDate());

        invoice.setCustomer(customer);
        invoice.setIssueDate(request.getIssueDate());
        invoice.setDueDate(request.getDueDate());

        applyLinesAndTotals(invoice, request.getLines());

        Invoice savedInvoice = invoiceRepository.save(invoice);
        return mapToResponse(savedInvoice);
    }

    public InvoiceResponse updateInvoiceStatus(Long id, InvoiceStatus targetStatus) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with id: " + id));

        InvoiceStatus currentStatus = invoice.getStatus();

        if (targetStatus == InvoiceStatus.ISSUED) {
            if (currentStatus != InvoiceStatus.DRAFT) {
                throw new BusinessRuleException("Only DRAFT invoices can become ISSUED");
            }
            invoice.setStatus(InvoiceStatus.ISSUED);
        } else if (targetStatus == InvoiceStatus.CANCELLED) {
            if (currentStatus == InvoiceStatus.DRAFT) {
                invoice.setStatus(InvoiceStatus.CANCELLED);
            } else if (currentStatus == InvoiceStatus.ISSUED && invoice.getAmountPaid().compareTo(zero()) == 0) {
                invoice.setStatus(InvoiceStatus.CANCELLED);
            } else {
                throw new BusinessRuleException("Only DRAFT invoices or unpaid ISSUED invoices can be cancelled");
            }
        } else {
            throw new BusinessRuleException("Only ISSUED and CANCELLED transitions are allowed in this phase");
        }

        Invoice savedInvoice = invoiceRepository.save(invoice);
        return mapToResponse(savedInvoice);
    }

    public List<InvoiceResponse> markOverdueInvoices() {
        LocalDate today = LocalDate.now();

        List<Invoice> updatedInvoices = invoiceRepository.findAll()
                .stream()
                .filter(invoice ->
                        (invoice.getStatus() == InvoiceStatus.ISSUED || invoice.getStatus() == InvoiceStatus.PARTIALLY_PAID)
                                && invoice.getDueDate().isBefore(today)
                                && invoice.getBalanceDue().compareTo(zero()) > 0
                )
                .peek(invoice -> invoice.setStatus(InvoiceStatus.OVERDUE))
                .toList();

        if (!updatedInvoices.isEmpty()) {
            invoiceRepository.saveAll(updatedInvoices);
        }

        return updatedInvoices.stream()
                .map(this::mapToResponse)
                .toList();
    }

    private void applyLinesAndTotals(Invoice invoice, List<InvoiceLineRequest> lineRequests) {
        List<InvoiceLine> invoiceLines = lineRequests.stream()
                .map(lineRequest -> buildInvoiceLine(invoice, lineRequest))
                .toList();

        invoice.getLines().clear();
        invoice.getLines().addAll(invoiceLines);

        BigDecimal subtotal = invoiceLines.stream()
                .map(InvoiceLine::getLineTotal)
                .reduce(zero(), BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal taxAmount = invoice.getTaxAmount() == null ? zero() : invoice.getTaxAmount().setScale(2, RoundingMode.HALF_UP);
        BigDecimal amountPaid = invoice.getAmountPaid() == null ? zero() : invoice.getAmountPaid().setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalAmount = subtotal.add(taxAmount).setScale(2, RoundingMode.HALF_UP);
        BigDecimal balanceDue = totalAmount.subtract(amountPaid).setScale(2, RoundingMode.HALF_UP);

        invoice.setSubtotal(subtotal);
        invoice.setTaxAmount(taxAmount);
        invoice.setTotalAmount(totalAmount);
        invoice.setAmountPaid(amountPaid);
        invoice.setBalanceDue(balanceDue);
    }

    private InvoiceLine buildInvoiceLine(Invoice invoice, InvoiceLineRequest request) {
        BigDecimal lineTotal = request.getQuantity()
                .multiply(request.getUnitPrice())
                .setScale(2, RoundingMode.HALF_UP);

        return InvoiceLine.builder()
                .invoice(invoice)
                .description(request.getDescription())
                .quantity(request.getQuantity().setScale(2, RoundingMode.HALF_UP))
                .unitPrice(request.getUnitPrice().setScale(2, RoundingMode.HALF_UP))
                .lineTotal(lineTotal)
                .build();
    }

    private void validateDates(LocalDate issueDate, LocalDate dueDate) {
        if (dueDate.isBefore(issueDate)) {
            throw new BusinessRuleException("Due date cannot be before issue date");
        }
    }

    private BigDecimal zero() {
        return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
    }

    private String generateInvoiceNumber() {
        return "INV-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private InvoiceResponse mapToResponse(Invoice invoice) {
        List<InvoiceLineResponse> lineResponses = invoice.getLines()
                .stream()
                .map(line -> InvoiceLineResponse.builder()
                        .id(line.getId())
                        .description(line.getDescription())
                        .quantity(line.getQuantity())
                        .unitPrice(line.getUnitPrice())
                        .lineTotal(line.getLineTotal())
                        .build())
                .toList();

        return InvoiceResponse.builder()
                .id(invoice.getId())
                .invoiceNumber(invoice.getInvoiceNumber())
                .customerId(invoice.getCustomer().getId())
                .customerName(invoice.getCustomer().getName())
                .issueDate(invoice.getIssueDate())
                .dueDate(invoice.getDueDate())
                .status(invoice.getStatus())
                .subtotal(invoice.getSubtotal())
                .taxAmount(invoice.getTaxAmount())
                .totalAmount(invoice.getTotalAmount())
                .amountPaid(invoice.getAmountPaid())
                .balanceDue(invoice.getBalanceDue())
                .lines(lineResponses)
                .createdAt(invoice.getCreatedAt())
                .updatedAt(invoice.getUpdatedAt())
                .build();
    }
}
