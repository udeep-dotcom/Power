package com.ptcompanion.data.local.dao

import androidx.room.Dao
import androidx.room.Query
import androidx.room.Upsert
import com.ptcompanion.data.local.entity.ClientProfileEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface ClientProfileDao {
    @Query("SELECT * FROM client_profiles WHERE trainerId = :trainerId ORDER BY displayName")
    fun observeRoster(trainerId: String): Flow<List<ClientProfileEntity>>

    @Query("SELECT * FROM client_profiles WHERE trainerId = :trainerId AND clientUserId = :clientUserId")
    fun observe(trainerId: String, clientUserId: String): Flow<ClientProfileEntity?>

    @Upsert
    suspend fun upsertAll(clients: List<ClientProfileEntity>)

    @Upsert
    suspend fun upsert(client: ClientProfileEntity)
}
