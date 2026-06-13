package com.divid.backend.service;

import com.divid.backend.dto.PostRequest;
import com.divid.backend.dto.PostResponse;
import com.divid.backend.model.Post;
import com.divid.backend.model.User;
import com.divid.backend.repository.PostRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.NoSuchElementException;

@Service
public class PostService {
    private final PostRepository postRepo;

    public PostService(PostRepository postRepo) {
        this.postRepo = postRepo;
    }

    public Page<PostResponse> listPublished(int page, int size) {
        return postRepo.findByStatusOrderByCreatedAtDesc("published",
                PageRequest.of(page, size)).map(PostResponse::from);
    }

    public Page<PostResponse> listByAuthor(String authorId, int page, int size) {
        return postRepo.findByAuthorIdOrderByCreatedAtDesc(authorId,
                PageRequest.of(page, size)).map(PostResponse::from);
    }

    public PostResponse get(String id, User requester) {
        Post post = postRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Post not found"));
        PostResponse response = PostResponse.from(post);
        if (requester == null || !post.getAuthor().getId().equals(requester.getId())) {
            return response.withoutNotes();
        }
        return response;
    }

    @Transactional
    public PostResponse create(PostRequest req, User author) {
        validateRequest(req);
        Post post = new Post();
        post.setAuthor(author);
        post.setTitle(req.title() != null ? req.title() : "");
        post.setBody(req.body() != null ? req.body() : "");
        post.setNotes(req.notes() != null ? req.notes() : "");
        post.setStatus(normalizeStatus(req.status()));
        return PostResponse.from(postRepo.save(post));
    }

    @Transactional
    public PostResponse update(String id, PostRequest req, User requester) {
        validateRequest(req);
        Post post = postRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Post not found"));
        if (!post.getAuthor().getId().equals(requester.getId()))
            throw new AccessDeniedException("Not your post");
        post.setTitle(req.title() != null ? req.title() : "");
        post.setBody(req.body() != null ? req.body() : "");
        post.setNotes(req.notes() != null ? req.notes() : "");
        post.setStatus(normalizeStatus(req.status()));
        return PostResponse.from(postRepo.save(post));
    }

    @Transactional
    public void delete(String id, User requester) {
        Post post = postRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Post not found"));
        if (!post.getAuthor().getId().equals(requester.getId()))
            throw new AccessDeniedException("Not your post");
        postRepo.delete(post);
    }

    private void validateRequest(PostRequest req) {
        boolean hasContent = (req.title() != null && !req.title().isBlank())
                || (req.body() != null && !req.body().isBlank())
                || (req.notes() != null && !req.notes().isBlank());
        if (!hasContent)
            throw new IllegalArgumentException("At least one field must have content");
        if ("published".equals(req.status())) {
            if (req.title() == null || req.title().isBlank() || req.body() == null || req.body().isBlank())
                throw new IllegalArgumentException("Title and body are required to publish");
        }
    }

    private String normalizeStatus(String status) {
        return "published".equals(status) ? "published" : "draft";
    }
}
