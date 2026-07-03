package com.ptcompanion.data.local.dao

import androidx.room.Dao
import androidx.room.Query
import androidx.room.Upsert
import com.ptcompanion.data.local.entity.TrainerEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface TrainerDao {
    @Query("SELECT * FROM trainers WHERE trainerId = :trainerId")
    fun observe(trainerId: String): Flow<TrainerEntity?>

    @Upsert
    suspend fun upsert(trainer: TrainerEntity)
}
