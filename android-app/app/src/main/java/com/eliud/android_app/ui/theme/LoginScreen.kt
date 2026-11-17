package com.eliud.android_app.ui.theme

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import com.eliud.android_app.data.LoginRequest
import com.eliud.android_app.data.RetrofitClient
import kotlinx.coroutines.launch
import androidx.compose.foundation.layout.Row
import com.eliud.android_app.data.LoginResponse
import androidx.compose.material3.TextButton
import androidx.compose.material3.OutlinedButton



@Composable
fun LoginScreen(onGoToRegister: () -> Unit) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var message by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()
    var role by remember { mutableStateOf("client") }
    var user by remember { mutableStateOf(LoginResponse("", 0, "", "")) }


    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.Center
    ) {
        Text(text = "RiderLink MX")
        Spacer(modifier = Modifier.height(16.dp))

        OutlinedTextField(
            value = email,
            onValueChange = { email = it },
            label = { Text("Email") },
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(modifier = Modifier.height(8.dp))

        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            label = { Text("Password") },
            visualTransformation = PasswordVisualTransformation(),
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(modifier = Modifier.height(16.dp))

        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)){
            if (role == "client") {
                Button(onClick = { role = "client" }) { Text("Client") }
            } else {
                OutlinedButton(onClick = { role = "client" }) { Text("Client") }
            }

            if (role == "driver") {
                Button(onClick = { role = "driver" }) { Text("Driver") }
            } else {
                OutlinedButton(onClick = { role = "driver" }) { Text("Driver") }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        var role by remember { mutableStateOf("client") }
        Button(
            onClick = {
                scope.launch {
                    try {
                        val response = RetrofitClient.api.login(
                            LoginRequest(email = email, password = password, role = role)
                        )
                        message = "Welcome ${response.username} (${response.role})"
                    } catch (e: Exception) {
                        message = "Error: ${e.message}"
                    }
                }
            },
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Login")
        }

        Spacer(modifier = Modifier.height(16.dp))
        Text(text = message)
        TextButton(onClick = onGoToRegister) {
            Text("Don't have an account? Register")
        }
    }
}


