package com.ptcompanion.ui.trainer.program

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ptcompanion.domain.model.ExerciseLibraryItem
import com.ptcompanion.domain.model.Program
import com.ptcompanion.domain.model.ProgramDay
import com.ptcompanion.domain.model.ProgramExercise
import com.ptcompanion.domain.model.ProgramWeek
import com.ptcompanion.domain.repository.AuthRepository
import com.ptcompanion.domain.repository.ProgramRepository
import com.ptcompanion.ui.navigation.Routes
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.launch
import java.util.UUID
import javax.inject.Inject

data class ProgramBuilderUiState(
    val program: Program = Program(programId = "", trainerId = "", name = "New Program", isTemplate = true),
    val exerciseLibrary: List<ExerciseLibraryItem> = emptyList(),
    val isSaving: Boolean = false,
    val savedSuccessfully: Boolean = false,
)

@HiltViewModel
class ProgramBuilderViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val authRepository: AuthRepository,
    private val programRepository: ProgramRepository,
) : ViewModel() {

    private val templateId: String = checkNotNull(savedStateHandle["templateId"])
    private val _uiState = MutableStateFlow(ProgramBuilderUiState())
    val uiState: StateFlow<ProgramBuilderUiState> = _uiState

    init {
        viewModelScope.launch {
            programRepository.observeExerciseLibrary().collect { items ->
                _uiState.value = _uiState.value.copy(exerciseLibrary = items)
            }
        }
        if (templateId != Routes.NEW_TEMPLATE_ID) {
            viewModelScope.launch {
                val existing = programRepository.getProgramById(templateId)
                if (existing != null) _uiState.value = _uiState.value.copy(program = existing)
            }
        } else {
            viewModelScope.launch {
                val trainerId = authRepository.currentSession.map { it?.uid }.first { it != null }!!
                _uiState.value = _uiState.value.copy(
                    program = _uiState.value.program.copy(programId = UUID.randomUUID().toString(), trainerId = trainerId),
                )
            }
        }
    }

    fun renameProgram(name: String) {
        updateProgram { it.copy(name = name) }
    }

    fun addWeek() {
        updateProgram { program ->
            val newWeek = ProgramWeek(weekId = UUID.randomUUID().toString(), index = program.weeks.size)
            program.copy(weeks = program.weeks + newWeek)
        }
    }

    fun addDay(weekId: String) {
        updateProgram { program ->
            program.copy(
                weeks = program.weeks.map { week ->
                    if (week.weekId != weekId) return@map week
                    val newDay = ProgramDay(
                        dayId = UUID.randomUUID().toString(),
                        index = week.days.size,
                        label = "Day ${week.days.size + 1}",
                    )
                    week.copy(days = week.days + newDay)
                },
            )
        }
    }

    fun addExercise(weekId: String, dayId: String, libraryItem: ExerciseLibraryItem) {
        updateProgram { program ->
            program.copy(
                weeks = program.weeks.map { week ->
                    if (week.weekId != weekId) return@map week
                    week.copy(
                        days = week.days.map { day ->
                            if (day.dayId != dayId) return@map day
                            val newExercise = ProgramExercise(
                                exerciseId = libraryItem.exerciseId,
                                exerciseName = libraryItem.name,
                                orderIndex = day.exercises.size,
                                sets = 3,
                                reps = "8-10",
                            )
                            day.copy(exercises = day.exercises + newExercise)
                        },
                    )
                },
            )
        }
    }

    fun updateExercise(weekId: String, dayId: String, exerciseId: String, transform: (ProgramExercise) -> ProgramExercise) {
        updateProgram { program ->
            program.copy(
                weeks = program.weeks.map { week ->
                    if (week.weekId != weekId) return@map week
                    week.copy(
                        days = week.days.map { day ->
                            if (day.dayId != dayId) return@map day
                            day.copy(
                                exercises = day.exercises.map { ex -> if (ex.exerciseId == exerciseId) transform(ex) else ex },
                            )
                        },
                    )
                },
            )
        }
    }

    private fun updateProgram(transform: (Program) -> Program) {
        _uiState.value = _uiState.value.copy(program = transform(_uiState.value.program))
    }

    fun save(onSaved: () -> Unit) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSaving = true)
            programRepository.saveTemplate(_uiState.value.program).onSuccess {
                _uiState.value = _uiState.value.copy(isSaving = false, savedSuccessfully = true)
                onSaved()
            }.onFailure {
                _uiState.value = _uiState.value.copy(isSaving = false)
            }
        }
    }
}
