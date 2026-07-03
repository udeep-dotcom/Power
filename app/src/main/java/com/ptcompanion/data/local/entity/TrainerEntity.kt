package com.ptcompanion.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import java.time.Instant

@Entity(tableName = "trainers")
data class TrainerEntity(
    @PrimaryKey val trainerId: String,
    val displayName: String,
    val email: String,
    val plan: String,
    val createdAt: Instant,
)
