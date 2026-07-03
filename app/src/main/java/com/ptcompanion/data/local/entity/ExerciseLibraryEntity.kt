package com.ptcompanion.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "exercise_library")
data class ExerciseLibraryEntity(
    @PrimaryKey val exerciseId: String,
    val name: String,
    val muscleGroup: String,
    val equipment: String?,
)
