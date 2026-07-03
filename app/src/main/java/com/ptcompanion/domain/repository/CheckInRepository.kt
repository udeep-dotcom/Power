package com.ptcompanion.domain.repository

import com.ptcompanion.domain.model.CheckIn
import kotlinx.coroutines.flow.Flow

interface CheckInRepository {
    fun observeCheckIns(trainerId: String, clientUserId: String): Flow<List<CheckIn>>

    fun observeLatestCheckIn(trainerId: String, clientUserId: String): Flow<CheckIn?>

    suspend fun submitCheckIn(checkIn: CheckIn)

    /** True if the client hasn't submitted a check-in for the current week yet. */
    suspend fun isCheckInDueThisWeek(trainerId: String, clientUserId: String): Boolean
}
