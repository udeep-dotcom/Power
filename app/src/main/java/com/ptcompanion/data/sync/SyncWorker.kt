package com.ptcompanion.data.sync

import android.content.Context
import androidx.hilt.work.HiltWorker
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.google.firebase.firestore.FirebaseFirestore
import com.ptcompanion.data.local.SyncState
import com.ptcompanion.data.local.dao.BodyMeasurementDao
import com.ptcompanion.data.local.dao.CheckInDao
import com.ptcompanion.data.local.dao.SessionDao
import com.ptcompanion.data.local.entity.BodyMeasurementEntity
import com.ptcompanion.data.local.entity.CheckInEntity
import com.ptcompanion.data.local.entity.SessionEntity
import com.ptcompanion.data.remote.FirestoreSchema
import com.ptcompanion.data.repository.toDomain
import com.ptcompanion.data.repository.toDto
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject
import kotlinx.coroutines.tasks.await

/**
 * Pushes rows written locally while offline (marked [SyncState.PENDING_PUSH]) up to
 * Firestore. Runs whenever [SyncScheduler.requestSync] is called (after every local write)
 * and WorkManager's own retry/backoff policy takes care of "no signal right now".
 */
@HiltWorker
class SyncWorker @AssistedInject constructor(
    @Assisted context: Context,
    @Assisted params: WorkerParameters,
    private val sessionDao: SessionDao,
    private val checkInDao: CheckInDao,
    private val bodyMeasurementDao: BodyMeasurementDao,
    private val firestore: FirebaseFirestore,
) : CoroutineWorker(context, params) {

    companion object {
        const val UNIQUE_WORK_NAME = "pt-companion-sync"
    }

    override suspend fun doWork(): Result = try {
        pushSessions()
        pushCheckIns()
        pushBodyMeasurements()
        Result.success()
    } catch (e: Exception) {
        Result.retry()
    }

    private suspend fun pushSessions() {
        for (entity: SessionEntity in sessionDao.getPendingPush()) {
            firestore.collection(FirestoreSchema.SESSIONS)
                .document(entity.sessionId)
                .set(entity.toDomain().toDto())
                .await()
            sessionDao.upsert(entity.copy(syncState = SyncState.SYNCED.name))
        }
    }

    private suspend fun pushCheckIns() {
        for (entity: CheckInEntity in checkInDao.getPendingPush()) {
            firestore.collection(FirestoreSchema.CHECK_INS)
                .document(entity.checkInId)
                .set(entity.toDomain().toDto())
                .await()
            checkInDao.upsert(entity.copy(syncState = SyncState.SYNCED.name))
        }
    }

    private suspend fun pushBodyMeasurements() {
        for (entity: BodyMeasurementEntity in bodyMeasurementDao.getPendingPush()) {
            firestore.collection(FirestoreSchema.BODY_MEASUREMENTS)
                .document(entity.entryId)
                .set(entity.toDomain().toDto())
                .await()
            bodyMeasurementDao.upsert(entity.copy(syncState = SyncState.SYNCED.name))
        }
    }
}
