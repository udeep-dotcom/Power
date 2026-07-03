package com.ptcompanion.ui.trainer.clientdetail

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
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Assignment
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.ptcompanion.domain.model.SessionStatus
import com.ptcompanion.domain.model.WorkoutSession
import com.ptcompanion.ui.common.EmptyState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ClientDetailScreen(
    onBack: () -> Unit,
    onBuildProgram: () -> Unit,
    viewModel: ClientDetailViewModel = hiltViewModel(),
) {
    val state by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(state.client?.displayName ?: "Client") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
            )
        },
    ) { padding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            item {
                if (state.activeProgram == null) {
                    Card(modifier = Modifier.fillMaxWidth()) {
                        Column(Modifier.padding(16.dp)) {
                            Text("No active program", style = MaterialTheme.typography.titleMedium)
                            Spacer(Modifier.padding(top = 4.dp))
                            Text(
                                "Build a program or assign an existing template to get this client started.",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                            Spacer(Modifier.padding(top = 12.dp))
                            Row {
                                Button(onClick = onBuildProgram) { Text("Build a program") }
                                if (state.templates.isNotEmpty()) {
                                    Spacer(Modifier.padding(start = 8.dp))
                                    Button(onClick = { viewModel.assignTemplate(state.templates.first().programId) }) {
                                        Text("Assign template")
                                    }
                                }
                            }
                        }
                    }
                } else {
                    Card(modifier = Modifier.fillMaxWidth()) {
                        Column(Modifier.padding(16.dp)) {
                            Text("Active program", style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.primary)
                            Text(state.activeProgram!!.name, style = MaterialTheme.typography.titleLarge)
                            Spacer(Modifier.padding(top = 4.dp))
                            Text(
                                "${state.activeProgram!!.weeks.size} week(s), " +
                                    "${state.activeProgram!!.weeks.sumOf { it.days.size }} day(s)",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                    }
                }
            }

            item { SectionHeader("Recent sessions") }
            if (state.recentSessions.isEmpty()) {
                item {
                    EmptyState(
                        icon = Icons.Filled.Assignment,
                        title = "No sessions logged yet",
                        body = "Once this client logs a workout, it'll show up here.",
                    )
                }
            } else {
                items(state.recentSessions, key = { it.sessionId }) { session -> SessionRow(session) }
            }

            item { SectionHeader("Weekly check-ins") }
            if (state.recentCheckIns.isEmpty()) {
                item {
                    Text(
                        "No check-ins submitted yet.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            } else {
                items(state.recentCheckIns, key = { it.checkInId }) { checkIn ->
                    Card(modifier = Modifier.fillMaxWidth()) {
                        Column(Modifier.padding(12.dp)) {
                            Text("Week of ${checkIn.weekOf}", style = MaterialTheme.typography.titleSmall)
                            Text(
                                "Energy ${checkIn.energyLevel}/5 · Soreness ${checkIn.sorenessLevel}/5 · " +
                                    if (checkIn.stickingToPlan) "Sticking to plan" else "Off plan",
                                style = MaterialTheme.typography.bodyMedium,
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun SectionHeader(title: String) {
    Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
}

@Composable
private fun SessionRow(session: WorkoutSession) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Column {
                Text(session.dayLabel, style = MaterialTheme.typography.titleSmall)
                Text(
                    session.scheduledDate.toString(),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            AssistChip(
                onClick = {},
                label = { Text(if (session.status == SessionStatus.COMPLETED) "Completed" else session.status.name) },
            )
        }
    }
}
