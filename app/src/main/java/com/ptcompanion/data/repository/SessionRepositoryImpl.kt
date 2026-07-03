package com.ptcompanion.data.repository

import com.google.firebase.firestore.FirebaseFirestore
import com.ptcompanion.data.local.SyncState
import com.ptcompanion.data.local.dao.SessionDao
import com.ptcompanion.data.remote.FirestoreSchema
import com.ptcompanion.data.remote.dto.SessionDto
import com.ptcompanion.data.remote.observeAsFlow
import com.ptcompanion.data.sync.SyncScheduler
import com.ptcompanion.di.ApplicationScope
import com.ptcompanion.domain.model.WorkoutSession
import com.ptcompanion.domain.repository.SessionRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.onEach
import java.time.Instant
import java.time.LocalDate
import java.util.concurrent.ConcurrentHashMap
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SessionRepositoryImpl @Inject constructor(
    private val sessionDao: SessionDao,
    private val firestore: FirebaseFirestore,
    private val syncScheduler: SyncScheduler,
    @ApplicationScope private val appScope: CoroutineScope,
) : SessionRepository {

    private val activeMirrors = ConcurrentHashMap.newKeySet<String>()

    override fun observeSessionsForClient(trainerId: String, clientUserId: String): Flow<List<WorkoutSession>> {
        startRemoteMirror(trainerId, clientUserId)
        return sessionDao.observeForClient(trainerId, clientUserId).map { list -> list.map { it.toDomain() } }
    }

    override fun observeSessionOn(trainerId: String, clientUserId: String, date: LocalDate): Flow<WorkoutSession?> {
        startRemoteMirror(trainerId, clientUserId)
        return sessionDao.observeOn(trainerId, clientUserId, date).map { it?.toDomain() }
    }

    override fun observeSession(trainerId: String, clientUserId: String, sessionId: String): Flow<WorkoutSession?> {
        startRemoteMirror(trainerId, clientUserId)
        return sessionDao.observe(trainerId, clientUserId, sessionId).map { it?.toDomain() }
    }

    override suspend fun upsertSession(session: WorkoutSession) {
        sessionDao.upsert(session.toEntity(SyncState.PENDING_PUSH))
        syncScheduler.requestSync()
    }

    override suspend fun markSetLogged(
        trainerId: String,
        clientUserId: String,
        sessionId: String,
        exerciseId: String,
        setIndex: Int,
        actualReps: Int?,
        actualWeightKg: Double?,
        rpe: Double?,
    ) {
        val current = sessionDao.getById(sessionId)?.toDomain() ?: return
        val updatedExercises = current.exercises.map { exercise ->
            if (exercise.exerciseId != exerciseId) return@map exercise
            exercise.copy(
                sets = exercise.sets.map { set ->
                    if (set.setIndex != setIndex) return@map set
                    set.copy(actualReps = actualReps, actualWeightKg = actualWeightKg, rpe = rpe, completed = true)
                },
            )
        }
        upsertSession(current.copy(exercises = updatedExercises))
    }

    override suspend fun completeSession(trainerId: String, clientUserId: String, sessionId: String) {
        val current = sessionDao.getById(sessionId)?.toDomain() ?: return
        upsertSession(
            current.copy(
                status = com.ptcompanion.domain.model.SessionStatus.COMPLETED,
                completedAt = Instant.now(),
            ),
        )
    }

    /**
     * Mirrors the remote Firestore collection for this (trainer, client) pair into Room, so
     * both the trainer's and the client's devices converge. Skips any row that's currently
     * PENDING_PUSH locally so an in-flight offline edit is never clobbered by a stale remote
     * read before [com.ptcompanion.data.sync.SyncWorker] has pushed it.
     */
    private fun startRemoteMirror(trainerId: String, clientUserId: String) {
        val key = "$trainerId/$clientUserId"
        if (!activeMirrors.add(key)) return

        firestore.collection(FirestoreSchema.SESSIONS)
            .whereEqualTo(FirestoreSchema.FIELD_TRAINER_ID, trainerId)
            .whereEqualTo(FirestoreSchema.FIELD_CLIENT_USER_ID, clientUserId)
            .observeAsFlow()
            .onEach { snapshot ->
                for (doc in snapshot.documents) {
                    val dto = doc.toObject(SessionDto::class.java) ?: continue
                    val local = sessionDao.getById(dto.sessionId)
                    if (local?.syncState == SyncState.PENDING_PUSH.name) continue
                    sessionDao.upsert(dto.toDomain().toEntity(SyncState.SYNCED))
                }
            }
            .launchIn(appScope)
    }
}
