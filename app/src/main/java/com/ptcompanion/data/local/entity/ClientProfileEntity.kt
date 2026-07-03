package com.ptcompanion.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import java.time.Instant

@Entity(tableName = "client_profiles")
data class ClientProfileEntity(
    @PrimaryKey val clientUserId: String,
    val trainerId: String,
    val displayName: String,
    val email: String,
    val joinedAt: Instant,
    val complianceStatus: String,
    val activeProgramId: String?,
)
