package com.ptcompanion.domain.model

import java.time.LocalDate

/** Manual body-weight / measurement log entry. */
data class BodyMeasurementEntry(
    val entryId: String,
    val trainerId: String,
    val clientUserId: String,
    val date: LocalDate,
    val weightKg: Double? = null,
    val note: String? = null,
)

/** A single point on a "weight lifted over time" chart, derived from logged sessions. */
data class LiftTrendPoint(
    val date: LocalDate,
    val exerciseId: String,
    val exerciseName: String,
    val topWeightKg: Double,
    val topSetReps: Int,
)

/** A single point on an adherence-over-time chart, derived from logged sessions. */
data class AdherencePoint(
    val weekStart: LocalDate,
    val scheduled: Int,
    val completed: Int,
)
