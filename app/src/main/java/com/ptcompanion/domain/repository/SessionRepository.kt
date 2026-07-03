package com.ptcompanion.domain.repository

import com.ptcompanion.domain.model.WorkoutSession
import kotlinx.coroutines.flow.Flow
import java.time.LocalDate

interface SessionRepository {
    fun observeSessionsForClient(trainerId: String, clientUserId: String): Flow<List<WorkoutSession>>

    fun observeSessionOn(trainerId: String, clientUserId: String, date: LocalDate): Flow<WorkoutSession?>

    fun observeSession(trainerId: String, clientUserId: String, sessionId: String): Flow<WorkoutSession?>

    /** Offline-first: writes locally immediately and is picked up by background sync. */
    suspend fun upsertSession(session: WorkoutSession)

    suspend fun markSetLogged(
        trainerId: String,
        clientUserId: String,
        sessionId: String,
        exerciseId: String,
        setIndex: Int,
        actualReps: Int?,
        actualWeightKg: Double?,
        rpe: Double?,
    )

    suspend fun completeSession(trainerId: String, clientUserId: String, sessionId: String)
}
