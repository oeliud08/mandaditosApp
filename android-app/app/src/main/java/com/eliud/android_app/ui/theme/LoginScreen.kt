package com.eliud.android_app.ui.theme

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.eliud.android_app.data.LoginRequest
import com.eliud.android_app.data.RetrofitClient
import kotlinx.coroutines.launch

private val textFieldColors
    @Composable
    get() = OutlinedTextFieldDefaults.colors(
        focusedBorderColor = RiderEmerald,
        unfocusedBorderColor = RiderTextGrey,
        focusedLabelColor = RiderEmerald,
        unfocusedLabelColor = RiderTextGrey,
        focusedTextColor = RiderText,
        unfocusedTextColor = RiderText,
        cursorColor = RiderEmerald
    )

@Composable
fun LoginScreen(onGoToRegister: () -> Unit) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var role by remember { mutableStateOf("client") }
    var message by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(RiderBackground)
            .padding(24.dp),
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = "RiderLink MX",
            color = RiderEmerald,
            fontSize = 28.sp,
            fontWeight = FontWeight.Bold
        )
        Text(
            text = "Conecta clientes y repas, sin comisiones",
            color = RiderTextGrey,
            fontSize = 14.sp
        )
        Spacer(modifier = Modifier.height(16.dp))

        OutlinedTextField(
            value = email,
            onValueChange = { email = it },
            label = { Text("Email") },
            colors = textFieldColors,
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(modifier = Modifier.height(8.dp))

        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            label = { Text("Password") },
            visualTransformation = PasswordVisualTransformation(),
            colors = textFieldColors,
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(modifier = Modifier.height(16.dp))

        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            if (role == "client") {
                Button(
                    onClick = { role = "client" },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = RiderEmerald,
                        contentColor = Color.Black
                    )
                ) { Text("Client") }
            } else {
                OutlinedButton(onClick = { role = "client" }) {
                    Text("Client", color = RiderText)
                }
            }

            if (role == "driver") {
                Button(
                    onClick = { role = "driver" },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = RiderEmerald,
                        contentColor = Color.Black
                    )
                ) { Text("Driver") }
            } else {
                OutlinedButton(onClick = { role = "driver" }) {
                    Text("Driver", color = RiderText)
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

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
            colors = ButtonDefaults.buttonColors(
                containerColor = RiderEmerald,
                contentColor = Color.Black
            ),
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Login")
        }

        Spacer(modifier = Modifier.height(16.dp))
        Text(text = message, color = RiderText)
        TextButton(onClick = onGoToRegister) {
            Text("Don't have an account? Register", color = RiderAmber)
        }
    }
}
