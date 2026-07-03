package com.ptcompanion.data.remote.dto

data class ProgramExerciseDto @JvmOverloads constructor(
    var exerciseId: String = "",
    var exerciseName: String = "",
    var orderIndex: Int = 0,
    var sets: Int = 0,
    var reps: String = "",
    var targetWeightKg: Double? = null,
    var targetRpe: Double? = null,
    var restSeconds: Long? = null,
    var coachingNote: String? = null,
)

data class ProgramDayDto @JvmOverloads constructor(
    var dayId: String = "",
    var index: Int = 0,
    var label: String = "",
    var exercises: List<ProgramExerciseDto> = emptyList(),
)

data class ProgramWeekDto @JvmOverloads constructor(
    var weekId: String = "",
    var index: Int = 0,
    var days: List<ProgramDayDto> = emptyList(),
)

data class ProgramDto @JvmOverloads constructor(
    var programId: String = "",
    var trainerId: String = "",
    var name: String = "",
    var isTemplate: Boolean = false,
    var clientUserId: String? = null,
    var clonedFromTemplateId: String? = null,
    var weeks: List<ProgramWeekDto> = emptyList(),
    var createdAt: String = "",
    var updatedAt: String = "",
)
