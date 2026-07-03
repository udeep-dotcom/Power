package com.ptcompanion.ui.client.today

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ptcompanion.domain.model.LoggedExercise
import com.ptcompanion.domain.model.LoggedSet
import com.ptcompanion.domain.model.Program
import com.ptcompanion.domain.model.ProgramDay
import com.ptcompanion.domain.model.SessionStatus
import com.ptcompanion.domain.model.WorkoutSession
import com.ptcompanion.domain.repository.AuthRepository
import com.ptcompanion.domain.repository.ProgramRepository
import com.ptcompanion.domain.repository.SessionRepository
import com.ptcompanion.domain.repository.TrainerRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.filterNotNull
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.util.UUID
import javax.inject.Inject

data class TodayUiState(
    val isLoading: Boolean = true,
    val clientDisplayName: String? = null,
    val session: WorkoutSession? = null,
    val hasActiveProgram: Boolean = true,
)

@HiltViewModel
class TodayViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val trainerRepository: TrainerRepository,
    private val programRepository: ProgramRepository,
    private val sessionRepository: SessionRepository,
) : ViewModel() {

    private val clientIdFlow = authRepository.currentSession.map { it?.uid }.filterNotNull()

    val uiState: StateFlow<TodayUiState> = clientIdFlow.flatMapLatest { clientUserId ->
        trainerRepository.observeSelf(clientUserId).filterNotNull().flatMapLatest { self ->
            val trainerId = self.trainerId
            combine(
                programRepository.observeActiveProgramForClient(trainerId, clientUserId),
                sessionRepository.observeSessionOn(trainerId, clientUserId, LocalDate.now()),
                sessionRepository.observeSessionsForClient(trainerId, clientUserId),
            ) { activeProgram, sessionToday, allSessions ->
                if (sessionToday == null && activeProgram != null) {
                    ensureTodaySession(trainerId, clientUserId, activeProgram, allSessions.size)
                }
                TodayUiState(
                    isLoading = false,
                    clientDisplayName = self.displayName,
                    session = sessionToday,
                    hasActiveProgram = activeProgram != null,
                )
            }
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), TodayUiState())

    private fun ensureTodaySession(trainerId: String, clientUserId: String, program: Program, sessionsLoggedSoFar: Int) {
        val allDays = program.weeks.sortedBy { it.index }.flatMap { it.days.sortedBy { d -> d.index } }
        if (allDays.isEmpty()) return
        val nextDay: ProgramDay = allDays[sessionsLoggedSoFar % allDays.size]
        val scaffold = WorkoutSession(
            sessionId = UUID.randomUUID().toString(),
            trainerId = trainerId,
            clientUserId = clientUserId,
            programId = program.programId,
            dayId = nextDay.dayId,
            dayLabel = nextDay.label,
            scheduledDate = LocalDate.now(),
            status = SessionStatus.SCHEDULED,
            exercises = nextDay.exercises.map { exercise ->
                LoggedExercise(
                    exerciseId = exercise.exerciseId,
                    exerciseName = exercise.exerciseName,
                    orderIndex = exercise.orderIndex,
                    sets = (0 until exercise.sets).map { i -> LoggedSet(setIndex = i, targetReps = exercise.reps) },
                )
            },
        )
        viewModelScope.launch { sessionRepository.upsertSession(scaffold) }
    }

    fun logSet(sessionId: String, exerciseId: String, setIndex: Int, reps: Int?, weightKg: Double?, rpe: Double?) {
        viewModelScope.launch {
            val session = uiState.value.session ?: return@launch
            val trainerId = session.trainerId
            val clientUserId = session.clientUserId
            sessionRepository.markSetLogged(trainerId, clientUserId, sessionId, exerciseId, setIndex, reps, weightKg, rpe)
        }
    }

    fun completeSession() {
        viewModelScope.launch {
            val session = uiState.value.session ?: return@launch
            sessionRepository.completeSession(session.trainerId, session.clientUserId, session.sessionId)
        }
    }
}
