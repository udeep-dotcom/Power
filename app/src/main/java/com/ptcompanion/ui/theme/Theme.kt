package com.ptcompanion.ui.theme

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalContext

private val LightColors = lightColorScheme(
    primary = TealPrimaryLight,
    onPrimary = androidx.compose.ui.graphics.Color.White,
    primaryContainer = TealPrimaryContainerLight,
    onPrimaryContainer = TealOnPrimaryContainerLight,
    secondary = AmberSecondaryLight,
    onSecondary = androidx.compose.ui.graphics.Color.White,
    secondaryContainer = AmberSecondaryContainerLight,
    onSecondaryContainer = AmberOnSecondaryContainerLight,
    tertiary = CoralTertiaryLight,
    tertiaryContainer = CoralTertiaryContainerLight,
    background = BackgroundLight,
    surface = SurfaceLight,
    surfaceVariant = SurfaceVariantLight,
)

private val DarkColors = darkColorScheme(
    primary = TealPrimaryDark,
    onPrimary = androidx.compose.ui.graphics.Color(0xFF00382A),
    primaryContainer = TealPrimaryContainerDark,
    onPrimaryContainer = TealOnPrimaryContainerDark,
    secondary = AmberSecondaryDark,
    onSecondary = androidx.compose.ui.graphics.Color(0xFF452B00),
    secondaryContainer = AmberSecondaryContainerDark,
    onSecondaryContainer = AmberOnSecondaryContainerDark,
    tertiary = CoralTertiaryDark,
    tertiaryContainer = CoralTertiaryContainerDark,
    background = BackgroundDark,
    surface = SurfaceDark,
    surfaceVariant = SurfaceVariantDark,
)

/**
 * [useDynamicColor] defaults to false: PT Companion has a deliberate brand palette
 * (teal + amber, see Color.kt) rather than a wallpaper-derived one, so the app doesn't
 * read as a generic Compose starter. Dynamic color is still wired up and can be turned
 * on (Android 12+) for users who prefer it.
 */
@Composable
fun PTCompanionTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    useDynamicColor: Boolean = false,
    content: @Composable () -> Unit,
) {
    val context = LocalContext.current
    val colorScheme = when {
        useDynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S ->
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        darkTheme -> DarkColors
        else -> LightColors
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = PTCompanionTypography,
        shapes = PTCompanionShapes,
        content = content,
    )
}
