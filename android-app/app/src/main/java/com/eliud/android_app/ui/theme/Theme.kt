package com.eliud.android_app.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

// RiderLink MX theme: dark slate background, emerald brand, amber accent.
// Same palette as the RiderLink simulator (RiderColors.kt) and as
// LoginScreen / RegisterScreen, so the whole app has one look.
private val RiderColorScheme = darkColorScheme(
    primary = RiderEmerald,
    secondary = RiderAmber,
    tertiary = RiderAmber,
    background = RiderBackground,
    surface = RiderSurface,
    onPrimary = Color.Black,
    onSecondary = Color.Black,
    onTertiary = Color.Black,
    onBackground = RiderText,
    onSurface = RiderText
)

@Composable
fun AndroidappTheme(
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = RiderColorScheme,
        typography = Typography,
        content = content
    )
}