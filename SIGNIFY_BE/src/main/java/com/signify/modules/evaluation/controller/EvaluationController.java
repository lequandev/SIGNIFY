package com.signify.modules.evaluation.controller;

import com.signify.modules.evaluation.model.Evaluation;
import com.signify.modules.evaluation.service.EvaluationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/evaluations")
@RequiredArgsConstructor
public class EvaluationController {

    private final EvaluationService evaluationService;

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> request, Authentication authentication) {
        try {
            String classId = stringValue(request.get("classId"));
            String studentId = stringValue(request.get("studentId"));
            Double score = request.get("score") == null ? null : Double.valueOf(request.get("score").toString());
            Evaluation evaluation = evaluationService.create(authentication.getName(), classId, studentId, score,
                    stringValue(request.get("comment")));
            return ResponseEntity.ok(evaluation);
        } catch (RuntimeException e) {
            return handle(e);
        }
    }

    @GetMapping("/class/{classId}")
    public ResponseEntity<?> getByClass(@PathVariable String classId, Authentication authentication) {
        try {
            List<Evaluation> evaluations = evaluationService.getByClass(authentication.getName(), classId);
            return ResponseEntity.ok(evaluations);
        } catch (RuntimeException e) {
            return handle(e);
        }
    }

    private ResponseEntity<?> handle(RuntimeException e) {
        int status = SchoolError.isForbidden(e) ? 403 : SchoolError.isNotFound(e) ? 404 : 400;
        return ResponseEntity.status(status).body(Map.of("message", e.getMessage() == null ? "Bad request" : e.getMessage()));
    }

    private static String stringValue(Object value) {
        return value == null ? null : value.toString();
    }

    private static final class SchoolError {
        static boolean isForbidden(RuntimeException e) { return SchoolServiceMessage.FORBIDDEN.equals(e.getMessage()); }
        static boolean isNotFound(RuntimeException e) { return SchoolServiceMessage.NOT_FOUND.equals(e.getMessage()); }
    }

    private static final class SchoolServiceMessage {
        static final String FORBIDDEN = "SCHOOL_FORBIDDEN";
        static final String NOT_FOUND = "SCHOOL_NOT_FOUND";
    }
}
