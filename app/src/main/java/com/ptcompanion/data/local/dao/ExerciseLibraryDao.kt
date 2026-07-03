package com.ptcompanion.data.local.dao

import androidx.room.Dao
import androidx.room.Query
import androidx.room.Upsert
import com.ptcompanion.data.local.entity.ExerciseLibraryEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface ExerciseLibraryDao {
    @Query("SELECT * FROM exercise_library ORDER BY name")
    fun observeAll(): Flow<List<ExerciseLibraryEntity>>

    @Query("SELECT COUNT(*) FROM exercise_library")
    suspend fun count(): Int

    @Upsert
    suspend fun upsertAll(items: List<ExerciseLibraryEntity>)
}
