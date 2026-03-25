package com.example.eventmanagement.repository;

import com.example.eventmanagement.model.User;
import com.example.eventmanagement.model.enums.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.Optional;

public interface UserRepository extends MongoRepository<User, String> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    @Query("{ $and: [ { $or: [ { 'email': { $regex: ?0, $options: 'i' } }, { 'fullName': { $regex: ?0, $options: 'i' } } ] }, { 'role': ?1 } ] }")
    Page<User> findByKeywordAndRole(String keyword, Role role, Pageable pageable);

    @Query("{ $or: [ { 'email': { $regex: ?0, $options: 'i' } }, { 'fullName': { $regex: ?0, $options: 'i' } } ] }")
    Page<User> findByKeyword(String keyword, Pageable pageable);

    Page<User> findByRole(Role role, Pageable pageable);
}
