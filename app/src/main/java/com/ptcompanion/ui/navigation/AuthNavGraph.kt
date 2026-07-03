package com.ptcompanion.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.ptcompanion.ui.auth.ClientJoinScreen
import com.ptcompanion.ui.auth.SignInScreen
import com.ptcompanion.ui.auth.TrainerSignUpScreen
import com.ptcompanion.ui.auth.WelcomeScreen

@Composable
fun AuthNavGraph() {
    val navController: NavHostController = rememberNavController()

    NavHost(navController = navController, startDestination = Routes.WELCOME) {
        composable(Routes.WELCOME) {
            WelcomeScreen(
                onTrainerSignUp = { navController.navigate(Routes.TRAINER_SIGN_UP) },
                onClientJoin = { navController.navigate(Routes.CLIENT_JOIN) },
                onSignIn = { navController.navigate(Routes.SIGN_IN) },
            )
        }
        composable(Routes.TRAINER_SIGN_UP) {
            TrainerSignUpScreen(
                onBack = { navController.popBackStack() },
                onSignedUp = { /* auth state change re-routes to TrainerNavGraph automatically */ },
            )
        }
        composable(Routes.SIGN_IN) {
            SignInScreen(
                onBack = { navController.popBackStack() },
                onSignedIn = { /* auth state change re-routes automatically */ },
            )
        }
        composable(Routes.CLIENT_JOIN) {
            ClientJoinScreen(
                onBack = { navController.popBackStack() },
                onJoined = { /* auth state change re-routes automatically */ },
            )
        }
    }
}
