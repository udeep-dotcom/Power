package com.ptcompanion.data.remote.dto

data class CheckInDto @JvmOverloads constructor(
    var checkInId: String = "",
    var trainerId: String = "",
    var clientUserId: String = "",
    var weekOf: String = "",
    var energyLevel: Long = 0,
    var sorenessLevel: Long = 0,
    var stickingToPlan: Boolean = false,
    var note: String? = null,
    var submittedAt: String = "",
)
