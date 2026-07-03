package com.ptcompanion.ui.auth

import android.content.Context
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.credentials.CredentialManager
import androidx.credentials.GetCredentialRequest
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.ptcompanion.R
import kotlinx.coroutines.launch

/**
 * Requests a Google ID token via Credential Manager (the current recommended API, replacing
 * the legacy GoogleSignInClient). [R.string.default_web_client_id] is generated automatically
 * by the google-services Gradle plugin from the Web OAuth client entry in google-services.json
 * - see app/google-services.json.example for the expected shape. Until a real
 * google-services.json with that entry is present, this call will fail to resolve the
 * resource; that's expected in this sandbox project and documented in the README.
 */
private suspend fun requestGoogleIdToken(context: Context): String {
    val option = GetGoogleIdOption.Builder()
        .setFilterByAuthorizedAccounts(false)
        .setServerClientId(context.getString(R.string.default_web_client_id))
        .build()
    val request = GetCredentialRequest.Builder().addCredentialOption(option).build()
    val response = CredentialManager.create(context).getCredential(context, request)
    return GoogleIdTokenCredential.createFrom(response.credential.data).idToken
}

@Composable
fun GoogleSignInButton(
    label: String,
    onIdToken: suspend (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var error by remember { mutableStateOf<String?>(null) }

    Column(modifier = modifier) {
        OutlinedButton(
            onClick = {
                scope.launch {
                    error = null
                    runCatching { requestGoogleIdToken(context) }
                        .onSuccess { idToken -> onIdToken(idToken) }
                        .onFailure { error = it.message ?: "Google sign-in was cancelled or failed" }
                }
            },
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text(label)
        }
        if (error != null) {
            Text(error.orEmpty(), color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
        }
    }
}
