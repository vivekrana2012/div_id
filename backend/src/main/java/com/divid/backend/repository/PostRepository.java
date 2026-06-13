package com.divid.backend.repository;

import com.divid.backend.model.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostRepository extends JpaRepository<Post, String> {
    Page<Post> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);
    Page<Post> findByAuthorIdOrderByCreatedAtDesc(String authorId, Pageable pageable);
}
