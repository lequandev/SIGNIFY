package com.signify.modules.classroom.repository;

import com.signify.modules.classroom.model.Classroom;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClassroomRepository extends MongoRepository<Classroom, String> {
    List<Classroom> findByTeacherIdAndStatusNot(String teacherId, String excludeStatus);
    List<Classroom> findByTeacherId(String teacherId);
    List<Classroom> findBySchoolId(String schoolId);
    long countBySchoolId(String schoolId);
}
