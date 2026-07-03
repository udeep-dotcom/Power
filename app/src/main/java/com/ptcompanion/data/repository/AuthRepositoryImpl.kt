package com.ptcompanion.data.repository

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.GoogleAuthProvider
import com.google.firebase.firestore.FirebaseFirestore
import com.ptcompanion.data.remote.FirestoreSchema
import com.ptcompanion.data.remote.dto.ClientProfileDto
import com.ptcompanion.data.remote.dto.InviteCodeDto
import com.ptcompanion.data.remote.dto.TrainerDto
import com.ptcompanion.domain.model.UserRole
import com.ptcompanion.domain.repository.AuthRepository
import com.ptcompanion.domain.repository.Session
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.tasks.await
import java.time.Instant
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepositoryImpl @Inject constructor(
    private val auth: FirebaseAuth,
    private val firestore: FirebaseFirestore,
) : AuthRepository {

    private val authStateFlow: Flow<String?> = callbackFlow {
        val listener = FirebaseAuth.AuthStateListener { trySend(it.currentUser?.uid) }
        auth.addAuthStateListener(listener)
        awaitClose { auth.removeAuthStateListener(listener) }
    }.distinctUntilChanged()

    override val currentSession: Flow<Session?> = authStateFlow.flatMapLatest { uid ->
        callbackFlow {
            if (uid == null) {
                trySend(null)
                awaitClose { }
            } else {
                val role = resolveRole(uid)
                trySend(if (role == null) null else Session(uid, auth.currentUser?.email, role))
                awaitClose { }
            }
        }
    }

    private suspend fun resolveRole(uid: String): UserRole? {
        val trainerDoc = firestore.collection(FirestoreSchema.TRAINERS).document(uid).get().await()
        if (trainerDoc.exists()) return UserRole.TRAINER
        val clientDoc = firestore.collection(FirestoreSchema.CLIENTS).document(uid).get().await()
        if (clientDoc.exists()) return UserRole.CLIENT
        return null
    }

    override suspend fun signUpTrainer(email: String, password: String, displayName: String): Result<Unit> =
        runCatching {
            val result = auth.createUserWithEmailAndPassword(email, password).await()
            val uid = result.user?.uid ?: error("Sign-up did not return a user")
            val dto = TrainerDto(
                trainerId = uid,
                displayName = displayName,
                email = email,
                plan = "free",
                createdAt = Instant.now().toString(),
            )
            firestore.collection(FirestoreSchema.TRAINERS).document(uid).set(dto).await()
        }

    override suspend fun signInWithEmail(email: String, password: String): Result<Unit> = runCatching {
        auth.signInWithEmailAndPassword(email, password).await()
        Unit
    }

    override suspend fun signInWithGoogleIdToken(idToken: String): Result<Unit> = runCatching {
        val credential = GoogleAuthProvider.getCredential(idToken, null)
        auth.signInWithCredential(credential).await()
        Unit
    }

    override suspend fun signUpClient(
        email: String,
        password: String,
        displayName: String,
        inviteCode: String,
    ): Result<Unit> = runCatching {
        val inviteRef = firestore.collection(FirestoreSchema.INVITE_CODES).document(inviteCode)
        val inviteSnap = inviteRef.get().await()
        if (!inviteSnap.exists()) error("Invite code not found")
        val invite = inviteSnap.toObject(InviteCodeDto::class.java) ?: error("Invalid invite code")
        if (invite.used) error("Invite code has already been used")

        val result = auth.createUserWithEmailAndPassword(email, password).await()
        val uid = result.user?.uid ?: error("Sign-up did not return a user")

        val clientDto = ClientProfileDto(
            clientUserId = uid,
            trainerId = invite.trainerId,
            displayName = displayName,
            email = email,
            joinedAt = Instant.now().toString(),
            activeProgramId = null,
            redeemedInviteCode = inviteCode,
        )

        val batch = firestore.batch()
        batch.set(firestore.collection(FirestoreSchema.CLIENTS).document(uid), clientDto)
        batch.update(
            inviteRef,
            mapOf(
                "used" to true,
                "usedByClientUserId" to uid,
                "usedAt" to Instant.now().toString(),
            ),
        )
        try {
            batch.commit().await()
        } catch (e: Exception) {
            // Roll back the just-created auth account so the user isn't left in a stuck
            // "account exists but not bound to a trainer" state (e.g. code raced/got used
            // between the check above and the commit).
            result.user?.delete()?.await()
            throw e
        }
    }

    override suspend fun signOut() {
        auth.signOut()
    }
}
