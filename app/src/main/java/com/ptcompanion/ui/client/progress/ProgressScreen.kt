package com.ptcompanion.ui.client.progress

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Card
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.ptcompanion.domain.model.LiftTrendPoint
import androidx.hilt.navigation.compose.hiltViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProgressScreen(viewModel: ProgressViewModel = hiltViewModel()) {
    val state by viewModel.uiState.collectAsState()
    var showLogWeightDialog by remember { mutableStateOf(false) }

    Scaffold(
        topBar = { TopAppBar(title = { Text("Progress") }) },
        floatingActionButton = {
            FloatingActionButton(onClick = { showLogWeightDialog = true }) {
                Icon(Icons.Filled.Add, contentDescription = "Log body weight")
            }
        },
    ) { padding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            item {
                Text("Adherence, last 8 weeks", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                Spacer(Modifier.padding(top = 8.dp))
                AdherenceBars(state.adherenceTrend.map { it.completed to it.scheduled })
            }

            if (state.availableExercises.isNotEmpty()) {
                item {
                    Text("Weight lifted over time", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                    Spacer(Modifier.padding(top = 8.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        state.availableExercises.take(6).forEach { (id, name) ->
                            FilterChip(
                                selected = state.selectedExerciseId == id,
                                onClick = { viewModel.selectExercise(id) },
                                label = { Text(name) },
                            )
                        }
                    }
                    Spacer(Modifier.padding(top = 8.dp))
                    LiftTrendChart(points = state.liftTrend)
                }
            }

            item {
                Text("Body weight", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
            }
            items(state.bodyMeasurements, key = { it.entryId }) { entry ->
                Card(modifier = Modifier.fillMaxWidth()) {
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                    ) {
                        Text(entry.date.toString())
                        Text("${entry.weightKg ?: "-"} kg")
                    }
                }
            }
        }
    }

    if (showLogWeightDialog) {
        LogBodyWeightDialog(
            onDismiss = { showLogWeightDialog = false },
            onConfirm = { weight ->
                viewModel.logBodyWeight(weight)
                showLogWeightDialog = false
            },
        )
    }
}

@Composable
private fun AdherenceBars(weeks: List<Pair<Int, Int>>) {
    if (weeks.isEmpty()) {
        Text("No sessions logged yet.", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        return
    }
    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
        weeks.forEach { (completed, scheduled) ->
            val ratio = if (scheduled == 0) 0f else completed.toFloat() / scheduled
            Column(horizontalAlignment = androidx.compose.ui.Alignment.CenterHorizontally) {
                androidx.compose.foundation.layout.Box(
                    modifier = Modifier
                        .width(18.dp)
                        .height((80 * ratio.coerceIn(0.05f, 1f)).dp)
                        .background(
                            MaterialTheme.colorScheme.primary,
                            MaterialTheme.shapes.extraSmall,
                        ),
                )
            }
        }
    }
}

@Composable
private fun LiftTrendChart(points: List<LiftTrendPoint>) {
    if (points.isEmpty()) {
        Text("No sets logged for this lift yet.", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        return
    }
    val lineColor = MaterialTheme.colorScheme.primary
    Canvas(modifier = Modifier.fillMaxWidth().height(140.dp).padding(vertical = 8.dp)) {
        val maxWeight = points.maxOf { it.topWeightKg }.coerceAtLeast(1.0)
        val minWeight = points.minOf { it.topWeightKg }
        val range = (maxWeight - minWeight).coerceAtLeast(1.0)
        val stepX = if (points.size > 1) size.width / (points.size - 1) else 0f

        val path = androidx.compose.ui.graphics.Path()
        points.forEachIndexed { index, point ->
            val x = stepX * index
            val normalized = ((point.topWeightKg - minWeight) / range).toFloat()
            val y = size.height - (normalized * size.height)
            if (index == 0) path.moveTo(x, y) else path.lineTo(x, y)
            drawCircle(color = lineColor, radius = 5f, center = Offset(x, y))
        }
        drawPath(path, color = lineColor, style = androidx.compose.ui.graphics.drawscope.Stroke(width = 4f, cap = StrokeCap.Round))
    }
}

@Composable
private fun LogBodyWeightDialog(onDismiss: () -> Unit, onConfirm: (Double) -> Unit) {
    var value by remember { mutableStateOf("") }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Log body weight") },
        text = {
            OutlinedTextField(
                value = value,
                onValueChange = { value = it },
                label = { Text("Weight (kg)") },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
            )
        },
        confirmButton = {
            TextButton(onClick = { value.toDoubleOrNull()?.let(onConfirm) }) { Text("Save") }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancel") }
        },
    )
}
