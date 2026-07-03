package com.ptcompanion.data.local.dao

import androidx.room.Dao
import androidx.room.Query
import androidx.room.Upsert
import com.ptcompanion.data.local.entity.InviteCodeEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface InviteCodeDao {
    @Query("SELECT * FROM invite_codes WHERE trainerId = :trainerId ORDER BY createdAt DESC")
    fun observeForTrainer(trainerId: String): Flow<List<InviteCodeEntity>>

    @Upsert
    suspend fun upsert(inviteCode: InviteCodeEntity)
}
