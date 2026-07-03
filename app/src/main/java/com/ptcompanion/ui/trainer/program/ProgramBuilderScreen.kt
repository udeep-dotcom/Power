package com.ptcompanion.ui.trainer.program

import androidx.compose.foundation.clickable
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
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.ListItem
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.AlertDialog
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.ptcompanion.domain.model.ExerciseLibraryItem
import com.ptcompanion.domain.model.ProgramDay
import com.ptcompanion.domain.model.ProgramExercise
import com.ptcompanion.domain.model.ProgramWeek

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProgramBuilderScreen(
    onBack: () -> Unit,
    viewModel: ProgramBuilderViewModel = hiltViewModel(),
) {
    val state by viewModel.uiState.collectAsState()
    var pickerTarget by remember { mutableStateOf<Pair<String, String>?>(null) } // weekId to dayId

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Program builder") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    TextButton(onClick = { viewModel.save(onBack) }, enabled = !state.isSaving) {
                        Text("Save")
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
                OutlinedTextField(
                    value = state.program.name,
                    onValueChange = viewModel::renameProgram,
                    label = { Text("Program name") },
                    modifier = Modifier.fillMaxWidth(),
                )
            }

            items(state.program.weeks, key = { it.weekId }) { week ->
                WeekCard(
                    week = week,
                    onAddDay = { viewModel.addDay(week.weekId) },
                    onAddExercise = { dayId -> pickerTarget = week.weekId to dayId },
                )
            }

            item {
                Button(onClick = viewModel::addWeek, modifier = Modifier.fillMaxWidth()) {
                    Icon(Icons.Filled.Add, contentDescription = null)
                    Spacer(Modifier.padding(start = 4.dp))
                    Text("Add week")
                }
            }
        }
    }

    val target = pickerTarget
    if (target != null) {
        ExercisePickerDialog(
            exercises = state.exerciseLibrary,
            onDismiss = { pickerTarget = null },
            onPick = { item ->
                viewModel.addExercise(target.first, target.second, item)
                pickerTarget = null
            },
        )
    }
}

@Composable
private fun WeekCard(week: ProgramWeek, onAddDay: () -> Unit, onAddExercise: (String) -> Unit) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(Modifier.padding(16.dp)) {
            Text("Week ${week.index + 1}", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
            Spacer(Modifier.padding(top = 8.dp))
            week.days.forEach { day -> DayRow(day = day, onAddExercise = { onAddExercise(day.dayId) }) }
            Spacer(Modifier.padding(top = 8.dp))
            TextButton(onClick = onAddDay) { Text("+ Add day") }
        }
    }
}

@Composable
private fun DayRow(day: ProgramDay, onAddExercise: () -> Unit) {
    Column(Modifier.padding(vertical = 6.dp)) {
        Text(day.label, style = MaterialTheme.typography.titleSmall)
        day.exercises.forEach { exercise -> ExerciseRow(exercise) }
        TextButton(onClick = onAddExercise) { Text("+ Add exercise") }
    }
}

@Composable
private fun ExerciseRow(exercise: ProgramExercise) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(vertical = 2.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Text(exercise.exerciseName, style = MaterialTheme.typography.bodyMedium)
        Text(
            "${exercise.sets} x ${exercise.reps}",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}

@Composable
private fun ExercisePickerDialog(
    exercises: List<ExerciseLibraryItem>,
    onDismiss: () -> Unit,
    onPick: (ExerciseLibraryItem) -> Unit,
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Add exercise") },
        text = {
            LazyColumn {
                items(exercises, key = { it.exerciseId }) { item ->
                    ListItem(
                        headlineContent = { Text(item.name) },
                        supportingContent = { Text(item.muscleGroup.name.lowercase().replaceFirstChar { it.uppercase() }) },
                        modifier = Modifier.fillMaxWidth().clickable { onPick(item) },
                    )
                    HorizontalDivider()
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) { Text("Close") }
        },
    )
}
