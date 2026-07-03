package com.ptcompanion.ui.trainer.roster

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ptcompanion.domain.model.ClientProfile
import com.ptcompanion.domain.model.ComplianceCalculator
import com.ptcompanion.domain.model.ComplianceStatus
import com.ptcompanion.domain.model.InviteCode
import com.ptcompanion.domain.model.SessionStatus
import com.ptcompanion.domain.model.Trainer
import com.ptcompanion.domain.repository.AuthRepository
import com.ptcompanion.domain.repository.SessionRepository
import com.ptcompanion.domain.repository.TrainerRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.filterNotNull
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.time.LocalDate
import javax.inject.Inject

data class RosterClientRow(val profile: ClientProfile, val compliance: ComplianceStatus)

data class RosterUiState(
    val isLoading: Boolean = true,
    val trainer: Trainer? = null,
    val clients: List<RosterClientRow> = emptyList(),
    val pendingInviteCodes: List<InviteCode> = emptyList(),
    val lastGeneratedCode: String? = null,
)

@HiltViewModel
class RosterViewModel @Inject constructor(
    authRepository: AuthRepository,
    private val trainerRepository: TrainerRepository,
    private val sessionRepository: SessionRepository,
) : ViewModel() {

    private val trainerIdFlow = authRepository.currentSession.map { it?.uid }.filterNotNull()
    private val lastGeneratedCode = MutableStateFlow<String?>(null)

    val uiState: StateFlow<RosterUiState> = trainerIdFlow.flatMapLatest { trainerId ->
        val trainerFlow = trainerRepository.observeTrainer(trainerId)
        val rosterFlow = trainerRepository.observeRoster(trainerId).flatMapLatest { clients ->
            if (clients.isEmpty()) {
                flowOf(emptyList())
            } else {
                combine(clients.map { client -> complianceRowFlow(trainerId, client) }) { it.toList() }
            }
        }
        val invitesFlow = trainerRepository.observeInviteCodes(trainerId).map { it.filter { c -> !c.used } }

        combine(trainerFlow, rosterFlow, invitesFlow, lastGeneratedCode) { trainer, roster, invites, code ->
            RosterUiState(isLoading = false, trainer = trainer, clients = roster, pendingInviteCodes = invites, lastGeneratedCode = code)
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), RosterUiState())

    private fun complianceRowFlow(trainerId: String, client: ClientProfile) =
        sessionRepository.observeSessionsForClient(trainerId, client.clientUserId).map { sessions ->
            val since = LocalDate.now().minusDays(7)
            val recent = sessions.filter { !it.scheduledDate.isBefore(since) && !it.scheduledDate.isAfter(LocalDate.now()) }
            val compliance = ComplianceCalculator.compute(
                scheduledInLast7Days = recent.size,
                completedInLast7Days = recent.count { it.status == SessionStatus.COMPLETED },
            )
            RosterClientRow(client, compliance)
        }

    fun generateInviteCode(clientDisplayName: String?) {
        viewModelScope.launch {
            val trainerId = trainerIdFlow.first()
            trainerRepository.generateInviteCode(trainerId, clientDisplayName).onSuccess {
                lastGeneratedCode.value = it.code
            }
        }
    }

    fun dismissGeneratedCode() {
        lastGeneratedCode.value = null
    }
}
