package com.ptcompanion.domain.model

import java.time.Instant
import java.time.LocalDate

/**
 * The lightweight weekly check-in: three fixed questions, not a form builder. Lives
 * alongside session/progress data on the client's profile rather than in a separate tool.
 */
data class CheckIn(
    val checkInId: String,
    val trainerId: String,
    val clientUserId: String,
    val weekOf: LocalDate,
    val energyLevel: Int,
    val sorenessLevel: Int,
    val stickingToPlan: Boolean,
    val note: String? = null,
    val submittedAt: Instant = Instant.now(),
) {
    companion object {
        const val MIN_SCALE = 1
        const val MAX_SCALE = 5
    }
}
