package ParcelHub.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;

import java.util.Date;
import java.util.function.Function;


@Service
public class JwtService {


    /*
     * IMPORTANT:
     *
     * This secret must be long enough for HS256.
     *
     * We keep it inside the backend.
     */

    private static final String SECRET_KEY =
            "ParcelHubSuperSecretKeyForJwtAuthentication2026SecureKey";


    // =========================================================
    // GET SIGNING KEY
    // =========================================================

    private SecretKey getSignKey() {

        byte[] keyBytes =
                SECRET_KEY.getBytes(
                        java.nio.charset.StandardCharsets.UTF_8
                );

        return Keys.hmacShaKeyFor(
                keyBytes
        );
    }


    // =========================================================
    // GENERATE TOKEN
    // =========================================================

    public String generateToken(
            String email,
            String role
    ) {


        return Jwts.builder()

                .subject(
                        email
                )

                .claim(
                        "role",
                        role
                )

                .issuedAt(
                        new Date()
                )

                .expiration(
                        new Date(
                                System.currentTimeMillis()
                                        +
                                1000L * 60 * 60 * 24
                        )
                )

                .signWith(
                        getSignKey()
                )

                .compact();
    }


    // =========================================================
    // EXTRACT USERNAME
    // =========================================================

    public String extractUsername(
            String token
    ) {

        return extractClaim(
                token,
                Claims::getSubject
        );
    }


    // =========================================================
    // EXTRACT ROLE
    // =========================================================

    public String extractRole(
            String token
    ) {

        return extractAllClaims(
                token
        ).get(
                "role",
                String.class
        );
    }


    // =========================================================
    // EXTRACT CLAIM
    // =========================================================

    public <T> T extractClaim(
            String token,
            Function<Claims, T> claimsResolver
    ) {

        final Claims claims =
                extractAllClaims(
                        token
                );

        return claimsResolver.apply(
                claims
        );
    }


    // =========================================================
    // EXTRACT ALL CLAIMS
    // =========================================================

    private Claims extractAllClaims(
            String token
    ) {

        return Jwts.parser()

                .verifyWith(
                        getSignKey()
                )

                .build()

                .parseSignedClaims(
                        token
                )

                .getPayload();
    }


    // =========================================================
    // VALIDATE TOKEN
    // =========================================================

    public boolean isTokenValid(
            String token,
            String email
    ) {

        try {

            String username =
                    extractUsername(
                            token
                    );

            return username != null
                    &&
                    username.equals(email)
                    &&
                    !isTokenExpired(
                            token
                    );

        } catch (Exception e) {

            return false;
        }
    }


    // =========================================================
    // EXPIRATION
    // =========================================================

    private boolean isTokenExpired(
            String token
    ) {

        Date expiration =
                extractClaim(
                        token,
                        Claims::getExpiration
                );

        return expiration.before(
                new Date()
        );
    }
}