package com.signify.modules.subscription.repository;

import com.signify.modules.subscription.model.ServicePackage;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ServicePackageRepository extends MongoRepository<ServicePackage, String> {
}
