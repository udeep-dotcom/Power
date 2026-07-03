package com.ptcompanion.data.local.dao

import androidx.room.Dao
import androidx.room.Query
import androidx.room.Upsert
import com.ptcompanion.data.local.entity.CheckInEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface CheckInDao {
    @Query(
        "SELECT * FROM check_ins WHERE trainerId = :trainerId AND clientUserId = :clientUserId " +
            "ORDER BY weekOf DESC",
    )
    fun observeForClient(trainerId: String, clientUserId: String): Flow<List<CheckInEntity>>

    @Query(
        "SELECT * FROM check_ins WHERE trainerId = :trainerId AND clientUserId = :clientUserId " +
            "ORDER BY weekOf DESC LIMIT 1",
    )
    fun observeLatest(trainerId: String, clientUserId: String): Flow<CheckInEntity?>

    @Query("SELECT * FROM check_ins WHERE syncState = 'PENDING_PUSH'")
    suspend fun getPendingPush(): List<CheckInEntity>

    @Query("SELECT * FROM check_ins WHERE checkInId = :checkInId LIMIT 1")
    suspend fun getById(checkInId: String): CheckInEntity?

    @Upsert
    suspend fun upsert(checkIn: CheckInEntity)
}
