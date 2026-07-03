package com.ptcompanion.data.remote

import com.google.firebase.firestore.DocumentReference
import com.google.firebase.firestore.DocumentSnapshot
import com.google.firebase.firestore.Query
import com.google.firebase.firestore.QuerySnapshot
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow

/**
 * Wraps a Firestore realtime listener as a cold [Flow]. Firestore's Android SDK has disk
 * persistence enabled by default, so this keeps working (from cache) while offline and
 * catches up automatically once connectivity returns.
 */
fun DocumentReference.observeAsFlow(): Flow<DocumentSnapshot?> = callbackFlow {
    val registration = addSnapshotListener { snapshot, error ->
        if (error != null) {
            close(error)
        } else {
            trySend(snapshot)
        }
    }
    awaitClose { registration.remove() }
}

fun Query.observeAsFlow(): Flow<QuerySnapshot> = callbackFlow {
    val registration = addSnapshotListener { snapshot, error ->
        if (error != null) {
            close(error)
        } else if (snapshot != null) {
            trySend(snapshot)
        }
    }
    awaitClose { registration.remove() }
}
