package com.signify.modules.subscription.repository;

import com.signify.modules.subscription.model.ServicePackage;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ServicePackageRepository extends MongoRepository<ServicePackage, String> {
    List<ServicePackage> findAllByPlanTypeAndDurationDays(String planType, Integer durationDays);
}
