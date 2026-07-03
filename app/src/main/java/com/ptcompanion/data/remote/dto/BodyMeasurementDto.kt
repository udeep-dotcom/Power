package com.ptcompanion.data.remote.dto

data class BodyMeasurementDto @JvmOverloads constructor(
    var entryId: String = "",
    var trainerId: String = "",
    var clientUserId: String = "",
    var date: String = "",
    var weightKg: Double? = null,
    var note: String? = null,
)
