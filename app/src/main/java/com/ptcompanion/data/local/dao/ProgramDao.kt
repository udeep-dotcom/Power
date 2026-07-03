package com.ptcompanion.data.local.dao

import androidx.room.Dao
import androidx.room.Query
import androidx.room.Upsert
import com.ptcompanion.data.local.entity.ProgramEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface ProgramDao {
    @Query("SELECT * FROM programs WHERE trainerId = :trainerId AND isTemplate = 1 ORDER BY updatedAt DESC")
    fun observeTemplates(trainerId: String): Flow<List<ProgramEntity>>

    @Query("SELECT * FROM programs WHERE trainerId = :trainerId AND programId = :programId")
    fun observe(trainerId: String, programId: String): Flow<ProgramEntity?>

    @Upsert
    suspend fun upsert(program: ProgramEntity)
}
