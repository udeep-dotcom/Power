package com.ptcompanion.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.ptcompanion.domain.model.ProgramWeek
import java.time.Instant

@Entity(tableName = "programs")
data class ProgramEntity(
    @PrimaryKey val programId: String,
    val trainerId: String,
    val name: String,
    val isTemplate: Boolean,
    val clientUserId: String?,
    val clonedFromTemplateId: String?,
    val weeks: List<ProgramWeek>,
    val createdAt: Instant,
    val updatedAt: Instant,
)
