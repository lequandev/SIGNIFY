package com.signify.modules.auth.util;

import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Date;

@Component
@Slf4j
public class JwtUtil {

    @Value("${jwt.secret-key}")
    private String secretKey;

    @Value("${jwt.expiration-time}")
    private long expirationTime;

    public String generateToken(String id) {
        try {
            JWSSigner signer = new MACSigner(secretKey.getBytes());

            JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                    .subject(id)
                    .claim("id", id) // Include id claim as old Node backend did
                    .issueTime(new Date())
                    .expirationTime(new Date(new Date().getTime() + expirationTime * 1000))
                    .build();

            SignedJWT signedJWT = new SignedJWT(
                    new JWSHeader(JWSAlgorithm.HS256),
                    claimsSet);

            signedJWT.sign(signer);

            return signedJWT.serialize();
        } catch (JOSEException e) {
            log.error("Error generating JWT token", e);
            throw new RuntimeException("Error generating JWT token", e);
        }
    }
}
