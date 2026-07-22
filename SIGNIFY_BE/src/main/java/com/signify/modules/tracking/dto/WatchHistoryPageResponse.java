package com.signify.modules.tracking.dto;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class WatchHistoryPageResponse {
    List<WatchHistoryResponse> content;
    int page;
    int size;
    long totalElements;
    int totalPages;
}
