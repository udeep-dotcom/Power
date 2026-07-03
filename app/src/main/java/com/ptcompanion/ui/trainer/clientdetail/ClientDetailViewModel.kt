package com.ptcompanion.ui.trainer.clientdetail

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ptcompanion.domain.model.CheckIn
import com.ptcompanion.domain.model.ClientProfile
import com.ptcompanion.domain.model.Program
import com.ptcompanion.domain.model.WorkoutSession
import com.ptcompanion.domain.repository.AuthRepository
import com.ptcompanion.domain.repository.CheckInRepository
import com.ptcompanion.domain.repository.ProgramRepository
import com.ptcompanion.domain.repository.SessionRepository
import com.ptcompanion.domain.repository.TrainerRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.filterNotNull
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ClientDetailUiState(
    val isLoading: Boolean = true,
    val client: ClientProfile? = null,
    val activeProgram: Program? = null,
    val recentSessions: List<WorkoutSession> = emptyList(),
    val recentCheckIns: List<CheckIn> = emptyList(),
    val templates: List<Program> = emptyList(),
)

@HiltViewModel
class ClientDetailViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    authRepository: AuthRepository,
    private val trainerRepository: TrainerRepository,
    private val programRepository: ProgramRepository,
    private val sessionRepository: SessionRepository,
    private val checkInRepository: CheckInRepository,
) : ViewModel() {

    private val clientUserId: String = checkNotNull(savedStateHandle["clientUserId"])
    private val trainerIdFlow = authRepository.currentSession.map { it?.uid }.filterNotNull()

    val uiState: StateFlow<ClientDetailUiState> = trainerIdFlow.flatMapLatest { trainerId ->
        combine(
            trainerRepository.observeClient(trainerId, clientUserId),
            programRepository.observeActiveProgramForClient(trainerId, clientUserId),
            sessionRepository.observeSessionsForClient(trainerId, clientUserId),
            checkInRepository.observeCheckIns(trainerId, clientUserId),
            programRepository.observeTemplates(trainerId),
        ) { client, activeProgram, sessions, checkIns, templates ->
            ClientDetailUiState(
                isLoading = false,
                client = client,
                activeProgram = activeProgram,
                recentSessions = sessions.sortedByDescending { it.scheduledDate }.take(10),
                recentCheckIns = checkIns.sortedByDescending { it.weekOf }.take(5),
                templates = templates,
            )
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), ClientDetailUiState())

    fun assignTemplate(templateId: String) {
        viewModelScope.launch {
            val trainerId = trainerIdFlow.first()
            programRepository.assignTemplateToClient(trainerId, templateId, clientUserId)
        }
    }
}
