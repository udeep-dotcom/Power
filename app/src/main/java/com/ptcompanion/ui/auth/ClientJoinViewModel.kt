package com.ptcompanion.ui.auth

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ptcompanion.domain.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ClientJoinFormState(
    val displayName: String = "",
    val email: String = "",
    val password: String = "",
    val inviteCode: String = "",
    val isSubmitting: Boolean = false,
    val errorMessage: String? = null,
)

@HiltViewModel
class ClientJoinViewModel @Inject constructor(
    private val authRepository: AuthRepository,
) : ViewModel() {

    var state by mutableStateOf(ClientJoinFormState())
        private set

    fun onDisplayNameChange(value: String) { state = state.copy(displayName = value) }
    fun onEmailChange(value: String) { state = state.copy(email = value) }
    fun onPasswordChange(value: String) { state = state.copy(password = value) }
    fun onInviteCodeChange(value: String) { state = state.copy(inviteCode = value.uppercase()) }

    fun submit(onSuccess: () -> Unit) {
        if (state.displayName.isBlank() || state.email.isBlank() || state.password.length < 6 || state.inviteCode.isBlank()) {
            state = state.copy(errorMessage = "Fill in every field, including the invite code from your trainer.")
            return
        }
        state = state.copy(isSubmitting = true, errorMessage = null)
        viewModelScope.launch {
            val result = authRepository.signUpClient(
                state.email.trim(),
                state.password,
                state.displayName.trim(),
                state.inviteCode.trim(),
            )
            state = state.copy(isSubmitting = false)
            result.onSuccess { onSuccess() }
                .onFailure { state = state.copy(errorMessage = it.message ?: "Couldn't join with that invite code") }
        }
    }
}
