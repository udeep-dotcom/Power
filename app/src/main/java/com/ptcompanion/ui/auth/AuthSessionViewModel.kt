package com.ptcompanion.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ptcompanion.domain.repository.AuthRepository
import com.ptcompanion.domain.repository.Session
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import javax.inject.Inject

sealed interface AuthUiState {
    data object Loading : AuthUiState
    data object SignedOut : AuthUiState
    data class SignedIn(val session: Session) : AuthUiState
}

/** Drives top-level routing: which nav graph (auth / trainer / client) is shown. */
@HiltViewModel
class AuthSessionViewModel @Inject constructor(
    authRepository: AuthRepository,
) : ViewModel() {

    val uiState: StateFlow<AuthUiState> = authRepository.currentSession
        .map<Session?, AuthUiState> { session -> if (session == null) AuthUiState.SignedOut else AuthUiState.SignedIn(session) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), AuthUiState.Loading)
}
