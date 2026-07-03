package com.ptcompanion.data.remote.dto

data class InviteCodeDto @JvmOverloads constructor(
    var code: String = "",
    var trainerId: String = "",
    var clientDisplayName: String? = null,
    var createdAt: String = "",
    var expiresAt: String? = null,
    var used: Boolean = false,
    var usedByClientUserId: String? = null,
    var usedAt: String? = null,
)
