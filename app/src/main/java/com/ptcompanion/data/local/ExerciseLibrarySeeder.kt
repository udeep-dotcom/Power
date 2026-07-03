package com.ptcompanion.data.local

import android.content.Context
import com.ptcompanion.data.local.dao.ExerciseLibraryDao
import com.ptcompanion.data.local.entity.ExerciseLibraryEntity
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.json.Json
import javax.inject.Inject
import javax.inject.Singleton

@Serializable
private data class ExerciseSeedItem(
    val exerciseId: String,
    val name: String,
    val muscleGroup: String,
    val equipment: String? = null,
)

/**
 * Seeds the ~50-movement exercise library into Room from the bundled asset on first run,
 * so it's available offline immediately with no network round trip.
 */
@Singleton
class ExerciseLibrarySeeder @Inject constructor(
    @ApplicationContext private val context: Context,
    private val dao: ExerciseLibraryDao,
) {
    suspend fun seedIfEmpty() {
        if (dao.count() > 0) return
        val json = context.assets.open("exercise_library_seed.json").bufferedReader().use { it.readText() }
        val items: List<ExerciseSeedItem> = Json { ignoreUnknownKeys = true }.decodeFromString(json)
        dao.upsertAll(
            items.map { ExerciseLibraryEntity(it.exerciseId, it.name, it.muscleGroup, it.equipment) },
        )
    }
}
