package com.signify.modules.school.exception;

import lombok.Getter;

@Getter
public class SchoolConflictException extends RuntimeException {
    private final String code;

    public SchoolConflictException(String code, String message) {
        super(message);
        this.code = code;
    }
}
