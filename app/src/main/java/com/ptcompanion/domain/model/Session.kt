package com.ptcompanion.domain.model

import kotlinx.serialization.Serializable
import java.time.Instant
import java.time.LocalDate

enum class SessionStatus {
    SCHEDULED,
    IN_PROGRESS,
    COMPLETED,
    SKIPPED,
}

@Serializable
data class LoggedSet(
    val setIndex: Int,
    val targetReps: String? = null,
    val actualReps: Int? = null,
    val actualWeightKg: Double? = null,
    val rpe: Double? = null,
    val completed: Boolean = false,
)

@Serializable
data class LoggedExercise(
    val exerciseId: String,
    val exerciseName: String,
    val orderIndex: Int,
    val sets: List<LoggedSet> = emptyList(),
)

/**
 * A single day's workout, logged by the client. Carries both [trainerId] and
 * [clientUserId] so rules can scope it to the owning client while still letting the
 * owning trainer read it for the roster/progress views.
 */
data class WorkoutSession(
    val sessionId: String,
    val trainerId: String,
    val clientUserId: String,
    val programId: String?,
    val dayId: String?,
    val dayLabel: String,
    val scheduledDate: LocalDate,
    val status: SessionStatus = SessionStatus.SCHEDULED,
    val completedAt: Instant? = null,
    val exercises: List<LoggedExercise> = emptyList(),
)
