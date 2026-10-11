package ParcelHub.config;

import ParcelHub.security.JwtAuthenticationFilter;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.http.HttpMethod;

import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;

import org.springframework.security.config.http.SessionCreationPolicy;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;


@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;


    // =========================================================
    // CONSTRUCTOR
    // =========================================================

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter
    ) {

        this.jwtAuthenticationFilter =
                jwtAuthenticationFilter;
    }


    // =========================================================
    // PASSWORD ENCODER
    // =========================================================

    @Bean
    public PasswordEncoder passwordEncoder() {

        return new BCryptPasswordEncoder();
    }


    // =========================================================
    // SECURITY FILTER CHAIN
    // =========================================================

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http
    ) throws Exception {


        http

                // =================================================
                // CORS
                // =================================================

                .cors(
                        Customizer.withDefaults()
                )


                // =================================================
                // CSRF
                // =================================================

                .csrf(
                        csrf -> csrf.disable()
                )


                // =================================================
                // SESSION
                // =================================================

                .sessionManagement(
                        session ->
                                session.sessionCreationPolicy(
                                        SessionCreationPolicy.STATELESS
                                )
                )


                // =================================================
                // AUTHORIZATION
                // =================================================

                .authorizeHttpRequests(
                        auth -> auth


                                // =================================
                                // CORS PREFLIGHT
                                // =================================

                                .requestMatchers(
                                        HttpMethod.OPTIONS,
                                        "/**"
                                )
                                .permitAll()


                                // =================================
                                // LOGIN / REGISTER
                                // =================================

                                .requestMatchers(
                                        "/api/auth/**"
                                )
                                .permitAll()


                                // =================================
                                // ROUTE ESTIMATION
                                // =================================
                                /*
                                 *
                                 * Route estimation does not expose
                                 * private parcel information.
                                 *
                                 * It only calculates:
                                 *
                                 * Address
                                 *     ↓
                                 * Coordinates
                                 *     ↓
                                 * Road distance
                                 *     ↓
                                 * ETA
                                 *     ↓
                                 * Estimated charge
                                 *
                                 */

                                .requestMatchers(
                                        "/api/route/**"
                                )
                                .permitAll()


                                // =================================
                                // EVERYTHING ELSE
                                // =================================
                                /*
                                 *
                                 * Parcels
                                 * Tracking
                                 * Admin
                                 * Agent
                                 * User data
                                 *
                                 * all require authentication.
                                 *
                                 */

                                .anyRequest()
                                .authenticated()
                )


                // =================================================
                // JWT FILTER
                // =================================================

                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );


        return http.build();
    }
}