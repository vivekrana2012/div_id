package com.divid.backend.controller;

import com.divid.backend.dto.PostRequest;
import com.divid.backend.dto.PostResponse;
import com.divid.backend.model.User;
import com.divid.backend.service.PostService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/articles")
public class PostController {
    private final PostService postService;

    public PostController(PostService postService) {
        this.postService = postService;
    }

    @GetMapping
    public Page<PostResponse> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return postService.listPublished(page, Math.min(size, 50));
    }

    @GetMapping("/mine")
    public Page<PostResponse> mine(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return postService.listByAuthor(user.getId(), page, Math.min(size, 50));
    }

    @GetMapping("/{id}")
    public PostResponse get(@PathVariable String id, @AuthenticationPrincipal User user) {
        return postService.get(id, user);
    }

    @PostMapping
    public ResponseEntity<PostResponse> create(
            @Valid @RequestBody PostRequest req,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.status(201).body(postService.create(req, user));
    }

    @PutMapping("/{id}")
    public PostResponse update(
            @PathVariable String id,
            @Valid @RequestBody PostRequest req,
            @AuthenticationPrincipal User user) {
        return postService.update(id, req, user);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable String id,
            @AuthenticationPrincipal User user) {
        postService.delete(id, user);
        return ResponseEntity.noContent().build();
    }
}
