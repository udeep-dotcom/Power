package com.ptcompanion.domain.model

import java.time.Instant

/**
 * Root tenant. [trainerId] is always the Firebase Auth uid of the trainer and is the
 * partition key every trainer-owned document in Firestore carries.
 *
 * [plan] is an unused stub reserved for future billing gating. Nothing in this codebase
 * reads it to gate behavior.
 */
data class Trainer(
    val trainerId: String,
    val displayName: String,
    val email: String,
    val plan: String = "free",
    val createdAt: Instant = Instant.now(),
)
