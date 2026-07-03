package com.ptcompanion.data.remote

/**
 * Flat top-level collection names and field names, kept in lockstep with
 * firestore/firestore.rules - every collection here is what the rules enforce against.
 */
object FirestoreSchema {
    const val TRAINERS = "trainers"
    const val CLIENTS = "clients"
    const val INVITE_CODES = "inviteCodes"
    const val PROGRAMS = "programs"
    const val SESSIONS = "sessions"
    const val CHECK_INS = "checkIns"
    const val BODY_MEASUREMENTS = "bodyMeasurements"
    const val EXERCISE_LIBRARY = "exerciseLibrary"

    const val FIELD_TRAINER_ID = "trainerId"
    const val FIELD_CLIENT_USER_ID = "clientUserId"
    const val FIELD_IS_TEMPLATE = "isTemplate"
    const val FIELD_SCHEDULED_DATE = "scheduledDate"
    const val FIELD_WEEK_OF = "weekOf"
    const val FIELD_DATE = "date"
    const val FIELD_UPDATED_AT = "updatedAt"
}
