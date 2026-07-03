package com.ptcompanion.data.repository

import com.google.firebase.firestore.FirebaseFirestore
import com.ptcompanion.data.local.SyncState
import com.ptcompanion.data.local.dao.CheckInDao
import com.ptcompanion.data.remote.FirestoreSchema
import com.ptcompanion.data.remote.dto.CheckInDto
import com.ptcompanion.data.remote.observeAsFlow
import com.ptcompanion.data.sync.SyncScheduler
import com.ptcompanion.di.ApplicationScope
import com.ptcompanion.domain.model.CheckIn
import com.ptcompanion.domain.repository.CheckInRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.onEach
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.temporal.TemporalAdjusters
import java.util.concurrent.ConcurrentHashMap
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class CheckInRepositoryImpl @Inject constructor(
    private val checkInDao: CheckInDao,
    private val firestore: FirebaseFirestore,
    private val syncScheduler: SyncScheduler,
    @ApplicationScope private val appScope: CoroutineScope,
) : CheckInRepository {

    private val activeMirrors = ConcurrentHashMap.newKeySet<String>()

    override fun observeCheckIns(trainerId: String, clientUserId: String): Flow<List<CheckIn>> {
        startRemoteMirror(trainerId, clientUserId)
        return checkInDao.observeForClient(trainerId, clientUserId).map { list -> list.map { it.toDomain() } }
    }

    override fun observeLatestCheckIn(trainerId: String, clientUserId: String): Flow<CheckIn?> {
        startRemoteMirror(trainerId, clientUserId)
        return checkInDao.observeLatest(trainerId, clientUserId).map { it?.toDomain() }
    }

    override suspend fun submitCheckIn(checkIn: CheckIn) {
        checkInDao.upsert(checkIn.toEntity(SyncState.PENDING_PUSH))
        syncScheduler.requestSync()
    }

    override suspend fun isCheckInDueThisWeek(trainerId: String, clientUserId: String): Boolean {
        val latest = observeLatestCheckIn(trainerId, clientUserId).first() ?: return true
        val startOfWeek = LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
        return latest.weekOf.isBefore(startOfWeek)
    }

    private fun startRemoteMirror(trainerId: String, clientUserId: String) {
        val key = "$trainerId/$clientUserId"
        if (!activeMirrors.add(key)) return

        firestore.collection(FirestoreSchema.CHECK_INS)
            .whereEqualTo(FirestoreSchema.FIELD_TRAINER_ID, trainerId)
            .whereEqualTo(FirestoreSchema.FIELD_CLIENT_USER_ID, clientUserId)
            .observeAsFlow()
            .onEach { snapshot ->
                for (doc in snapshot.documents) {
                    val dto = doc.toObject(CheckInDto::class.java) ?: continue
                    val local = checkInDao.getById(dto.checkInId)
                    if (local?.syncState == SyncState.PENDING_PUSH.name) continue
                    checkInDao.upsert(dto.toDomain().toEntity(SyncState.SYNCED))
                }
            }
            .launchIn(appScope)
    }
}
