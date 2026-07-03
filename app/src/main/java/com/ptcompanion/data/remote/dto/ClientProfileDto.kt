package com.ptcompanion.data.remote.dto

data class ClientProfileDto @JvmOverloads constructor(
    var clientUserId: String = "",
    var trainerId: String = "",
    var displayName: String = "",
    var email: String = "",
    var joinedAt: String = "",
    var activeProgramId: String? = null,
    /** Which invite code was redeemed to create this doc; required by the create security rule. */
    var redeemedInviteCode: String? = null,
)
