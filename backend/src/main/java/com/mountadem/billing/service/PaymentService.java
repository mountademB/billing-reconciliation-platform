package com.mountadem.billing.service;

import com.mountadem.billing.dto.payment.PaymentCreateRequest;
import com.mountadem.billing.dto.payment.PaymentResponse;
import com.mountadem.billing.entity.Invoice;
import com.mountadem.billing.entity.Payment;
import com.mountadem.billing.enums.InvoiceStatus;
import com.mountadem.billing.exception.BusinessRuleException;
import com.mountadem.billing.exception.ResourceNotFoundException;
import com.mountadem.billing.repository.InvoiceRepository;
import com.mountadem.billing.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;

    public List<PaymentResponse> getPaymentsByInvoiceId(Long invoiceId) {
        if (!invoiceRepository.existsById(invoiceId)) {
            throw new ResourceNotFoundException("Invoice not found with id: " + invoiceId);
        }

        return paymentRepository.findByInvoiceId(invoiceId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public PaymentResponse createPayment(Long invoiceId, PaymentCreateRequest request) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with id: " + invoiceId));

        if (invoice.getStatus() == InvoiceStatus.DRAFT) {
            throw new BusinessRuleException("Cannot record payment for a DRAFT invoice");
        }

        if (invoice.getStatus() == InvoiceStatus.CANCELLED) {
            throw new BusinessRuleException("Cannot record payment for a CANCELLED invoice");
        }

        if (invoice.getStatus() == InvoiceStatus.PAID) {
            throw new BusinessRuleException("Cannot record payment for a PAID invoice");
        }

        BigDecimal amount = request.getAmount().setScale(2, RoundingMode.HALF_UP);
        BigDecimal balanceDue = invoice.getBalanceDue().setScale(2, RoundingMode.HALF_UP);

        if (amount.compareTo(balanceDue) > 0) {
            throw new BusinessRuleException("Payment cannot exceed balance due");
        }

        Payment payment = Payment.builder()
                .invoice(invoice)
                .paymentDate(request.getPaymentDate())
                .amount(amount)
                .method(request.getMethod())
                .reference(request.getReference())
                .notes(request.getNotes())
                .build();

        Payment savedPayment = paymentRepository.save(payment);

        BigDecimal newAmountPaid = invoice.getAmountPaid()
                .add(amount)
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal newBalanceDue = invoice.getTotalAmount()
                .subtract(newAmountPaid)
                .setScale(2, RoundingMode.HALF_UP);

        invoice.setAmountPaid(newAmountPaid);
        invoice.setBalanceDue(newBalanceDue);

        if (newBalanceDue.compareTo(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP)) == 0) {
            invoice.setStatus(InvoiceStatus.PAID);
        } else {
            invoice.setStatus(InvoiceStatus.PARTIALLY_PAID);
        }

        invoiceRepository.save(invoice);

        return mapToResponse(savedPayment);
    }

    private PaymentResponse mapToResponse(Payment payment) {
        return PaymentResponse.builder()
                .id(payment.getId())
                .invoiceId(payment.getInvoice().getId())
                .paymentDate(payment.getPaymentDate())
                .amount(payment.getAmount())
                .method(payment.getMethod())
                .reference(payment.getReference())
                .notes(payment.getNotes())
                .createdAt(payment.getCreatedAt())
                .build();
    }
}
