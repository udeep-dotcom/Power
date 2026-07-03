package com.ptcompanion.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.ptcompanion.domain.model.LoggedExercise
import java.time.Instant
import java.time.LocalDate

@Entity(tableName = "sessions")
data class SessionEntity(
    @PrimaryKey val sessionId: String,
    val trainerId: String,
    val clientUserId: String,
    val programId: String?,
    val dayId: String?,
    val dayLabel: String,
    val scheduledDate: LocalDate,
    val status: String,
    val completedAt: Instant?,
    val exercises: List<LoggedExercise>,
    /** [com.ptcompanion.data.local.SyncState] name - "SYNCED" or "PENDING_PUSH". */
    val syncState: String,
    val updatedAt: Instant,
)
