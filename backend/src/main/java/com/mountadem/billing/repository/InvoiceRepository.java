package com.mountadem.billing.repository;

import com.mountadem.billing.entity.Invoice;
import com.mountadem.billing.enums.InvoiceStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);
    List<Invoice> findByStatus(InvoiceStatus status);
}
