package com.ptcompanion.data.repository

import com.google.firebase.firestore.FirebaseFirestore
import com.ptcompanion.data.local.dao.ExerciseLibraryDao
import com.ptcompanion.data.remote.FirestoreSchema
import com.ptcompanion.data.remote.dto.ClientProfileDto
import com.ptcompanion.data.remote.dto.ProgramDto
import com.ptcompanion.data.remote.observeAsFlow
import com.ptcompanion.domain.model.ExerciseLibraryItem
import com.ptcompanion.domain.model.Program
import com.ptcompanion.domain.repository.ProgramRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.tasks.await
import java.time.Instant
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ProgramRepositoryImpl @Inject constructor(
    private val firestore: FirebaseFirestore,
    private val exerciseLibraryDao: ExerciseLibraryDao,
) : ProgramRepository {

    override fun observeTemplates(trainerId: String): Flow<List<Program>> =
        firestore.collection(FirestoreSchema.PROGRAMS)
            .whereEqualTo(FirestoreSchema.FIELD_TRAINER_ID, trainerId)
            .whereEqualTo(FirestoreSchema.FIELD_IS_TEMPLATE, true)
            .observeAsFlow()
            .map { snap -> snap.documents.mapNotNull { it.toObject(ProgramDto::class.java)?.toDomain() } }

    override fun observeClientProgram(trainerId: String, clientUserId: String, programId: String): Flow<Program?> =
        firestore.collection(FirestoreSchema.PROGRAMS).document(programId).observeAsFlow()
            .map { snap ->
                val dto = snap?.toObject(ProgramDto::class.java) ?: return@map null
                if (dto.trainerId != trainerId || dto.clientUserId != clientUserId) null else dto.toDomain()
            }

    override fun observeActiveProgramForClient(trainerId: String, clientUserId: String): Flow<Program?> =
        firestore.collection(FirestoreSchema.CLIENTS).document(clientUserId).observeAsFlow()
            .flatMapLatest { snap ->
                val activeProgramId = snap?.toObject(ClientProfileDto::class.java)?.activeProgramId
                if (activeProgramId == null) {
                    flowOf(null)
                } else {
                    observeClientProgram(trainerId, clientUserId, activeProgramId)
                }
            }

    override suspend fun getProgramById(programId: String): Program? {
        val snap = firestore.collection(FirestoreSchema.PROGRAMS).document(programId).get().await()
        return snap.toObject(ProgramDto::class.java)?.toDomain()
    }

    override suspend fun saveTemplate(program: Program): Result<String> = runCatching {
        val id = program.programId.ifBlank { UUID.randomUUID().toString() }
        val toSave = program.copy(programId = id, isTemplate = true, updatedAt = Instant.now())
        firestore.collection(FirestoreSchema.PROGRAMS).document(id).set(toSave.toDto()).await()
        id
    }

    override suspend fun assignTemplateToClient(
        trainerId: String,
        templateId: String,
        clientUserId: String,
    ): Result<String> = runCatching {
        val templateSnap = firestore.collection(FirestoreSchema.PROGRAMS).document(templateId).get().await()
        val template = templateSnap.toObject(ProgramDto::class.java)?.toDomain()
            ?: error("Template $templateId not found")
        check(template.trainerId == trainerId) { "Template does not belong to this trainer" }

        val newId = UUID.randomUUID().toString()
        val assigned = template.copy(
            programId = newId,
            isTemplate = false,
            clientUserId = clientUserId,
            clonedFromTemplateId = templateId,
            createdAt = Instant.now(),
            updatedAt = Instant.now(),
        )

        val batch = firestore.batch()
        batch.set(firestore.collection(FirestoreSchema.PROGRAMS).document(newId), assigned.toDto())
        batch.update(
            firestore.collection(FirestoreSchema.CLIENTS).document(clientUserId),
            mapOf("activeProgramId" to newId),
        )
        batch.commit().await()
        newId
    }

    override fun observeExerciseLibrary(): Flow<List<ExerciseLibraryItem>> =
        exerciseLibraryDao.observeAll().map { entities -> entities.map { it.toDomain() } }
}
