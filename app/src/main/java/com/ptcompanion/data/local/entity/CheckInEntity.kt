package com.ptcompanion.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import java.time.Instant
import java.time.LocalDate

@Entity(tableName = "check_ins")
data class CheckInEntity(
    @PrimaryKey val checkInId: String,
    val trainerId: String,
    val clientUserId: String,
    val weekOf: LocalDate,
    val energyLevel: Int,
    val sorenessLevel: Int,
    val stickingToPlan: Boolean,
    val note: String?,
    val submittedAt: Instant,
    val syncState: String,
)
