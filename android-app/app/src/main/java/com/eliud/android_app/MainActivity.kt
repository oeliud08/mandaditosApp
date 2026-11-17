package com.eliud.android_app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import com.eliud.android_app.data.RetrofitClient
import com.eliud.android_app.ui.theme.AndroidappTheme
import com.eliud.android_app.ui.theme.LoginScreen
import com.eliud.android_app.ui.theme.RegisterScreen

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            AndroidappTheme {
                setContent {
                    AndroidappTheme {
                        var showRegister by remember { mutableStateOf(false) }

                        if (showRegister) {
                            RegisterScreen(onBackToLogin = { showRegister = false })
                        } else {
                            LoginScreen(onGoToRegister = { showRegister = true })
                        }
                    }
                }

            }
        }
    }
}
