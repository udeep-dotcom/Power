package com.ptcompanion.ui.auth

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.FitnessCenter
import androidx.compose.material3.Button
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun WelcomeScreen(
    onTrainerSignUp: () -> Unit,
    onClientJoin: () -> Unit,
    onSignIn: () -> Unit,
) {
    Scaffold { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
        ) {
            Icon(
                imageVector = Icons.Filled.FitnessCenter,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.padding(bottom = 16.dp),
            )
            Text("PT Companion", style = MaterialTheme.typography.displaySmall)
            Spacer(Modifier.padding(top = 8.dp))
            Text(
                "One app for you and your clients.",
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Spacer(Modifier.padding(top = 40.dp))
            Button(onClick = onTrainerSignUp, modifier = Modifier.fillMaxWidth()) {
                Text("I'm a trainer - create my roster")
            }
            Spacer(Modifier.padding(top = 12.dp))
            OutlinedButton(onClick = onClientJoin, modifier = Modifier.fillMaxWidth()) {
                Text("I'm a client - I have an invite code")
            }
            Spacer(Modifier.padding(top = 20.dp))
            TextButton(onClick = onSignIn) {
                Text("Already have an account? Sign in")
            }
        }
    }
}
