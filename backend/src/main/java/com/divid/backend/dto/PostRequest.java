package com.divid.backend.dto;

import jakarta.validation.constraints.Size;

public record PostRequest(
    @Size(max = 500) String title,
    String body,
    String notes,
    String status
) {}
