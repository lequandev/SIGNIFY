package com.signify.modules.subscription.repository;

import com.signify.modules.subscription.model.Subscription;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubscriptionRepository extends MongoRepository<Subscription, String> {
    List<Subscription> findByUserId(String userId);
    Optional<Subscription> findByUserIdAndStatus(String userId, String status);
}
