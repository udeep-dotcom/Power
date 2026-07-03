package com.ptcompanion.data.repository

import com.google.firebase.firestore.FirebaseFirestore
import com.ptcompanion.data.remote.FirestoreSchema
import com.ptcompanion.data.remote.dto.ClientProfileDto
import com.ptcompanion.data.remote.dto.InviteCodeDto
import com.ptcompanion.data.remote.dto.TrainerDto
import com.ptcompanion.data.remote.observeAsFlow
import com.ptcompanion.domain.model.ClientProfile
import com.ptcompanion.domain.model.InviteCode
import com.ptcompanion.domain.model.Trainer
import com.ptcompanion.domain.repository.TrainerRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.tasks.await
import java.time.Instant
import javax.inject.Inject
import javax.inject.Singleton
import kotlin.random.Random

@Singleton
class TrainerRepositoryImpl @Inject constructor(
    private val firestore: FirebaseFirestore,
) : TrainerRepository {

    override fun observeTrainer(trainerId: String): Flow<Trainer?> =
        firestore.collection(FirestoreSchema.TRAINERS).document(trainerId).observeAsFlow()
            .map { it?.toObject(TrainerDto::class.java)?.toDomain() }

    override fun observeRoster(trainerId: String): Flow<List<ClientProfile>> =
        firestore.collection(FirestoreSchema.CLIENTS)
            .whereEqualTo(FirestoreSchema.FIELD_TRAINER_ID, trainerId)
            .observeAsFlow()
            .map { snap -> snap.documents.mapNotNull { it.toObject(ClientProfileDto::class.java)?.toDomain() } }

    override fun observeClient(trainerId: String, clientUserId: String): Flow<ClientProfile?> =
        firestore.collection(FirestoreSchema.CLIENTS).document(clientUserId).observeAsFlow()
            .map { snap ->
                val dto = snap?.toObject(ClientProfileDto::class.java) ?: return@map null
                if (dto.trainerId != trainerId) null else dto.toDomain()
            }

    override fun observeSelf(clientUserId: String): Flow<ClientProfile?> =
        firestore.collection(FirestoreSchema.CLIENTS).document(clientUserId).observeAsFlow()
            .map { it?.toObject(ClientProfileDto::class.java)?.toDomain() }

    override suspend fun generateInviteCode(trainerId: String, clientDisplayName: String?): Result<InviteCode> =
        runCatching {
            val code = generateShortCode()
            val invite = InviteCode(
                code = code,
                trainerId = trainerId,
                clientDisplayName = clientDisplayName,
                createdAt = Instant.now(),
            )
            firestore.collection(FirestoreSchema.INVITE_CODES).document(code).set(invite.toDto()).await()
            invite
        }

    override fun observeInviteCodes(trainerId: String): Flow<List<InviteCode>> =
        firestore.collection(FirestoreSchema.INVITE_CODES)
            .whereEqualTo(FirestoreSchema.FIELD_TRAINER_ID, trainerId)
            .observeAsFlow()
            .map { snap -> snap.documents.mapNotNull { it.toObject(InviteCodeDto::class.java)?.toDomain() } }

    private fun generateShortCode(): String {
        val alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // no 0/O/1/I to avoid confusion
        return (1..6).map { alphabet[Random.nextInt(alphabet.length)] }.joinToString("")
    }
}
