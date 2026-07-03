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

data class SignInFormState(
    val email: String = "",
    val password: String = "",
    val isSubmitting: Boolean = false,
    val errorMessage: String? = null,
)

@HiltViewModel
class SignInViewModel @Inject constructor(
    private val authRepository: AuthRepository,
) : ViewModel() {

    var state by mutableStateOf(SignInFormState())
        private set

    fun onEmailChange(value: String) { state = state.copy(email = value) }
    fun onPasswordChange(value: String) { state = state.copy(password = value) }

    fun submit(onSuccess: () -> Unit) {
        if (state.email.isBlank() || state.password.isBlank()) {
            state = state.copy(errorMessage = "Enter your email and password.")
            return
        }
        state = state.copy(isSubmitting = true, errorMessage = null)
        viewModelScope.launch {
            val result = authRepository.signInWithEmail(state.email.trim(), state.password)
            state = state.copy(isSubmitting = false)
            result.onSuccess { onSuccess() }
                .onFailure { state = state.copy(errorMessage = it.message ?: "Sign-in failed") }
        }
    }

    fun continueWithGoogle(idToken: String, onSuccess: () -> Unit) {
        state = state.copy(isSubmitting = true, errorMessage = null)
        viewModelScope.launch {
            val result = authRepository.continueWithGoogle(idToken, fallbackDisplayName = null)
            state = state.copy(isSubmitting = false)
            result.onSuccess { onSuccess() }
                .onFailure { state = state.copy(errorMessage = it.message ?: "Google sign-in failed") }
        }
    }
}
