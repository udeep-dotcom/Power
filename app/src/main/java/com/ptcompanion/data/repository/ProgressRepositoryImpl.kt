package com.ptcompanion.data.repository

import com.google.firebase.firestore.FirebaseFirestore
import com.ptcompanion.data.local.SyncState
import com.ptcompanion.data.local.dao.BodyMeasurementDao
import com.ptcompanion.data.local.dao.SessionDao
import com.ptcompanion.data.remote.FirestoreSchema
import com.ptcompanion.data.remote.dto.BodyMeasurementDto
import com.ptcompanion.data.remote.observeAsFlow
import com.ptcompanion.data.sync.SyncScheduler
import com.ptcompanion.di.ApplicationScope
import com.ptcompanion.domain.model.AdherencePoint
import com.ptcompanion.domain.model.BodyMeasurementEntry
import com.ptcompanion.domain.model.LiftTrendPoint
import com.ptcompanion.domain.model.SessionStatus
import com.ptcompanion.domain.repository.ProgressRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.onEach
import java.time.DayOfWeek
import java.time.temporal.TemporalAdjusters
import java.util.concurrent.ConcurrentHashMap
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ProgressRepositoryImpl @Inject constructor(
    private val sessionDao: SessionDao,
    private val bodyMeasurementDao: BodyMeasurementDao,
    private val firestore: FirebaseFirestore,
    private val syncScheduler: SyncScheduler,
    @ApplicationScope private val appScope: CoroutineScope,
) : ProgressRepository {

    private val activeMirrors = ConcurrentHashMap.newKeySet<String>()

    // Progress lives next to the workout it came from: derived from logged sessions
    // rather than a separate check-in tool.
    override fun observeLiftTrend(trainerId: String, clientUserId: String, exerciseId: String): Flow<List<LiftTrendPoint>> =
        sessionDao.observeForClient(trainerId, clientUserId).map { sessions ->
            sessions.mapNotNull { session ->
                val exercise = session.exercises.firstOrNull { it.exerciseId == exerciseId } ?: return@mapNotNull null
                val topSet = exercise.sets
                    .filter { it.completed && it.actualWeightKg != null }
                    .maxByOrNull { it.actualWeightKg ?: 0.0 } ?: return@mapNotNull null
                LiftTrendPoint(
                    date = session.scheduledDate,
                    exerciseId = exerciseId,
                    exerciseName = exercise.exerciseName,
                    topWeightKg = topSet.actualWeightKg ?: 0.0,
                    topSetReps = topSet.actualReps ?: 0,
                )
            }.sortedBy { it.date }
        }

    override fun observeAdherenceTrend(trainerId: String, clientUserId: String, weeks: Int): Flow<List<AdherencePoint>> =
        sessionDao.observeForClient(trainerId, clientUserId).map { sessions ->
            sessions
                .groupBy { it.scheduledDate.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)) }
                .toSortedMap()
                .toList()
                .takeLast(weeks)
                .map { (weekStart, sessionsInWeek) ->
                    AdherencePoint(
                        weekStart = weekStart,
                        scheduled = sessionsInWeek.size,
                        completed = sessionsInWeek.count { it.status == SessionStatus.COMPLETED.name },
                    )
                }
        }

    override fun observeBodyMeasurements(trainerId: String, clientUserId: String): Flow<List<BodyMeasurementEntry>> {
        startRemoteMirror(trainerId, clientUserId)
        return bodyMeasurementDao.observeForClient(trainerId, clientUserId).map { list -> list.map { it.toDomain() } }
    }

    override suspend fun logBodyMeasurement(entry: BodyMeasurementEntry) {
        bodyMeasurementDao.upsert(entry.toEntity(SyncState.PENDING_PUSH))
        syncScheduler.requestSync()
    }

    private fun startRemoteMirror(trainerId: String, clientUserId: String) {
        val key = "$trainerId/$clientUserId"
        if (!activeMirrors.add(key)) return

        firestore.collection(FirestoreSchema.BODY_MEASUREMENTS)
            .whereEqualTo(FirestoreSchema.FIELD_TRAINER_ID, trainerId)
            .whereEqualTo(FirestoreSchema.FIELD_CLIENT_USER_ID, clientUserId)
            .observeAsFlow()
            .onEach { snapshot ->
                for (doc in snapshot.documents) {
                    val dto = doc.toObject(BodyMeasurementDto::class.java) ?: continue
                    val local = bodyMeasurementDao.getById(dto.entryId)
                    if (local?.syncState == SyncState.PENDING_PUSH.name) continue
                    bodyMeasurementDao.upsert(dto.toDomain().toEntity(SyncState.SYNCED))
                }
            }
            .launchIn(appScope)
    }
}
