package com.ptcompanion.ui.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Assignment
import androidx.compose.material.icons.filled.FitnessCenter
import androidx.compose.material.icons.filled.ShowChart
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.ptcompanion.ui.client.checkin.CheckInScreen
import com.ptcompanion.ui.client.progress.ProgressScreen
import com.ptcompanion.ui.client.today.TodayScreen

private data class ClientTab(val route: String, val label: String, val icon: androidx.compose.ui.graphics.vector.ImageVector)

private val clientTabs = listOf(
    ClientTab(Routes.CLIENT_TODAY, "Today", Icons.Filled.FitnessCenter),
    ClientTab(Routes.CLIENT_PROGRESS, "Progress", Icons.Filled.ShowChart),
    ClientTab(Routes.CLIENT_CHECK_IN, "Check-in", Icons.Filled.Assignment),
)

@Composable
fun ClientNavGraph() {
    val navController: NavHostController = rememberNavController()

    Scaffold(
        bottomBar = {
            val backStackEntry by navController.currentBackStackEntryAsState()
            val currentDestination = backStackEntry?.destination
            NavigationBar {
                clientTabs.forEach { tab ->
                    NavigationBarItem(
                        selected = currentDestination?.hierarchy?.any { it.route == tab.route } == true,
                        onClick = {
                            navController.navigate(tab.route) {
                                popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                                launchSingleTop = true
                                restoreState = true
                            }
                        },
                        icon = { Icon(tab.icon, contentDescription = tab.label) },
                        label = { Text(tab.label) },
                    )
                }
            }
        },
    ) { padding ->
        NavHost(
            navController = navController,
            startDestination = Routes.CLIENT_TODAY,
            modifier = Modifier.padding(padding),
        ) {
            composable(Routes.CLIENT_TODAY) { TodayScreen() }
            composable(Routes.CLIENT_PROGRESS) { ProgressScreen() }
            composable(Routes.CLIENT_CHECK_IN) { CheckInScreen() }
        }
    }
}
