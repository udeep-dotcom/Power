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

    suspend fun signInWithGoogleIdToken(idToken: String): Result<Unit>

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
