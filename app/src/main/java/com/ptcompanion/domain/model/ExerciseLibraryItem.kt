package com.ptcompanion.domain.model

enum class MuscleGroup {
    CHEST,
    BACK,
    SHOULDERS,
    BICEPS,
    TRICEPS,
    QUADS,
    HAMSTRINGS,
    GLUTES,
    CALVES,
    CORE,
    FULL_BODY,
    CARDIO,
}

/**
 * Shared, read-only reference data — not tenant-scoped. No video for MVP by design
 * (flagged as a natural v2 addition, not stubbed here).
 */
data class ExerciseLibraryItem(
    val exerciseId: String,
    val name: String,
    val muscleGroup: MuscleGroup,
    val equipment: String? = null,
)
