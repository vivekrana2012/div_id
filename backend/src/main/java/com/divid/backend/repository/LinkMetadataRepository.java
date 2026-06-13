package com.divid.backend.repository;

import com.divid.backend.model.LinkMetadata;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LinkMetadataRepository extends JpaRepository<LinkMetadata, String> {
    List<LinkMetadata> findByUrlIn(List<String> urls);
}
