package com.divid.backend.service;

import com.divid.backend.dto.LinkPreviewResponse;
import com.divid.backend.model.LinkMetadata;
import com.divid.backend.repository.LinkMetadataRepository;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.stereotype.Service;

import java.net.InetAddress;
import java.net.URI;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class LinkPreviewService {

    private static final Duration STALE_THRESHOLD = Duration.ofDays(7);
    private static final int TIMEOUT_MS = 5000;
    private static final int MAX_BODY_BYTES = 1_048_576; // 1MB

    private final LinkMetadataRepository repo;

    public LinkPreviewService(LinkMetadataRepository repo) {
        this.repo = repo;
    }

    public LinkPreviewResponse fetchPreview(String url) {
        validateUrl(url);

        // Check cache
        LinkMetadata cached = repo.findById(url).orElse(null);
        if (cached != null && !isStale(cached)) {
            return LinkPreviewResponse.from(cached);
        }

        // Fetch and parse
        LinkMetadata metadata = fetchMetadata(url);
        return LinkPreviewResponse.from(repo.save(metadata));
    }

    public List<LinkPreviewResponse> fetchPreviews(List<String> urls) {
        // Deduplicate and validate
        List<String> validUrls = urls.stream()
                .distinct()
                .filter(this::isValidUrl)
                .limit(10) // Cap at 10 URLs per batch
                .toList();

        // Check cache for all
        Map<String, LinkMetadata> cached = repo.findByUrlIn(validUrls).stream()
                .collect(Collectors.toMap(LinkMetadata::getUrl, Function.identity()));

        return validUrls.stream().map(url -> {
            LinkMetadata meta = cached.get(url);
            if (meta != null && !isStale(meta)) {
                return LinkPreviewResponse.from(meta);
            }
            try {
                LinkMetadata fetched = fetchMetadata(url);
                return LinkPreviewResponse.from(repo.save(fetched));
            } catch (Exception e) {
                // Return empty preview on failure
                return new LinkPreviewResponse(url, "", "", "", "");
            }
        }).toList();
    }

    private LinkMetadata fetchMetadata(String url) {
        try {
            Document doc = Jsoup.connect(url)
                    .userAgent("DividBot/1.0 (+https://divid.app)")
                    .timeout(TIMEOUT_MS)
                    .maxBodySize(MAX_BODY_BYTES)
                    .followRedirects(true)
                    .get();

            String title = getMetaContent(doc, "og:title");
            if (title.isEmpty()) {
                Element titleEl = doc.selectFirst("title");
                title = titleEl != null ? titleEl.text() : "";
            }

            String description = getMetaContent(doc, "og:description");
            if (description.isEmpty()) {
                Element metaDesc = doc.selectFirst("meta[name=description]");
                description = metaDesc != null ? metaDesc.attr("content") : "";
            }

            String imageUrl = getMetaContent(doc, "og:image");
            String siteName = getMetaContent(doc, "og:site_name");
            if (siteName.isEmpty()) {
                // Fallback: extract domain name
                try {
                    siteName = URI.create(url).getHost();
                } catch (Exception ignored) {}
            }

            LinkMetadata metadata = new LinkMetadata();
            metadata.setUrl(url);
            metadata.setTitle(truncate(title, 500));
            metadata.setDescription(truncate(description, 1000));
            metadata.setImageUrl(truncate(imageUrl, 2000));
            metadata.setSiteName(truncate(siteName, 200));
            metadata.setFetchedAt(Instant.now());
            return metadata;
        } catch (Exception e) {
            // Return minimal metadata on fetch failure
            LinkMetadata metadata = new LinkMetadata();
            metadata.setUrl(url);
            metadata.setTitle("");
            metadata.setDescription("");
            metadata.setImageUrl("");
            try {
                metadata.setSiteName(URI.create(url).getHost());
            } catch (Exception ignored) {
                metadata.setSiteName("");
            }
            metadata.setFetchedAt(Instant.now());
            return metadata;
        }
    }

    private String getMetaContent(Document doc, String property) {
        Element el = doc.selectFirst("meta[property=" + property + "]");
        if (el == null) {
            el = doc.selectFirst("meta[name=" + property + "]");
        }
        return el != null ? el.attr("content").trim() : "";
    }

    private boolean isStale(LinkMetadata metadata) {
        return metadata.getFetchedAt() == null ||
                Duration.between(metadata.getFetchedAt(), Instant.now()).compareTo(STALE_THRESHOLD) > 0;
    }

    private void validateUrl(String url) {
        if (!isValidUrl(url)) {
            throw new IllegalArgumentException("Invalid or disallowed URL");
        }
        // SSRF protection: resolve host and reject private IPs
        try {
            String host = URI.create(url).getHost();
            if (host == null) throw new IllegalArgumentException("Invalid URL: no host");
            InetAddress addr = InetAddress.getByName(host);
            if (addr.isLoopbackAddress() || addr.isSiteLocalAddress() ||
                    addr.isLinkLocalAddress() || addr.isAnyLocalAddress()) {
                throw new IllegalArgumentException("URLs pointing to private/internal addresses are not allowed");
            }
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalArgumentException("Cannot resolve URL host");
        }
    }

    private boolean isValidUrl(String url) {
        if (url == null || url.isBlank()) return false;
        try {
            URI uri = URI.create(url);
            String scheme = uri.getScheme();
            return ("http".equals(scheme) || "https".equals(scheme)) && uri.getHost() != null;
        } catch (Exception e) {
            return false;
        }
    }

    private String truncate(String s, int maxLength) {
        if (s == null) return "";
        return s.length() > maxLength ? s.substring(0, maxLength) : s;
    }
}
