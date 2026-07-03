package com.ptcompanion.data.remote.dto

data class ExerciseLibraryDto @JvmOverloads constructor(
    var exerciseId: String = "",
    var name: String = "",
    var muscleGroup: String = "FULL_BODY",
    var equipment: String? = null,
)
