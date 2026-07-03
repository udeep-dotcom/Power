package com.ptcompanion.ui.client.progress

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ptcompanion.domain.model.AdherencePoint
import com.ptcompanion.domain.model.BodyMeasurementEntry
import com.ptcompanion.domain.model.LiftTrendPoint
import com.ptcompanion.domain.repository.AuthRepository
import com.ptcompanion.domain.repository.ProgressRepository
import com.ptcompanion.domain.repository.SessionRepository
import com.ptcompanion.domain.repository.TrainerRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.filterNotNull
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.util.UUID
import javax.inject.Inject

data class ProgressUiState(
    val isLoading: Boolean = true,
    val availableExercises: List<Pair<String, String>> = emptyList(), // id to name
    val selectedExerciseId: String? = null,
    val liftTrend: List<LiftTrendPoint> = emptyList(),
    val adherenceTrend: List<AdherencePoint> = emptyList(),
    val bodyMeasurements: List<BodyMeasurementEntry> = emptyList(),
)

@HiltViewModel
class ProgressViewModel @Inject constructor(
    authRepository: AuthRepository,
    trainerRepository: TrainerRepository,
    private val sessionRepository: SessionRepository,
    private val progressRepository: ProgressRepository,
) : ViewModel() {

    private val selectedExerciseId = kotlinx.coroutines.flow.MutableStateFlow<String?>(null)
    private val clientIdFlow = authRepository.currentSession.map { it?.uid }.filterNotNull()
    private lateinit var trainerId: String
    private lateinit var clientUserId: String

    val uiState: StateFlow<ProgressUiState> = clientIdFlow.flatMapLatest { uid ->
        clientUserId = uid
        trainerRepository.observeSelf(uid).filterNotNull().flatMapLatest { self ->
            trainerId = self.trainerId
            val sessionsFlow = sessionRepository.observeSessionsForClient(self.trainerId, uid)
            val adherenceFlow = progressRepository.observeAdherenceTrend(self.trainerId, uid, weeks = 8)
            val measurementsFlow = progressRepository.observeBodyMeasurements(self.trainerId, uid)

            combine(sessionsFlow, adherenceFlow, measurementsFlow, selectedExerciseId) { sessions, adherence, measurements, selected ->
                val exercises = sessions.flatMap { it.exercises }
                    .distinctBy { it.exerciseId }
                    .map { it.exerciseId to it.exerciseName }
                val effectiveSelection = selected ?: exercises.firstOrNull()?.first
                Triple(exercises, effectiveSelection, Pair(adherence, measurements))
            }.flatMapLatest { (exercises, effectiveSelection, rest) ->
                val (adherence, measurements) = rest
                if (effectiveSelection == null) {
                    flowOf(
                        ProgressUiState(
                            isLoading = false,
                            availableExercises = exercises,
                            selectedExerciseId = null,
                            adherenceTrend = adherence,
                            bodyMeasurements = measurements,
                        ),
                    )
                } else {
                    progressRepository.observeLiftTrend(self.trainerId, uid, effectiveSelection).map { trend ->
                        ProgressUiState(
                            isLoading = false,
                            availableExercises = exercises,
                            selectedExerciseId = effectiveSelection,
                            liftTrend = trend,
                            adherenceTrend = adherence,
                            bodyMeasurements = measurements,
                        )
                    }
                }
            }
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), ProgressUiState())

    fun selectExercise(exerciseId: String) {
        selectedExerciseId.value = exerciseId
    }

    fun logBodyWeight(weightKg: Double) {
        viewModelScope.launch {
            progressRepository.logBodyMeasurement(
                BodyMeasurementEntry(
                    entryId = UUID.randomUUID().toString(),
                    trainerId = trainerId,
                    clientUserId = clientUserId,
                    date = LocalDate.now(),
                    weightKg = weightKg,
                ),
            )
        }
    }
}
