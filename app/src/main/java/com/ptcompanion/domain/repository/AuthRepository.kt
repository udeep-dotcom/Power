package com.ptcompanion.domain.repository

import com.ptcompanion.domain.model.UserRole
import kotlinx.coroutines.flow.Flow

data class Session(
    val uid: String,
    val email: String?,
    val role: UserRole,
)

interface AuthRepository {
    /** Emits the current signed-in session (with resolved role), or null when signed out. */
    val currentSession: Flow<Session?>

    suspend fun signUpTrainer(email: String, password: String, displayName: String): Result<Unit>

    suspend fun signInWithEmail(email: String, password: String): Result<Unit>

    /**
     * Signs in with a Google ID token obtained via Credential Manager. If this uid has
     * neither a trainer nor a client profile yet - i.e. this is a brand-new account -
     * a trainer profile is created automatically, since Google sign-in is the trainer
     * self-serve entry point in this app (clients always join via invite code, never
     * Google sign-in, so there is no ambiguity about which role to create).
     */
    suspend fun continueWithGoogle(idToken: String, fallbackDisplayName: String?): Result<Unit>

    /**
     * Client sign-up: creates the Auth account, then atomically redeems [inviteCode] to
     * bind the new user to a trainer. Fails if the code is invalid, expired, or already used.
     */
    suspend fun signUpClient(
        email: String,
        password: String,
        displayName: String,
        inviteCode: String,
    ): Result<Unit>

    suspend fun signOut()
}
