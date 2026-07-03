package com.ptcompanion.domain.model

import kotlinx.serialization.Serializable
import java.time.Instant

@Serializable
data class ProgramExercise(
    val exerciseId: String,
    val exerciseName: String,
    val orderIndex: Int,
    val sets: Int,
    val reps: String,
    val targetWeightKg: Double? = null,
    val targetRpe: Double? = null,
    val restSeconds: Int? = null,
    val coachingNote: String? = null,
)

@Serializable
data class ProgramDay(
    val dayId: String,
    val index: Int,
    val label: String,
    val exercises: List<ProgramExercise> = emptyList(),
)

@Serializable
data class ProgramWeek(
    val weekId: String,
    val index: Int,
    val days: List<ProgramDay> = emptyList(),
)

/**
 * A program is either a reusable [isTemplate] owned only by the trainer, or an
 * assignment copy bound to one [clientUserId]. Assigning a template to a client clones
 * it into a new Program doc with clientUserId set and clonedFromTemplateId pointing
 * back — so a trainer can freely edit a client's copy (e.g. adjust a target weight)
 * without mutating the template or other clients' copies.
 */
data class Program(
    val programId: String,
    val trainerId: String,
    val name: String,
    val isTemplate: Boolean = false,
    val clientUserId: String? = null,
    val clonedFromTemplateId: String? = null,
    val weeks: List<ProgramWeek> = emptyList(),
    val createdAt: Instant = Instant.now(),
    val updatedAt: Instant = Instant.now(),
)
