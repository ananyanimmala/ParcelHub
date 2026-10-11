package ParcelHub.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import org.springframework.stereotype.Component;

import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;


    // =========================================================
    // CONSTRUCTOR
    // =========================================================

    public JwtAuthenticationFilter(
            JwtService jwtService
    ) {

        this.jwtService = jwtService;
    }

@Override
protected boolean shouldNotFilter(HttpServletRequest request) {
    return request.getRequestURI().startsWith("/api/route/");
}
    // =========================================================
    // JWT FILTER
    // =========================================================

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {


        // =====================================================
        // GET AUTHORIZATION HEADER
        // =====================================================

        String authHeader =
                request.getHeader("Authorization");


        // =====================================================
        // NO TOKEN
        // =====================================================

        if (
                authHeader == null
                        ||
                !authHeader.startsWith("Bearer ")
        ) {

            filterChain.doFilter(
                    request,
                    response
            );

            return;
        }


        // =====================================================
        // EXTRACT TOKEN
        // =====================================================

        String token =
                authHeader.substring(7);


        try {


            // =================================================
            // EXTRACT EMAIL
            // =================================================

            String email =
                    jwtService.extractUsername(
                            token
                    );


            // =================================================
            // EXTRACT ROLE
            // =================================================

            String role =
                    jwtService.extractRole(
                            token
                    );


            System.out.println(
                    "JWT EMAIL: " + email
            );

            System.out.println(
                    "JWT ROLE: " + role
            );


            // =================================================
            // CHECK VALUES
            // =================================================

            if (
                    email != null
                            &&
                    role != null
                            &&
                    SecurityContextHolder
                            .getContext()
                            .getAuthentication()
                            == null
            ) {


                // =============================================
                // NORMALIZE ROLE
                // =============================================

                String normalizedRole =
                        role.trim().toUpperCase();


                /*
                 * If the token contains:
                 *
                 * CUSTOMER
                 *
                 * we create:
                 *
                 * ROLE_CUSTOMER
                 *
                 *
                 * If it already contains:
                 *
                 * ROLE_CUSTOMER
                 *
                 * we avoid:
                 *
                 * ROLE_ROLE_CUSTOMER
                 */

                if (
                        normalizedRole.startsWith(
                                "ROLE_"
                        )
                ) {

                    normalizedRole =
                            normalizedRole.substring(5);
                }


                // =============================================
                // CREATE AUTHORITY
                // =============================================

                SimpleGrantedAuthority authority =
                        new SimpleGrantedAuthority(
                                "ROLE_" +
                                normalizedRole
                        );


                System.out.println(
                        "SPRING AUTHORITY: "
                                +
                        authority.getAuthority()
                );


                // =============================================
                // CREATE AUTHENTICATION
                // =============================================

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(

                                email,

                                null,

                                List.of(authority)

                        );


                // =============================================
                // SAVE AUTHENTICATION
                // =============================================

                SecurityContextHolder
                        .getContext()
                        .setAuthentication(
                                authentication
                        );
            }


        } catch (Exception e) {

            System.out.println(
                    "JWT ERROR: "
                            +
                    e.getMessage()
            );

            SecurityContextHolder
                    .clearContext();
        }


        // =====================================================
        // CONTINUE REQUEST
        // =====================================================

        filterChain.doFilter(
                request,
                response
        );
    }
}