package com.ptcompanion.domain.model

import java.time.Instant

/**
 * A client always belongs to exactly one trainer in this MVP. [clientUserId] is the
 * client's own Firebase Auth uid; [trainerId] is the owning trainer's uid. Every
 * client-authored document (sessions, check-ins, measurements) carries both fields so
 * Firestore rules can scope reads to "my own data" even within one trainer's roster.
 */
data class ClientProfile(
    val clientUserId: String,
    val trainerId: String,
    val displayName: String,
    val email: String,
    val joinedAt: Instant = Instant.now(),
    val complianceStatus: ComplianceStatus = ComplianceStatus.NO_DATA,
    val activeProgramId: String? = null,
)
