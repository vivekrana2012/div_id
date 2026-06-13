package com.divid.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "link_metadata")
public class LinkMetadata {

    @Id
    @Column(name = "url", nullable = false)
    private String url;

    @Column(name = "title", nullable = false)
    private String title = "";

    @Column(name = "description", nullable = false)
    private String description = "";

    @Column(name = "image_url", nullable = false)
    private String imageUrl = "";

    @Column(name = "site_name", nullable = false)
    private String siteName = "";

    @Column(name = "fetched_at", nullable = false)
    private Instant fetchedAt;

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public String getSiteName() { return siteName; }
    public void setSiteName(String siteName) { this.siteName = siteName; }

    public Instant getFetchedAt() { return fetchedAt; }
    public void setFetchedAt(Instant fetchedAt) { this.fetchedAt = fetchedAt; }
}
