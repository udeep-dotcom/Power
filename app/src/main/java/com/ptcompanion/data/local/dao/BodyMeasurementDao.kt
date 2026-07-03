package com.ptcompanion.data.local.dao

import androidx.room.Dao
import androidx.room.Query
import androidx.room.Upsert
import com.ptcompanion.data.local.entity.BodyMeasurementEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface BodyMeasurementDao {
    @Query(
        "SELECT * FROM body_measurements WHERE trainerId = :trainerId AND clientUserId = :clientUserId " +
            "ORDER BY date DESC",
    )
    fun observeForClient(trainerId: String, clientUserId: String): Flow<List<BodyMeasurementEntity>>

    @Query("SELECT * FROM body_measurements WHERE syncState = 'PENDING_PUSH'")
    suspend fun getPendingPush(): List<BodyMeasurementEntity>

    @Query("SELECT * FROM body_measurements WHERE entryId = :entryId LIMIT 1")
    suspend fun getById(entryId: String): BodyMeasurementEntity?

    @Upsert
    suspend fun upsert(entry: BodyMeasurementEntity)
}
