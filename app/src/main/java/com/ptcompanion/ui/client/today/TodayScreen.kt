package com.ptcompanion.ui.client.today

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.RadioButtonUnchecked
import androidx.compose.material.icons.filled.SelfImprovement
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.ptcompanion.domain.model.LoggedExercise
import com.ptcompanion.domain.model.LoggedSet
import com.ptcompanion.domain.model.SessionStatus
import com.ptcompanion.ui.common.EmptyState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TodayScreen(viewModel: TodayViewModel = hiltViewModel()) {
    val state by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = { TopAppBar(title = { Text(state.clientDisplayName?.let { "Hi, ${it.substringBefore(' ')}" } ?: "Today") }) },
    ) { padding ->
        val session = state.session
        when {
            state.isLoading -> {}
            !state.hasActiveProgram -> {
                EmptyState(
                    icon = Icons.Filled.SelfImprovement,
                    title = "No program yet",
                    body = "Your trainer hasn't assigned a program yet. Check back soon, or reach out to them directly.",
                    modifier = Modifier.padding(padding),
                )
            }
            session == null -> {
                EmptyState(
                    icon = Icons.Filled.SelfImprovement,
                    title = "Setting up today's workout...",
                    body = "This will just take a moment.",
                    modifier = Modifier.padding(padding),
                )
            }
            else -> {
                LazyColumn(
                    modifier = Modifier.fillMaxSize().padding(padding),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    item {
                        Text(session.dayLabel, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                    }
                    items(session.exercises, key = { it.exerciseId }) { exercise ->
                        ExerciseCard(
                            exercise = exercise,
                            onLogSet = { setIndex, reps, weight ->
                                viewModel.logSet(session.sessionId, exercise.exerciseId, setIndex, reps, weight, null)
                            },
                        )
                    }
                    item {
                        Button(
                            onClick = viewModel::completeSession,
                            enabled = session.status != SessionStatus.COMPLETED,
                            modifier = Modifier.fillMaxWidth(),
                        ) {
                            Text(if (session.status == SessionStatus.COMPLETED) "Session complete" else "Mark session complete")
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ExerciseCard(exercise: LoggedExercise, onLogSet: (Int, Int?, Double?) -> Unit) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(Modifier.padding(12.dp)) {
            Text(exercise.exerciseName, style = MaterialTheme.typography.titleMedium)
            Spacer(Modifier.padding(top = 4.dp))
            exercise.sets.forEach { set -> SetRow(set = set, onLog = { reps, weight -> onLogSet(set.setIndex, reps, weight) }) }
        }
    }
}

@Composable
private fun SetRow(set: LoggedSet, onLog: (Int?, Double?) -> Unit) {
    var reps by remember(set.setIndex) { mutableStateOf(set.actualReps?.toString() ?: set.targetReps.orEmpty().takeWhile { it.isDigit() }) }
    var weight by remember(set.setIndex) { mutableStateOf(set.actualWeightKg?.toString() ?: "") }

    Row(
        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text("Set ${set.setIndex + 1}", modifier = Modifier.width(56.dp), style = MaterialTheme.typography.bodyMedium)
        OutlinedTextField(
            value = weight,
            onValueChange = { weight = it },
            label = { Text("kg") },
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
            modifier = Modifier.width(80.dp),
        )
        Spacer(Modifier.padding(start = 8.dp))
        OutlinedTextField(
            value = reps,
            onValueChange = { reps = it },
            label = { Text("reps") },
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            modifier = Modifier.width(72.dp),
        )
        Spacer(Modifier.weight(1f))
        // The single tap that logs a set: uses whatever is currently in the fields
        // (prefilled with the prescribed weight/reps), so hitting your target is one tap.
        IconButton(onClick = { onLog(reps.toIntOrNull(), weight.toDoubleOrNull()) }) {
            Icon(
                imageVector = if (set.completed) Icons.Filled.CheckCircle else Icons.Filled.RadioButtonUnchecked,
                contentDescription = "Log set",
                tint = if (set.completed) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}
