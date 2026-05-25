package com.signify.modules.payment.repository;

import com.signify.modules.payment.model.Payment;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface PaymentRepository extends MongoRepository<Payment, String> {
    Optional<Payment> findByOrderCode(Long orderCode);
}
