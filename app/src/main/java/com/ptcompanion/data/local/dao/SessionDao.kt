package com.ptcompanion.data.local.dao

import androidx.room.Dao
import androidx.room.Query
import androidx.room.Upsert
import com.ptcompanion.data.local.entity.SessionEntity
import kotlinx.coroutines.flow.Flow
import java.time.LocalDate

@Dao
interface SessionDao {
    @Query(
        "SELECT * FROM sessions WHERE trainerId = :trainerId AND clientUserId = :clientUserId " +
            "ORDER BY scheduledDate DESC",
    )
    fun observeForClient(trainerId: String, clientUserId: String): Flow<List<SessionEntity>>

    @Query(
        "SELECT * FROM sessions WHERE trainerId = :trainerId AND clientUserId = :clientUserId " +
            "AND scheduledDate = :date LIMIT 1",
    )
    fun observeOn(trainerId: String, clientUserId: String, date: LocalDate): Flow<SessionEntity?>

    @Query("SELECT * FROM sessions WHERE trainerId = :trainerId AND clientUserId = :clientUserId AND sessionId = :sessionId")
    fun observe(trainerId: String, clientUserId: String, sessionId: String): Flow<SessionEntity?>

    @Query("SELECT * FROM sessions WHERE sessionId = :sessionId LIMIT 1")
    suspend fun getById(sessionId: String): SessionEntity?

    @Query("SELECT * FROM sessions WHERE syncState = 'PENDING_PUSH'")
    suspend fun getPendingPush(): List<SessionEntity>

    @Upsert
    suspend fun upsert(session: SessionEntity)
}
