package com.ptcompanion.ui.client.checkin

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ptcompanion.domain.model.CheckIn
import com.ptcompanion.domain.repository.AuthRepository
import com.ptcompanion.domain.repository.CheckInRepository
import com.ptcompanion.domain.repository.TrainerRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.filterNotNull
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.temporal.TemporalAdjusters
import java.util.UUID
import javax.inject.Inject

data class CheckInServerState(
    val isLoading: Boolean = true,
    val alreadySubmittedThisWeek: Boolean = false,
    val recentCheckIns: List<CheckIn> = emptyList(),
)

data class CheckInFormState(
    val energyLevel: Int = 3,
    val sorenessLevel: Int = 3,
    val stickingToPlan: Boolean = true,
    val note: String = "",
    val isSubmitting: Boolean = false,
    val submitted: Boolean = false,
)

data class CheckInUiState(
    val isLoading: Boolean = true,
    val alreadySubmittedThisWeek: Boolean = false,
    val recentCheckIns: List<CheckIn> = emptyList(),
    val energyLevel: Int = 3,
    val sorenessLevel: Int = 3,
    val stickingToPlan: Boolean = true,
    val note: String = "",
    val isSubmitting: Boolean = false,
    val submitted: Boolean = false,
)

@HiltViewModel
class CheckInViewModel @Inject constructor(
    authRepository: AuthRepository,
    trainerRepository: TrainerRepository,
    private val checkInRepository: CheckInRepository,
) : ViewModel() {

    private val formState = MutableStateFlow(CheckInFormState())
    private val clientIdFlow = authRepository.currentSession.map { it?.uid }.filterNotNull()
    private lateinit var trainerId: String
    private lateinit var clientUserId: String

    private val serverState: StateFlow<CheckInServerState> = clientIdFlow.flatMapLatest { uid ->
        clientUserId = uid
        trainerRepository.observeSelf(uid).filterNotNull().flatMapLatest { self ->
            trainerId = self.trainerId
            val startOfWeek = LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
            checkInRepository.observeCheckIns(self.trainerId, uid).map { checkIns ->
                CheckInServerState(
                    isLoading = false,
                    alreadySubmittedThisWeek = checkIns.any { !it.weekOf.isBefore(startOfWeek) },
                    recentCheckIns = checkIns.sortedByDescending { it.weekOf }.take(6),
                )
            }
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), CheckInServerState())

    val uiState: StateFlow<CheckInUiState> = combine(serverState, formState) { server, form ->
        CheckInUiState(
            isLoading = server.isLoading,
            alreadySubmittedThisWeek = server.alreadySubmittedThisWeek,
            recentCheckIns = server.recentCheckIns,
            energyLevel = form.energyLevel,
            sorenessLevel = form.sorenessLevel,
            stickingToPlan = form.stickingToPlan,
            note = form.note,
            isSubmitting = form.isSubmitting,
            submitted = form.submitted,
        )
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), CheckInUiState())

    fun onEnergyChange(value: Int) { formState.value = formState.value.copy(energyLevel = value) }
    fun onSorenessChange(value: Int) { formState.value = formState.value.copy(sorenessLevel = value) }
    fun onStickingToPlanChange(value: Boolean) { formState.value = formState.value.copy(stickingToPlan = value) }
    fun onNoteChange(value: String) { formState.value = formState.value.copy(note = value) }

    fun submit() {
        val form = formState.value
        viewModelScope.launch {
            formState.value = form.copy(isSubmitting = true)
            val startOfWeek = LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
            checkInRepository.submitCheckIn(
                CheckIn(
                    checkInId = UUID.randomUUID().toString(),
                    trainerId = trainerId,
                    clientUserId = clientUserId,
                    weekOf = startOfWeek,
                    energyLevel = form.energyLevel,
                    sorenessLevel = form.sorenessLevel,
                    stickingToPlan = form.stickingToPlan,
                    note = form.note.ifBlank { null },
                ),
            )
            formState.value = formState.value.copy(isSubmitting = false, submitted = true)
        }
    }
}
