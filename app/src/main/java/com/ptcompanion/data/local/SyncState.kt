package com.ptcompanion.data.local

/**
 * Tracks whether a locally-written row has made it to Firestore yet. Every table that a
 * client can write to while offline (sessions, check-ins, measurements) carries this so
 * [com.ptcompanion.data.sync.SyncWorker] knows what to push once connectivity returns.
 */
enum class SyncState {
    SYNCED,
    PENDING_PUSH,
}
