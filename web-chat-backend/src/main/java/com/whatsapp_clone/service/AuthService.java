package com.whatsapp_clone.service;

import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.whatsapp_clone.dto.request.*;
import com.whatsapp_clone.dto.response.AuthenticationResponse;
import com.whatsapp_clone.dto.response.IntrospectResponse;
import com.whatsapp_clone.dto.response.UserResponse;
import com.whatsapp_clone.exception.AppException;
import com.whatsapp_clone.exception.ErrorCode;
import com.whatsapp_clone.model.InvalidToken;
import com.whatsapp_clone.model.User;
import com.whatsapp_clone.repository.InvalidTokenRepository;
import com.whatsapp_clone.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.text.ParseException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthService {
    UserRepository userRepository;
    RedisTokenService redisTokenService;
    PasswordEncoder passwordEncoder;

    @NonFinal
    @Value("${jwt.signerKey}")
    String SIGNER_KEY;

    @NonFinal
    @Value("${jwt.valid-duration}")
    long VALID_DURATION;

    @NonFinal
    @Value("${jwt.refreshable-duration}")
    long REFRESH_DURATION;

    // ==================== INTROSPECT ====================
    public IntrospectResponse introspect(IntrospectRequest request) {
        try {
            verifyToken(request.getToken(), "access");
            return IntrospectResponse.builder().valid(true).build();
        } catch (Exception e) {
            return IntrospectResponse.builder().valid(false).build();
        }
    }

    // ==================== VERIFY TOKEN ====================
    public SignedJWT verifyToken(String token, String expectedType) {
        try {
            SignedJWT jwt = SignedJWT.parse(token);

            JWSVerifier verifier = new MACVerifier(SIGNER_KEY.getBytes());
            if (!jwt.verify(verifier)) {
                throw new AppException(ErrorCode.UNAUTHENTICATED);
            }

            Date exp = jwt.getJWTClaimsSet().getExpirationTime();
            if (exp == null || exp.before(new Date())) {
                throw new AppException(ErrorCode.UNAUTHENTICATED);
            }

            String type = jwt.getJWTClaimsSet().getStringClaim("type");
            if (!expectedType.equals(type)) {
                throw new AppException(ErrorCode.UNAUTHENTICATED);
            }

            if ("access".equals(type)) {
                String jti = jwt.getJWTClaimsSet().getJWTID();
                if (redisTokenService.isAccessTokenBlacklisted(jti)) {
                    throw new AppException(ErrorCode.UNAUTHENTICATED);
                }
            }

            return jwt;

        } catch (Exception e) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
    }

    // ==================== GENERATE TOKEN ====================
    private String generateAccessToken(User user) {
        try {
            JWTClaimsSet claims = new JWTClaimsSet.Builder()
                    .subject(user.getEmail())
                    .issuer("whatsapp.com")
                    .issueTime(new Date())
                    .expirationTime(
                            Date.from(Instant.now().plus(VALID_DURATION, ChronoUnit.SECONDS))
                    )
                    .jwtID(UUID.randomUUID().toString())
                    .claim("user_id", user.getId())
                    .claim("type", "access")
                    .build();

            SignedJWT signedJWT = new SignedJWT(
                    new JWSHeader(JWSAlgorithm.HS512),
                    claims
            );

            signedJWT.sign(new MACSigner(SIGNER_KEY.getBytes()));
            return signedJWT.serialize();

        } catch (JOSEException e) {
            throw new RuntimeException(e);
        }
    }

    private String generateRefreshToken(User user) {
        try {
            JWTClaimsSet claims = new JWTClaimsSet.Builder()
                    .subject(user.getEmail())
                    .issuer("whatsapp.com")
                    .issueTime(new Date())
                    .expirationTime(
                            Date.from(Instant.now().plus(REFRESH_DURATION, ChronoUnit.SECONDS))
                    )
                    .jwtID(UUID.randomUUID().toString())
                    .claim("user_id", user.getId())
                    .claim("type", "refresh")
                    .build();

            SignedJWT signedJWT = new SignedJWT(
                    new JWSHeader(JWSAlgorithm.HS512),
                    claims
            );

            signedJWT.sign(new MACSigner(SIGNER_KEY.getBytes()));
            return signedJWT.serialize();

        } catch (JOSEException e) {
            throw new RuntimeException(e);
        }
    }

    // ==================== LOGIN ====================
    public AuthenticationResponse authenticationResponse(AuthenticationRequest request) {

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        String accessToken = generateAccessToken(user);
        String refreshToken = generateRefreshToken(user);

        SignedJWT refreshJwt;
        try {
            refreshJwt = SignedJWT.parse(refreshToken);
        } catch (ParseException e) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        try {
            redisTokenService.storeRefreshToken(
                    user.getId(),
                    refreshJwt.getJWTClaimsSet().getJWTID(),
                    REFRESH_DURATION
            );
        } catch (ParseException e) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        return AuthenticationResponse.builder()
                .authenticated(true)
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .build();
    }

    // ==================== REGISTER ====================
    public UserResponse register(RegisterRequest request) {

        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new AppException(ErrorCode.PASSWORD_NOT_MATCH);
        }

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new AppException(ErrorCode.EMAIL_EXISTED);
        }

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .password(passwordEncoder.encode(request.getPassword()))
                .profilePicture(null)
                .build();

        userRepository.save(user);

        return UserResponse.builder()
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .profilePicture(user.getProfilePicture())
                .build();
    }

    // ==================== LOGOUT ====================
    public void logout(LogoutRequest request) throws Exception {

        SignedJWT jwt = verifyToken(request.getAccessToken(), "access");
        String jti = jwt.getJWTClaimsSet().getJWTID();

        long ttl = jwt.getJWTClaimsSet()
                .getExpirationTime()
                .toInstant()
                .getEpochSecond()
                - Instant.now().getEpochSecond();

        redisTokenService.blacklistAccessToken(jti, ttl);

        String userId = jwt.getJWTClaimsSet().getClaim("user_id").toString();
        redisTokenService.revokeUserRefreshToken(userId);
    }


    // ==================== REFRESH ====================
    public AuthenticationResponse refreshToken(RefreshRequest request)
            throws Exception {

        SignedJWT refreshJwt = verifyToken(request.getRefreshToken(), "refresh");
        String jti = refreshJwt.getJWTClaimsSet().getJWTID();

        String userId = redisTokenService.getUserIdByRefreshToken(jti);
        if (userId == null) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));

        redisTokenService.revokeRefreshToken(jti);

        String newAccessToken = generateAccessToken(user);
        String newRefreshToken = generateRefreshToken(user);

        SignedJWT newRefreshJwt = SignedJWT.parse(newRefreshToken);
        redisTokenService.storeRefreshToken(
                userId,
                newRefreshJwt.getJWTClaimsSet().getJWTID(),
                REFRESH_DURATION
        );

        return AuthenticationResponse.builder()
                .authenticated(true)
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .build();
    }
}