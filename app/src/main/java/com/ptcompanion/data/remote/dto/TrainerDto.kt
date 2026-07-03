package com.ptcompanion.data.remote.dto

/**
 * Firestore document shape for /trainers/{trainerId}. Plain POJO for automatic (de)serialization.
 * `@JvmOverloads` is required here: Firestore's Kotlin mapper needs a public no-arg constructor,
 * and Kotlin does not synthesize one just because every property has a default value.
 */
data class TrainerDto @JvmOverloads constructor(
    var trainerId: String = "",
    var displayName: String = "",
    var email: String = "",
    var plan: String = "free",
    var createdAt: String = "",
)
