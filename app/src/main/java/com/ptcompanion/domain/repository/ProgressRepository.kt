package com.ptcompanion.domain.repository

import com.ptcompanion.domain.model.AdherencePoint
import com.ptcompanion.domain.model.BodyMeasurementEntry
import com.ptcompanion.domain.model.LiftTrendPoint
import kotlinx.coroutines.flow.Flow

interface ProgressRepository {
    /** Derived from logged sessions - not a separate check-in tool. */
    fun observeLiftTrend(trainerId: String, clientUserId: String, exerciseId: String): Flow<List<LiftTrendPoint>>

    fun observeAdherenceTrend(trainerId: String, clientUserId: String, weeks: Int): Flow<List<AdherencePoint>>

    fun observeBodyMeasurements(trainerId: String, clientUserId: String): Flow<List<BodyMeasurementEntry>>

    suspend fun logBodyMeasurement(entry: BodyMeasurementEntry)
}
