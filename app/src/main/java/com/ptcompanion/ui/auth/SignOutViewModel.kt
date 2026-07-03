package com.ptcompanion.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ptcompanion.domain.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.launch
import javax.inject.Inject

/** Shared by both the trainer and client nav graphs so their top bars can offer sign-out. */
@HiltViewModel
class SignOutViewModel @Inject constructor(
    private val authRepository: AuthRepository,
) : ViewModel() {
    fun signOut() {
        viewModelScope.launch { authRepository.signOut() }
    }
}
