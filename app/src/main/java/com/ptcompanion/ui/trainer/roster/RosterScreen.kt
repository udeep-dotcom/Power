package com.ptcompanion.ui.trainer.roster

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Groups
import androidx.compose.material.icons.filled.Logout
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Card
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExtendedFloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.ptcompanion.ui.common.ComplianceChip
import com.ptcompanion.ui.common.ComplianceDot
import com.ptcompanion.ui.common.EmptyState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RosterScreen(
    onOpenClient: (String) -> Unit,
    onSignOut: () -> Unit,
    viewModel: RosterViewModel = hiltViewModel(),
) {
    val state by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(state.trainer?.displayName?.let { "Hi, ${it.substringBefore(' ')}" } ?: "Your roster") },
                actions = {
                    IconButton(onClick = onSignOut) {
                        Icon(Icons.Filled.Logout, contentDescription = "Sign out")
                    }
                },
            )
        },
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = { viewModel.generateInviteCode(null) },
                icon = { Icon(Icons.Filled.Add, contentDescription = null) },
                text = { Text("Invite client") },
            )
        },
    ) { padding ->
        if (!state.isLoading && state.clients.isEmpty()) {
            EmptyState(
                icon = Icons.Filled.Groups,
                title = "No clients yet",
                body = "Generate an invite code and share it with your first client. They'll enter it when they sign up, and land straight in your roster.",
                actionLabel = "Generate invite code",
                onAction = { viewModel.generateInviteCode(null) },
                modifier = Modifier.padding(padding),
            )
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize().padding(padding),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                if (state.pendingInviteCodes.isNotEmpty()) {
                    item {
                        Card(modifier = Modifier.fillMaxWidth()) {
                            Column(Modifier.padding(16.dp)) {
                                Text("Pending invites", style = MaterialTheme.typography.titleSmall)
                                Spacer(Modifier.padding(top = 4.dp))
                                state.pendingInviteCodes.forEach { invite ->
                                    Text(
                                        invite.code + (invite.clientDisplayName?.let { " - $it" } ?: ""),
                                        style = MaterialTheme.typography.bodyMedium,
                                    )
                                }
                            }
                        }
                    }
                }
                items(state.clients, key = { it.profile.clientUserId }) { row ->
                    ClientRosterCard(row = row, onClick = { onOpenClient(row.profile.clientUserId) })
                }
            }
        }
    }

    if (state.lastGeneratedCode != null) {
        AlertDialog(
            onDismissRequest = viewModel::dismissGeneratedCode,
            title = { Text("Invite code ready") },
            text = {
                Text(
                    "Share this code with your client. They'll enter it during sign-up:\n\n${state.lastGeneratedCode}",
                )
            },
            confirmButton = {
                TextButton(onClick = viewModel::dismissGeneratedCode) { Text("Done") }
            },
        )
    }
}

@Composable
private fun ClientRosterCard(row: RosterClientRow, onClick: () -> Unit) {
    Card(modifier = Modifier.fillMaxWidth(), onClick = onClick) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            ComplianceDot(status = row.compliance)
            Spacer(Modifier.padding(start = 12.dp))
            Column(Modifier.weight(1f)) {
                Text(row.profile.displayName, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Medium)
                Text(
                    row.profile.email,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            ComplianceChip(status = row.compliance)
        }
    }
}
