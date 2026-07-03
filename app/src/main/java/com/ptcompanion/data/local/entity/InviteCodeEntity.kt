package com.ptcompanion.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import java.time.Instant

@Entity(tableName = "invite_codes")
data class InviteCodeEntity(
    @PrimaryKey val code: String,
    val trainerId: String,
    val clientDisplayName: String?,
    val createdAt: Instant,
    val expiresAt: Instant?,
    val used: Boolean,
    val usedByClientUserId: String?,
    val usedAt: Instant?,
)
