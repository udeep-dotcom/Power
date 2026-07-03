package com.ptcompanion.domain.repository

import com.ptcompanion.domain.model.ClientProfile
import com.ptcompanion.domain.model.InviteCode
import com.ptcompanion.domain.model.Trainer
import kotlinx.coroutines.flow.Flow

interface TrainerRepository {
    fun observeTrainer(trainerId: String): Flow<Trainer?>

    /** Scoped to the calling trainer's own roster only. */
    fun observeRoster(trainerId: String): Flow<List<ClientProfile>>

    fun observeClient(trainerId: String, clientUserId: String): Flow<ClientProfile?>

    /** For a client viewing their own profile, before their trainerId is otherwise known. */
    fun observeSelf(clientUserId: String): Flow<ClientProfile?>

    /** Generates a new short invite code owned by [trainerId]. */
    suspend fun generateInviteCode(trainerId: String, clientDisplayName: String?): Result<InviteCode>

    fun observeInviteCodes(trainerId: String): Flow<List<InviteCode>>
}
