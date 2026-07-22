package com.signify.modules.assignment.util;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.regex.Pattern;

public final class YoutubeVideoIdExtractor {

    private static final Pattern VIDEO_ID = Pattern.compile("^[A-Za-z0-9_-]{11}$");

    private YoutubeVideoIdExtractor() {
    }

    public static String extract(String input) {
        String value = input == null ? "" : input.trim();
        if (VIDEO_ID.matcher(value).matches()) {
            return value;
        }

        try {
            URI uri = URI.create(value);
            String host = uri.getHost() == null ? "" : uri.getHost().toLowerCase();
            String path = uri.getPath() == null ? "" : uri.getPath();
            String candidate = null;

            if (host.equals("youtu.be") || host.endsWith(".youtu.be")) {
                candidate = firstPathSegment(path);
            } else if (host.equals("youtube.com") || host.endsWith(".youtube.com")) {
                if (path.equals("/watch")) {
                    candidate = queryParam(uri.getRawQuery(), "v");
                } else if (path.startsWith("/embed/") || path.startsWith("/shorts/")) {
                    candidate = firstPathSegment(path.substring(path.indexOf('/', 1)));
                }
            }

            if (candidate != null && VIDEO_ID.matcher(candidate).matches()) {
                return candidate;
            }
        } catch (IllegalArgumentException ignored) {
            // Converted to the API's validation error below.
        }

        throw new IllegalArgumentException("Invalid YouTube URL or video ID");
    }

    private static String firstPathSegment(String path) {
        String normalized = path.startsWith("/") ? path.substring(1) : path;
        int slash = normalized.indexOf('/');
        return slash >= 0 ? normalized.substring(0, slash) : normalized;
    }

    private static String queryParam(String query, String name) {
        if (query == null) return null;
        for (String pair : query.split("&")) {
            String[] parts = pair.split("=", 2);
            if (parts.length == 2 && name.equals(URLDecoder.decode(parts[0], StandardCharsets.UTF_8))) {
                return URLDecoder.decode(parts[1], StandardCharsets.UTF_8);
            }
        }
        return null;
    }
}
