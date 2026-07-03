package com.ptcompanion.data.remote.dto

data class LoggedSetDto @JvmOverloads constructor(
    var setIndex: Int = 0,
    var targetReps: String? = null,
    var actualReps: Long? = null,
    var actualWeightKg: Double? = null,
    var rpe: Double? = null,
    var completed: Boolean = false,
)

data class LoggedExerciseDto @JvmOverloads constructor(
    var exerciseId: String = "",
    var exerciseName: String = "",
    var orderIndex: Int = 0,
    var sets: List<LoggedSetDto> = emptyList(),
)

data class SessionDto @JvmOverloads constructor(
    var sessionId: String = "",
    var trainerId: String = "",
    var clientUserId: String = "",
    var programId: String? = null,
    var dayId: String? = null,
    var dayLabel: String = "",
    var scheduledDate: String = "",
    var status: String = "SCHEDULED",
    var completedAt: String? = null,
    var exercises: List<LoggedExerciseDto> = emptyList(),
)
