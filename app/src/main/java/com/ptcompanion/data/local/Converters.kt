package com.ptcompanion.data.local

import androidx.room.TypeConverter
import com.ptcompanion.domain.model.LoggedExercise
import com.ptcompanion.domain.model.ProgramWeek
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.time.Instant
import java.time.LocalDate

private val json = Json { ignoreUnknownKeys = true }

class Converters {
    @TypeConverter
    fun instantToEpochMillis(value: Instant?): Long? = value?.toEpochMilli()

    @TypeConverter
    fun epochMillisToInstant(value: Long?): Instant? = value?.let(Instant::ofEpochMilli)

    @TypeConverter
    fun localDateToIso(value: LocalDate?): String? = value?.toString()

    @TypeConverter
    fun isoToLocalDate(value: String?): LocalDate? = value?.let(LocalDate::parse)

    @TypeConverter
    fun programWeeksToJson(value: List<ProgramWeek>?): String = json.encodeToString(value ?: emptyList())

    @TypeConverter
    fun jsonToProgramWeeks(value: String?): List<ProgramWeek> =
        value?.takeIf { it.isNotBlank() }?.let { json.decodeFromString(it) } ?: emptyList()

    @TypeConverter
    fun loggedExercisesToJson(value: List<LoggedExercise>?): String = json.encodeToString(value ?: emptyList())

    @TypeConverter
    fun jsonToLoggedExercises(value: String?): List<LoggedExercise> =
        value?.takeIf { it.isNotBlank() }?.let { json.decodeFromString(it) } ?: emptyList()
}
