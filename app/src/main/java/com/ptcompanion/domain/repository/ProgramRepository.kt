package com.ptcompanion.domain.repository

import com.ptcompanion.domain.model.ExerciseLibraryItem
import com.ptcompanion.domain.model.Program
import kotlinx.coroutines.flow.Flow

interface ProgramRepository {
    fun observeTemplates(trainerId: String): Flow<List<Program>>

    fun observeClientProgram(trainerId: String, clientUserId: String, programId: String): Flow<Program?>

    suspend fun getProgramById(programId: String): Program?

    fun observeActiveProgramForClient(trainerId: String, clientUserId: String): Flow<Program?>

    suspend fun saveTemplate(program: Program): Result<String>

    /** Clones [templateId] into a new client-bound Program and sets it as the client's active program. */
    suspend fun assignTemplateToClient(
        trainerId: String,
        templateId: String,
        clientUserId: String,
    ): Result<String>

    fun observeExerciseLibrary(): Flow<List<ExerciseLibraryItem>>
}
