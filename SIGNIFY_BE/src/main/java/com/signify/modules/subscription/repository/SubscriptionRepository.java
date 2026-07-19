package com.signify.modules.subscription.repository;

import com.signify.modules.subscription.model.Subscription;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface SubscriptionRepository extends MongoRepository<Subscription, String> {
    Optional<Subscription> findByUserIdAndStatus(String userId, String status);
    Optional<Subscription> findFirstByUserIdAndStatusAndEndDateAfter(String userId, String status, LocalDateTime now);
}
