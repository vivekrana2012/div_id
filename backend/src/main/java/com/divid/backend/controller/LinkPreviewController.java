package com.divid.backend.controller;

import com.divid.backend.dto.LinkPreviewResponse;
import com.divid.backend.service.LinkPreviewService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/link-preview")
public class LinkPreviewController {

    private final LinkPreviewService service;

    public LinkPreviewController(LinkPreviewService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<LinkPreviewResponse> preview(@RequestBody Map<String, String> body) {
        String url = body.get("url");
        if (url == null || url.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        try {
            return ResponseEntity.ok(service.fetchPreview(url));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/batch")
    public ResponseEntity<List<LinkPreviewResponse>> batchPreview(@RequestBody Map<String, List<String>> body) {
        List<String> urls = body.get("urls");
        if (urls == null || urls.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(service.fetchPreviews(urls));
    }
}
