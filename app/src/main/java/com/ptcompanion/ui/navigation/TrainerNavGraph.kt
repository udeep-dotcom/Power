package com.ptcompanion.ui.navigation

import androidx.compose.runtime.Composable
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.ptcompanion.ui.auth.SignOutViewModel
import com.ptcompanion.ui.trainer.clientdetail.ClientDetailScreen
import com.ptcompanion.ui.trainer.program.ProgramBuilderScreen
import com.ptcompanion.ui.trainer.roster.RosterScreen

@Composable
fun TrainerNavGraph() {
    val navController: NavHostController = rememberNavController()

    NavHost(navController = navController, startDestination = Routes.TRAINER_ROSTER) {
        composable(Routes.TRAINER_ROSTER) {
            val signOutViewModel: SignOutViewModel = hiltViewModel()
            RosterScreen(
                onOpenClient = { clientUserId -> navController.navigate(Routes.trainerClientDetail(clientUserId)) },
                onSignOut = signOutViewModel::signOut,
            )
        }
        composable(Routes.TRAINER_CLIENT_DETAIL) {
            ClientDetailScreen(
                onBack = { navController.popBackStack() },
                onBuildProgram = { navController.navigate(Routes.trainerProgramBuilder()) },
            )
        }
        composable(Routes.TRAINER_PROGRAM_BUILDER) {
            ProgramBuilderScreen(onBack = { navController.popBackStack() })
        }
    }
}
