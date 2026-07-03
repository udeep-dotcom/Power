package com.ptcompanion.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import java.time.LocalDate

@Entity(tableName = "body_measurements")
data class BodyMeasurementEntity(
    @PrimaryKey val entryId: String,
    val trainerId: String,
    val clientUserId: String,
    val date: LocalDate,
    val weightKg: Double?,
    val note: String?,
    val syncState: String,
)
