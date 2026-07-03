package com.ptcompanion.domain.model

/**
 * Simplified single-state adherence signal (MVP cut of TrueCoach's 7/30/90-day view).
 * Computed client-side for display from the client's own recent sessions, never trusted
 * as a security boundary.
 */
enum class ComplianceStatus {
    ON_TRACK,
    NEEDS_ATTENTION,
    NO_DATA,
}

object ComplianceCalculator {
    /** Looks at the trailing 7 days of scheduled sessions to decide on-track vs needs-attention. */
    fun compute(scheduledInLast7Days: Int, completedInLast7Days: Int): ComplianceStatus {
        if (scheduledInLast7Days == 0) return ComplianceStatus.NO_DATA
        val ratio = completedInLast7Days.toDouble() / scheduledInLast7Days
        return if (ratio >= 0.7) ComplianceStatus.ON_TRACK else ComplianceStatus.NEEDS_ATTENTION
    }
}
