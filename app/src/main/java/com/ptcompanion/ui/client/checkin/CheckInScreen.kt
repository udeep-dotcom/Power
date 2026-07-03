package com.ptcompanion.ui.client.checkin

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Slider
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.rememberScrollState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.ptcompanion.ui.common.EmptyState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CheckInScreen(viewModel: CheckInViewModel = hiltViewModel()) {
    val state by viewModel.uiState.collectAsState()

    Scaffold(topBar = { TopAppBar(title = { Text("Weekly check-in") }) }) { padding ->
        if (state.alreadySubmittedThisWeek && !state.submitted) {
            EmptyState(
                icon = Icons.Filled.CheckCircle,
                title = "You're all set for this week",
                body = "Your trainer can see this week's check-in already. Come back next week for the next one.",
                modifier = Modifier.padding(padding),
            )
            return@Scaffold
        }
        if (state.submitted) {
            EmptyState(
                icon = Icons.Filled.CheckCircle,
                title = "Check-in submitted",
                body = "Thanks! Your trainer will see this on your profile.",
                modifier = Modifier.padding(padding),
            )
            return@Scaffold
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(24.dp),
        ) {
            Text("Energy this week", style = MaterialTheme.typography.titleMedium)
            Slider(
                value = state.energyLevel.toFloat(),
                onValueChange = { viewModel.onEnergyChange(it.toInt()) },
                valueRange = 1f..5f,
                steps = 3,
            )
            Text("${state.energyLevel}/5", style = MaterialTheme.typography.bodyMedium)

            Spacer(Modifier.padding(top = 20.dp))
            Text("Soreness this week", style = MaterialTheme.typography.titleMedium)
            Slider(
                value = state.sorenessLevel.toFloat(),
                onValueChange = { viewModel.onSorenessChange(it.toInt()) },
                valueRange = 1f..5f,
                steps = 3,
            )
            Text("${state.sorenessLevel}/5", style = MaterialTheme.typography.bodyMedium)

            Spacer(Modifier.padding(top = 20.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text("Stuck to the plan this week?", style = MaterialTheme.typography.titleMedium)
                Switch(checked = state.stickingToPlan, onCheckedChange = viewModel::onStickingToPlanChange)
            }

            Spacer(Modifier.padding(top = 20.dp))
            OutlinedTextField(
                value = state.note,
                onValueChange = viewModel::onNoteChange,
                label = { Text("Anything else? (optional)") },
                modifier = Modifier.fillMaxWidth(),
            )

            Spacer(Modifier.padding(top = 28.dp))
            Button(onClick = viewModel::submit, enabled = !state.isSubmitting, modifier = Modifier.fillMaxWidth()) {
                Text("Submit check-in")
            }
        }
    }
}
