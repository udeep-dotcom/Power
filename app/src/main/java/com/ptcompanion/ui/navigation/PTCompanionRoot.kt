package com.ptcompanion.ui.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.hilt.navigation.compose.hiltViewModel
import com.ptcompanion.domain.model.UserRole
import com.ptcompanion.ui.auth.AuthSessionViewModel
import com.ptcompanion.ui.auth.AuthUiState
import com.ptcompanion.ui.common.FullScreenLoading

@Composable
fun PTCompanionRoot(sessionViewModel: AuthSessionViewModel = hiltViewModel()) {
    val state by sessionViewModel.uiState.collectAsState()

    when (val current = state) {
        is AuthUiState.Loading -> FullScreenLoading()
        is AuthUiState.SignedOut -> AuthNavGraph()
        is AuthUiState.SignedIn -> when (current.session.role) {
            UserRole.TRAINER -> TrainerNavGraph()
            UserRole.CLIENT -> ClientNavGraph()
        }
    }
}
